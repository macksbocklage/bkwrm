import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Robust EPUB metadata extraction using proper ZIP parsing
async function extractEpubMetadata(fileUrl: string): Promise<{ title: string; author: string }> {
  try {
    // Fetch the EPUB file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch EPUB file');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
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
      return { title: 'Unknown Title', author: 'Unknown Author' };
    }
    
    // Read the OPF file
    const opfContent = await zipFile.files[opfPath].async('text');
    console.log('OPF content found:', opfPath);
    
    // Parse metadata from OPF
    const title = extractFromOpf(opfContent, 'title') || 'Unknown Title';
    const author = extractFromOpf(opfContent, 'creator') || 'Unknown Author';
    
    console.log('Extracted metadata:', { title, author });
    
    return { title, author };
  } catch (error) {
    console.error('Error extracting EPUB metadata:', error);
    return { title: 'Unknown Title', author: 'Unknown Author' };
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    // Get all books for the user
    const { data: books, error: fetchError } = await supabaseAdmin!
      .from('books')
      .select('id, file_url, title, author')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching books:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch books',
        details: fetchError.message
      }, { status: 500 });
    }

    if (!books || books.length === 0) {
      return NextResponse.json({ 
        message: 'No books found to update',
        updated: 0
      });
    }

    let updatedCount = 0;
    const results = [];

    // Process each book
    for (const book of books) {
      try {
        console.log(`Processing book: ${book.id}`);
        
        // Extract metadata from the EPUB file
        const { title, author } = await extractEpubMetadata(book.file_url);
        
        // Only update if we found better metadata
        if (title !== 'Unknown Title' || author !== 'Unknown Author') {
          const { error: updateError } = await supabaseAdmin!
            .from('books')
            .update({ title, author })
            .eq('id', book.id);

          if (updateError) {
            console.error(`Error updating book ${book.id}:`, updateError);
            results.push({ id: book.id, success: false, error: updateError.message });
          } else {
            console.log(`Updated book ${book.id}: ${title} by ${author}`);
            results.push({ id: book.id, success: true, title, author });
            updatedCount++;
          }
        } else {
          results.push({ id: book.id, success: false, error: 'No metadata found' });
        }
      } catch (error) {
        console.error(`Error processing book ${book.id}:`, error);
        results.push({ 
          id: book.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({ 
      message: `Updated ${updatedCount} out of ${books.length} books`,
      updated: updatedCount,
      total: books.length,
      results
    });

  } catch (error) {
    console.error('Re-extract metadata error:', error);
    return NextResponse.json({ 
      error: 'Failed to re-extract metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
