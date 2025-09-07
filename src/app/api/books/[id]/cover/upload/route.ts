import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const bookId = params.id;

    // Get the book to verify ownership
    const { data: book, error: fetchError } = await supabaseAdmin!
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const data = await request.formData();
    const file: File | null = data.get('cover') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No cover image uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Please upload an image smaller than 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename for cover image
    const coverId = randomUUID();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const coverFileName = `cover_${coverId}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload cover image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin!.storage
      .from('book-covers')
      .upload(coverFileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Cover upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload cover image',
        details: uploadError.message
      }, { status: 500 });
    }

    // Get public URL for the cover image
    const { data: urlData } = supabaseAdmin!.storage
      .from('book-covers')
      .getPublicUrl(coverFileName);

    // Update book record with new cover image URL
    const { error: updateError } = await supabaseAdmin!
      .from('books')
      .update({ cover_image_url: urlData.publicUrl })
      .eq('id', bookId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating book with new cover URL:', updateError);
      // Clean up uploaded file if database update fails
      await supabaseAdmin!.storage.from('book-covers').remove([coverFileName]);
      return NextResponse.json({ 
        error: 'Failed to update book cover',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      coverImageUrl: urlData.publicUrl,
      message: 'Cover image updated successfully'
    });

  } catch (error) {
    console.error('Cover upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload cover image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
