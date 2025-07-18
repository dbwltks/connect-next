import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 모든 활성 메뉴 데이터를 한 번에 조회
    const { data: allMenus, error } = await supabase
      .from('cms_menus')
      .select('id, title, url, parent_id, order_num')
      .eq('is_active', true)
      .order('order_num', { ascending: true });
    
    if (error) throw error;
    
    // 클라이언트 사이드에서 트리 구조 구성
    const buildMenuTree = (items: any[]) => {
      const rootItems = items.filter(item => item.parent_id === null);
      
      const findChildren = (parentId: string, allItems: any[]): any[] => {
        const children = allItems.filter(item => item.parent_id === parentId);
        return children.map(child => ({
          ...child,
          submenu: findChildren(child.id, allItems)
        }));
      };
      
      return rootItems.map(item => ({
        ...item,
        submenu: findChildren(item.id, items)
      }));
    };
    
    const menuTree = buildMenuTree(allMenus || []);
    
    // 캐시 헤더 추가
    const response = NextResponse.json(menuTree);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5분 브라우저 캐시, 10분 CDN 캐시
    
    return response;
    
  } catch (error) {
    console.error('Header menus API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch header menus' },
      { status: 500 }
    );
  }
}