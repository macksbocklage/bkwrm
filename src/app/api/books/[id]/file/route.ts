import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET /api/books/[id]/file - Serve the EPUB file securely
// Also handles EPUB internal files like container.xml, content.opf, etc.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('File proxy - Book ID:', id);
    
    const { userId } = await auth();
    console.log('File proxy - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    // First, verify the user owns this book
    const { data: book, error: bookError } = await supabaseAdmin!
      .from('books')
      .select('file_url, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log('File proxy - Book query result:', { book, bookError });

    if (bookError || !book) {
      console.log('File proxy - Book not found for user:', userId);
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Extract the file path from the signed URL
    const url = new URL(book.file_url);
    const filePath = url.pathname.split('/storage/v1/object/public/books/')[1] || 
                    url.pathname.split('/storage/v1/object/books/')[1];
    
    console.log('File proxy - Extracted file path:', filePath);
    console.log('File proxy - Original URL:', book.file_url);
    
    if (!filePath) {
      console.log('File proxy - Could not extract file path from URL');
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin!.storage
      .from('books')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Convert to buffer
    const buffer = await fileData.arrayBuffer();

    // Return the file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `inline; filename="${id}.epub"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json({ 
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
