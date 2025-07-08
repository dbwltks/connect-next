import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('cms_layout')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (pageId) {
      query = query.eq('page_id', pageId);
    } else {
      query = query.is('page_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Widget fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch widgets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}