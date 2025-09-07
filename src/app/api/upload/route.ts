import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { auth } from '@clerk/nextjs/server';

// Robust EPUB metadata extraction using proper ZIP parsing
async function extractEpubMetadata(file: File): Promise<{ title: string; author: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse the EPUB as a ZIP file
    const zip = await import('jszip');
    const zipFile = await zip.default.loadAsync(arrayBuffer);
    
    // Look for the OPF file (usually in META-INF/container.xml)
    let opfPath = '';
    
    // First, try to find container.xml
    if (zipFile.files['META-INF/container.xml']) {
      const containerXml = await zipFile.files['META-INF/container.xml'].async('text');
      const opfMatch = containerXml.match(/full-path="([^"]*\.opf)"/i);
      if (opfMatch) {
        opfPath = opfMatch[1];
      }
    }
    
    // If no container.xml or no OPF found, look for common OPF locations
    if (!opfPath) {
      const possiblePaths = [
        'OEBPS/content.opf',
        'OEBPS/package.opf',
        'content.opf',
        'package.opf',
        'book.opf'
      ];
      
      for (const path of possiblePaths) {
        if (zipFile.files[path]) {
          opfPath = path;
          break;
        }
      }
    }
    
    if (!opfPath || !zipFile.files[opfPath]) {
      console.log('No OPF file found, falling back to filename parsing');
      return parseFilenameForMetadata(file.name);
    }
    
    // Read the OPF file
    const opfContent = await zipFile.files[opfPath].async('text');
    console.log('OPF content found:', opfPath);
    
    // Parse metadata from OPF
    const title = extractFromOpf(opfContent, 'title') || parseFilenameForMetadata(file.name).title;
    const author = extractFromOpf(opfContent, 'creator') || parseFilenameForMetadata(file.name).author;
    
    console.log('Extracted metadata:', { title, author, filename: file.name });
    
    return { title, author };
  } catch (error) {
    console.error('Error extracting EPUB metadata:', error);
    return parseFilenameForMetadata(file.name);
  }
}

// Extract specific metadata from OPF content
function extractFromOpf(opfContent: string, type: 'title' | 'creator'): string | null {
  const patterns = {
    title: [
      /<dc:title[^>]*>([^<]+)<\/dc:title>/i,
      /<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']title["'][^>]*>/i
    ],
    creator: [
      /<dc:creator[^>]*>([^<]+)<\/dc:creator>/i,
      /<dc:creator[^>]*role=["']aut["'][^>]*>([^<]+)<\/dc:creator>/i,
      /<meta[^>]*name=["']creator["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']creator["'][^>]*>/i,
      /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']author["'][^>]*>/i
    ]
  };
  
  for (const pattern of patterns[type]) {
    const match = opfContent.match(pattern);
    if (match && match[1]) {
      return match[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
    }
  }
  
  return null;
}

// Parse filename to extract title and author as fallback
function parseFilenameForMetadata(filename: string): { title: string; author: string } {
  const nameWithoutExt = filename.replace(/\.epub$/i, '');
  
  // Common patterns in filenames: "Author - Title" or "Title - Author"
  const patterns = [
    /^(.+?)\s*-\s*(.+)$/,  // "Author - Title" or "Title - Author"
    /^(.+?)\s*_\s*(.+)$/,  // "Author_Title" or "Title_Author"
    /^(.+?)\s*by\s*(.+)$/i // "Title by Author"
  ];
  
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      const [_, part1, part2] = match;
      
      // Heuristic: if part1 contains common author indicators, it's likely the author
      const authorIndicators = /^(mr|mrs|ms|dr|prof|professor|sir|dame|jr|sr|iii|ii|iv|v)$/i;
      const hasAuthorIndicators = authorIndicators.test(part1.split(' ')[0]);
      
      if (hasAuthorIndicators || part1.length < part2.length) {
        return { author: part1.trim(), title: part2.trim() };
      } else {
        return { title: part1.trim(), author: part2.trim() };
      }
    }
  }
  
  // If no pattern matches, use the whole filename as title
  return { 
    title: nameWithoutExt.replace(/[-_]/g, ' '), 
    author: 'Unknown Author' 
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('Upload API - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('epub') && !file.name.endsWith('.epub')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an EPUB file.' }, { status: 400 });
    }

    // Extract metadata from EPUB
    const { title, author } = await extractEpubMetadata(file);

    // Generate unique filename for storage
    const fileId = randomUUID();
    const fileName = `${fileId}.epub`;
    const filePath = `${userId}/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin!.storage
      .from('books')
      .upload(filePath, buffer, {
        contentType: 'application/epub+zip',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin!.storage
      .from('books')
      .getPublicUrl(filePath);

    // Save book metadata to database
    const bookDataToInsert = {
      user_id: userId,
      title,
      author,
      file_url: urlData.publicUrl,
      file_size: file.size,
      original_filename: file.name
    };
    
    console.log('Inserting book data:', bookDataToInsert);
    
    const { data: bookData, error: dbError } = await supabaseAdmin!
      .from('books')
      .insert(bookDataToInsert)
      .select()
      .single();

    console.log('Database insert result:', { bookData, dbError });

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabaseAdmin!.storage.from('books').remove([filePath]);
      return NextResponse.json({ 
        error: 'Failed to save book metadata',
        details: dbError.message,
        code: dbError.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      book: bookData,
      fileId,
      fileName: uploadData.path,
      originalName: file.name,
      size: file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
