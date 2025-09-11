import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    console.log('Test highlights API called');
    
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        error: 'Supabase is not configured' 
      }, { status: 500 });
    }

    // Test if highlights table exists (simplified check)
    const { data: highlights, error: highlightsError } = await supabaseAdmin!
      .from('highlights')
      .select('*')
      .limit(1);

    console.log('Highlights query result:', { highlights, highlightsError });

    // Test if we can insert a test record
    const testData = {
      user_id: userId,
      book_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      text: 'Test highlight',
      start_cfi: 'test-start',
      end_cfi: 'test-end',
      color: '#ffff00'
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin!
      .from('highlights')
      .insert(testData)
      .select()
      .single();

    console.log('Test insert result:', { insertResult, insertError });

    return NextResponse.json({
      success: true,
      userId,
      supabaseConfigured: isSupabaseConfigured,
      tableExists: !highlightsError, // If we can query it, it exists
      highlightsQuery: {
        success: !highlightsError,
        error: highlightsError?.message,
        count: highlights?.length || 0
      },
      testInsert: {
        success: !insertError,
        error: insertError?.message,
        data: insertResult
      }
    });

  } catch (error) {
    console.error('Test highlights error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
