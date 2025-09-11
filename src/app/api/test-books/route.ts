import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    console.log('Test Books API - User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured. Please set up your environment variables.' 
      }, { status: 500 });
    }

    // Test the books query
    const { data: books, error } = await supabase!
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    console.log('Test Books query result:', { books, error });

    return NextResponse.json({ 
      success: true,
      userId,
      booksCount: books?.length || 0,
      books: books || [],
      error: error?.message || null
    });
  } catch (error) {
    console.error('Test Books error:', error);
    return NextResponse.json({ 
      error: 'Test Books failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
