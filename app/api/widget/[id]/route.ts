import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const widgetId = id;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('cms_layout')
      .select('*')
      .eq('id', widgetId)
      .single();

    if (error) {
      console.error('위젯 조회 실패:', error);
      return NextResponse.json(
        { error: 'Failed to fetch widget', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}