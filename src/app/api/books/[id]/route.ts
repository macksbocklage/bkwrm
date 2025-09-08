import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { UpdateBookData } from '@/lib/types';

// GET /api/books/[id] - Get a specific book
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching book with ID:', params.id);
    
    const { userId } = await auth();
    console.log('User ID:', userId);
    
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
      .eq('id', params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch book',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!books || books.length === 0) {
      console.log('No book found with ID:', params.id, 'for user:', userId);
      
      // Let's also check if the book exists with any user ID
      const { data: allBooks, error: allBooksError } = await supabase!
        .from('books')
        .select('id, user_id, title')
        .eq('id', params.id);
      
      console.log('Book exists with any user ID:', allBooks);
      
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (books.length > 1) {
      console.warn('Multiple books found with same ID:', params.id);
    }

    const book = books[0];
    console.log('Found book:', book);

    return NextResponse.json({ book });

  } catch (error) {
    console.error('Book fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch book',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/books/[id] - Update book progress or last read time
export async function PATCH(
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

    const body: UpdateBookData = await request.json();
    const { last_read_at, reading_progress, current_location } = body;

    // Validate reading progress if provided
    if (reading_progress !== undefined && (reading_progress < 0 || reading_progress > 100)) {
      return NextResponse.json({ error: 'Reading progress must be between 0 and 100' }, { status: 400 });
    }

    const updateData: any = {};
    if (last_read_at !== undefined) updateData.last_read_at = last_read_at;
    if (reading_progress !== undefined) updateData.reading_progress = reading_progress;
    if (current_location !== undefined) updateData.current_location = current_location;

    const { data: book, error } = await supabase!
      .from('books')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !book) {
      return NextResponse.json({ error: 'Book not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ book });

  } catch (error) {
    console.error('Book update error:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}
