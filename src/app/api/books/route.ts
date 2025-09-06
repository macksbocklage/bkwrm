import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET /api/books - Get all books for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('Books API - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    const { data: books, error } = await supabase!
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    console.log('Books query result:', { books, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch books',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('Returning books:', books);
    return NextResponse.json({ books });

  } catch (error) {
    console.error('Books fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch books',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/books - Delete a book (requires bookId in query params)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // First, get the book to verify ownership and get file path
    const { data: book, error: fetchError } = await supabase!
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Extract file path from URL for storage deletion
    const filePath = book.file_url.split('/').slice(-2).join('/'); // Get userId/filename from URL

    // Delete from storage
    const { error: storageError } = await supabase!.storage
      .from('books')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase!
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Book deleted successfully' });

  } catch (error) {
    console.error('Book deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
