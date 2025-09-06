import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { auth } from '@clerk/nextjs/server';

// Simple EPUB metadata extraction
async function extractEpubMetadata(file: File): Promise<{ title: string; author: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Look for OPF file in EPUB (simplified approach)
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Extract title and author from OPF content (basic regex)
    const titleMatch = text.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const authorMatch = text.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : file.name.replace('.epub', ''),
      author: authorMatch ? authorMatch[1].trim() : 'Unknown Author'
    };
  } catch (error) {
    console.error('Error extracting EPUB metadata:', error);
    return {
      title: file.name.replace('.epub', ''),
      author: 'Unknown Author'
    };
  }
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
