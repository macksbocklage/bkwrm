import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const health = {
      supabaseConfigured: isSupabaseConfigured,
      timestamp: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        ...health,
        error: 'Supabase not configured',
        message: 'Please set up your environment variables'
      });
    }

    // Test database connection
    try {
      const { data, error } = await supabaseAdmin!.from('books').select('count').limit(1);
      health['database'] = {
        connected: !error,
        error: error?.message
      };
    } catch (dbError) {
      health['database'] = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Test storage connection
    try {
      const { data, error } = await supabaseAdmin!.storage.from('books').list('', { limit: 1 });
      health['storage'] = {
        connected: !error,
        error: error?.message
      };
    } catch (storageError) {
      health['storage'] = {
        connected: false,
        error: storageError instanceof Error ? storageError.message : 'Unknown storage error'
      };
    }

    return NextResponse.json(health);

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
