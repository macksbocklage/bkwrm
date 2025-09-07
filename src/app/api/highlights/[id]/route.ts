import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { UpdateHighlightData } from '@/lib/types';

// PUT /api/highlights/[id] - Update a highlight
export async function PUT(
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

    const body: UpdateHighlightData = await request.json();
    const { text, color } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (text !== undefined) updateData.text = text.trim();
    if (color !== undefined) updateData.color = color;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: highlight, error } = await supabaseAdmin!
      .from('highlights')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to update highlight',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!highlight) {
      return NextResponse.json({ error: 'Highlight not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ highlight });

  } catch (error) {
    console.error('Highlight update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update highlight',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/highlights/[id] - Delete a highlight
export async function DELETE(
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

    const { data: highlight, error } = await supabaseAdmin!
      .from('highlights')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to delete highlight',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    if (!highlight) {
      return NextResponse.json({ error: 'Highlight not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Highlight deleted successfully' });

  } catch (error) {
    console.error('Highlight deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete highlight',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
