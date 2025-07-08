import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentMenuId = searchParams.get('parentMenuId');
    const pathname = searchParams.get('pathname');
    
    const supabase = await createClient();
    
    let parentMenu = null;
    let childMenus = [];
    
    if (parentMenuId) {
      // 지정된 부모 메뉴 ID로 조회
      const { data, error } = await supabase
        .from('cms_menus')
        .select('id, title, url, parent_id')
        .eq('id', parentMenuId)
        .single();
      
      if (error) throw error;
      parentMenu = data;
    } else if (pathname) {
      // 현재 경로로 메뉴 찾기
      const { data: currentMenu, error: currentMenuError } = await supabase
        .from('cms_menus')
        .select('id, title, url, parent_id')
        .eq('url', pathname)
        .single();
      
      if (currentMenuError) {
        // 상위 경로로 찾기
        let parentPath = pathname;
        while (parentPath.includes('/')) {
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
          if (!parentPath) break;
          
          const { data: foundMenu } = await supabase
            .from('cms_menus')
            .select('id, title, url, parent_id')
            .eq('url', parentPath)
            .single();
          
          if (foundMenu) {
            parentMenu = foundMenu;
            break;
          }
        }
      } else if (currentMenu?.parent_id) {
        // 현재 메뉴의 부모 찾기
        const { data: parentData, error: parentErr } = await supabase
          .from('cms_menus')
          .select('id, title, url, parent_id')
          .eq('id', currentMenu.parent_id)
          .single();
        
        if (parentErr) throw parentErr;
        parentMenu = parentData;
      } else {
        parentMenu = currentMenu;
      }
    }
    
    // 자식 메뉴들 조회
    if (parentMenu) {
      const { data: children, error: childrenError } = await supabase
        .from('cms_menus')
        .select('id, title, url, parent_id')
        .eq('parent_id', parentMenu.id)
        .eq('is_active', true)
        .order('order_num', { ascending: true });
      
      if (childrenError) throw childrenError;
      childMenus = children || [];
    }
    
    return NextResponse.json({ 
      parentMenu, 
      childMenus 
    });
    
  } catch (error) {
    console.error('Menus API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}