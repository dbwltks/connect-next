import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 최상위 메뉴들 조회 (parent_id가 null인 것들)
    const { data: topLevelMenus, error: topError } = await supabase
      .from('cms_menus')
      .select('id, title, url, parent_id, order_num')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('order_num', { ascending: true });
    
    if (topError) throw topError;
    
    // 각 최상위 메뉴의 하위 메뉴들 조회
    const menusWithSubmenu = await Promise.all(
      (topLevelMenus || []).map(async (menu) => {
        const { data: submenus, error: subError } = await supabase
          .from('cms_menus')
          .select('id, title, url, parent_id, order_num')
          .eq('parent_id', menu.id)
          .eq('is_active', true)
          .order('order_num', { ascending: true });
        
        if (subError) {
          console.error(`Error fetching submenus for ${menu.id}:`, subError);
          return { ...menu, submenu: [] };
        }
        
        return {
          ...menu,
          submenu: submenus || []
        };
      })
    );
    
    return NextResponse.json(menusWithSubmenu);
    
  } catch (error) {
    console.error('Header menus API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch header menus' },
      { status: 500 }
    );
  }
}