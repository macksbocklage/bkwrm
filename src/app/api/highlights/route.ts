import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { CreateHighlightData } from '@/lib/types';

// GET /api/highlights?bookId=xxx - Get all highlights for a book
export async function GET(request: NextRequest) {
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

    const { data: highlights, error } = await supabaseAdmin!
      .from('highlights')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch highlights',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ highlights });

  } catch (error) {
    console.error('Highlights fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch highlights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/highlights - Create a new highlight
export async function POST(request: NextRequest) {
  try {
    console.log('Highlights API POST request received');
    
    const { userId } = await auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No user ID found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      console.log('Supabase not configured');
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    const body: CreateHighlightData = await request.json();
    console.log('Request body:', body);
    const { book_id, text, start_cfi, end_cfi, color = '#ffff00' } = body;

    // Validate required fields
    if (!book_id || !text || !start_cfi || !end_cfi) {
      console.log('Missing required fields:', { book_id: !!book_id, text: !!text, start_cfi: !!start_cfi, end_cfi: !!end_cfi });
      return NextResponse.json({ 
        error: 'Missing required fields: book_id, text, start_cfi, end_cfi' 
      }, { status: 400 });
    }

    // Verify the book belongs to the user
    console.log('Checking if book exists for user:', { book_id, userId });
    const { data: book, error: bookError } = await supabaseAdmin!
      .from('books')
      .select('id')
      .eq('id', book_id)
      .eq('user_id', userId)
      .single();

    console.log('Book check result:', { book, bookError });

    if (bookError || !book) {
      console.log('Book not found or access denied');
      return NextResponse.json({ error: 'Book not found or access denied' }, { status: 404 });
    }

    const highlightData = {
      user_id: userId,
      book_id,
      text: text.trim(),
      start_cfi,
      end_cfi,
      color
    };

    console.log('Inserting highlight data:', highlightData);
    const { data: highlight, error } = await supabaseAdmin!
      .from('highlights')
      .insert(highlightData)
      .select()
      .single();

    console.log('Highlight insert result:', { highlight, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to create highlight',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('Highlight created successfully:', highlight);
    return NextResponse.json({ highlight }, { status: 201 });

  } catch (error) {
    console.error('Highlight creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create highlight',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
