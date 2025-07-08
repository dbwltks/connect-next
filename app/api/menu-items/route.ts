import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('cms_menus')
      .select('*')
      .eq('parent_id', parentId || null)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('메뉴 항목 조회 실패:', error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Menu items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}