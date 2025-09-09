import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Extract cover image from EPUB file
async function extractCoverImage(fileUrl: string): Promise<{ coverImageUrl: string | null; coverImagePath: string | null }> {
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
    
    // Look for the OPF file to find cover image reference
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
      console.log('No OPF file found, cannot extract cover');
      return { coverImageUrl: null, coverImagePath: null };
    }
    
    // Read the OPF file
    const opfContent = await zipFile.files[opfPath].async('text');
    console.log('OPF content found:', opfPath);
    
    // Extract cover image path from OPF
    const coverImagePath = extractCoverFromOpf(opfContent, opfPath);
    
    if (!coverImagePath || !zipFile.files[coverImagePath]) {
      console.log('No cover image found in EPUB');
      return { coverImageUrl: null, coverImagePath: null };
    }
    
    // Get the cover image file
    const coverImageFile = zipFile.files[coverImagePath];
    const coverImageBuffer = await coverImageFile.async('arraybuffer');
    
    // Generate unique filename for cover image
    const coverId = Math.random().toString(36).substring(2, 15);
    const coverFileName = `cover_${coverId}.${getImageExtension(coverImagePath)}`;
    
    // Upload cover image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin!.storage
      .from('book-covers')
      .upload(coverFileName, coverImageBuffer, {
        contentType: getImageMimeType(coverImagePath),
        upsert: false
      });

    if (uploadError) {
      console.error('Cover upload error:', uploadError);
      return { coverImageUrl: null, coverImagePath: null };
    }

    // Get public URL for the cover image
    const { data: urlData } = supabaseAdmin!.storage
      .from('book-covers')
      .getPublicUrl(coverFileName);

    return { 
      coverImageUrl: urlData.publicUrl, 
      coverImagePath: coverFileName 
    };
    
  } catch (error) {
    console.error('Error extracting cover image:', error);
    return { coverImageUrl: null, coverImagePath: null };
  }
}

// Extract cover image path from OPF content
function extractCoverFromOpf(opfContent: string, opfPath: string): string | null {
  // Look for cover image in manifest
  const manifestMatch = opfContent.match(/<item[^>]*id=["']cover-image["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (manifestMatch) {
    const coverPath = manifestMatch[1];
    // Resolve relative path
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    return opfDir + coverPath;
  }
  
  // Look for cover image in guide
  const guideMatch = opfContent.match(/<reference[^>]*type=["']cover["'][^>]*title=["']Cover["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (guideMatch) {
    const coverPath = guideMatch[1];
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    return opfDir + coverPath;
  }
  
  // Look for common cover image filenames
  const commonCoverNames = [
    'cover.jpg', 'cover.jpeg', 'cover.png', 'cover.gif',
    'cover-image.jpg', 'cover-image.jpeg', 'cover-image.png',
    'titlepage.jpg', 'titlepage.jpeg', 'titlepage.png'
  ];
  
  for (const coverName of commonCoverNames) {
    const coverMatch = opfContent.match(new RegExp(`<item[^>]*href=["']([^"']*${coverName})["'][^>]*>`, 'i'));
    if (coverMatch) {
      const coverPath = coverMatch[1];
      const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
      return opfDir + coverPath;
    }
  }
  
  return null;
}

// Get image extension from path
function getImageExtension(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  return ext || 'jpg';
}

// Get MIME type from image extension
function getImageMimeType(path: string): string {
  const ext = getImageExtension(path);
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// GET /api/books/[id]/cover - Extract and return cover image for a book
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    const bookId = id;

    // Get the book to verify ownership and get file URL
    const { data: book, error: fetchError } = await supabaseAdmin!
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if cover already exists
    if (book.cover_image_url) {
      return NextResponse.json({ 
        success: true, 
        coverImageUrl: book.cover_image_url 
      });
    }

    // Extract cover image
    const { coverImageUrl, coverImagePath } = await extractCoverImage(book.file_url);

    if (!coverImageUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'No cover image found in EPUB' 
      });
    }

    // Update book record with cover image URL
    const { error: updateError } = await supabaseAdmin!
      .from('books')
      .update({ cover_image_url: coverImageUrl })
      .eq('id', bookId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating book with cover URL:', updateError);
      // Still return the cover URL even if database update fails
    }

    return NextResponse.json({ 
      success: true, 
      coverImageUrl,
      coverImagePath 
    });

  } catch (error) {
    console.error('Cover extraction error:', error);
    return NextResponse.json({ 
      error: 'Failed to extract cover image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
