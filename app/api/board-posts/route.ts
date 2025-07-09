import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const boardId = searchParams.get('boardId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const type = searchParams.get('type') || 'widget'; // widget, media, section
    
    const supabase = await createClient();
    
    let query = supabase
      .from('board_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (boardId) {
      // boardId는 실제로는 pageId를 의미 (호환성 유지)
      query = query.eq('page_id', boardId);
    } else if (pageId) {
      query = query.eq('page_id', pageId);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    // 정렬 처리 (published_at 우선)
    const sortedPosts = [...(posts || [])].sort((a: any, b: any) => {
      const aDate = new Date(a.published_at || a.created_at);
      const bDate = new Date(b.published_at || b.created_at);
      const timeDiff = bDate.getTime() - aDate.getTime();

      if (timeDiff === 0) {
        return a.id.localeCompare(b.id);
      }
      return timeDiff;
    });

    // 사용자 정보 조회
    let postsWithUsers = sortedPosts;
    if (posts && posts.length > 0) {
      const userIds = Array.from(
        new Set(posts.map((post: any) => post.user_id).filter(Boolean))
      );

      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, username, nickname, display_name')
          .in('id', userIds);

        userMap = new Map(users?.map((user: any) => [user.id, user]) || []);
      }

      // 좋아요 수 추가
      const postsWithLikes = await Promise.all(
        sortedPosts.map(async (post: any) => {
          const { count } = await supabase
            .from('board_like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            likes_count: count || 0  // likes_count 필드로 추가
          };
        })
      );

      // 모든 게시글에 author 필드 추가 (사용자 정보가 없어도)
      postsWithUsers = postsWithLikes.map((post: any) => {
        const user = userMap.get(post.user_id);
        return {
          ...post,
          users: user || null,
          author: user ? (user.nickname || user.username || '익명') : '익명',
        };
      });
    }

    // 메뉴 URL 매핑 정보 조회
    let menuUrlMap: Record<string, string> = {};
    if (postsWithUsers && postsWithUsers.length > 0) {
      const pageIds = Array.from(
        new Set(postsWithUsers.map((post: any) => post.page_id).filter(Boolean))
      );

      if (pageIds.length > 0) {
        const { data: menuItems } = await supabase
          .from('cms_menus')
          .select('page_id, url')
          .in('page_id', pageIds)
          .not('url', 'is', null);

        if (menuItems) {
          menuUrlMap = menuItems.reduce((acc: Record<string, string>, item: any) => {
            if (item.page_id && item.url) {
              acc[item.page_id] = item.url;
            }
            return acc;
          }, {});
        }
      }
    }

    if (type === 'media') {
      return NextResponse.json({ posts: postsWithUsers, menuUrlMap });
    }

    return NextResponse.json({ posts: postsWithUsers, menuUrlMap });
  } catch (error) {
    console.error('Board posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board posts' },
      { status: 500 }
    );
  }
}