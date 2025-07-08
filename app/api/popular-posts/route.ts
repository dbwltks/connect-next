import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const sortBy = searchParams.get('sortBy') as 'views' | 'likes' | 'comments' || 'views';
    
    const supabase = await createClient();
    
    let query;
    if (sortBy === 'comments') {
      // 댓글 수로 정렬하는 경우 JOIN 쿼리 사용
      query = supabase
        .from('board_posts')
        .select(`
          *, 
          comment_count:board_comments(count)
        `)
        .eq('status', 'published')
        .limit(limit);
    } else if (sortBy === 'likes') {
      // 좋아요 수로 정렬하는 경우 - 별도로 처리
      query = supabase
        .from('board_posts')
        .select('*')
        .eq('status', 'published')
        .limit(50); // 더 많이 가져와서 나중에 정렬
    } else {
      // 조회수로 정렬 (기본값)
      query = supabase
        .from('board_posts')
        .select('*')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('인기 게시물 조회 실패:', error);
      throw error;
    }

    // 댓글 수 또는 좋아요 수로 정렬하는 경우 클라이언트에서 정렬
    let sortedPosts = posts || [];
    if (sortBy === 'comments' && posts) {
      sortedPosts = [...posts].sort((a: any, b: any) => {
        const aCount = a.comment_count?.[0]?.count || 0;
        const bCount = b.comment_count?.[0]?.count || 0;
        return bCount - aCount;
      });
    } else if (sortBy === 'likes' && posts) {
      // 각 게시글의 좋아요 수를 별도로 조회
      const postsWithLikes = await Promise.all(
        posts.map(async (post: any) => {
          const { count } = await supabase
            .from('board_like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            like_count: [{ count: count || 0 }]
          };
        })
      );
      
      sortedPosts = postsWithLikes.sort((a: any, b: any) => {
        const aCount = a.like_count?.[0]?.count || 0;
        const bCount = b.like_count?.[0]?.count || 0;
        return bCount - aCount;
      }).slice(0, limit); // 원하는 수만큼만 자르기
    }

    // 좋아요 수를 추가 (likes 정렬이 아닌 경우)
    if (sortBy !== 'likes' && sortedPosts && sortedPosts.length > 0) {
      const postsWithLikes = await Promise.all(
        sortedPosts.map(async (post: any) => {
          const { count } = await supabase
            .from('board_like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            like_count: [{ count: count || 0 }]
          };
        })
      );
      sortedPosts = postsWithLikes;
    }

    // 사용자 정보를 수동으로 조회
    let postsWithUsers = sortedPosts;
    if (sortedPosts && sortedPosts.length > 0) {
      const userIds = Array.from(
        new Set(sortedPosts.map((post: any) => post.user_id).filter(Boolean))
      );

      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, username, nickname, display_name')
          .in('id', userIds);

        userMap = new Map(users?.map((user) => [user.id, user]) || []);
      }

      // 모든 게시글에 author 필드 추가 (사용자 정보가 없어도)
      postsWithUsers = sortedPosts.map((post: any) => {
        const user = userMap.get(post.user_id);
        return {
          ...post,
          comment_count: post.comment_count?.[0]?.count || 0,
          like_count: post.like_count?.[0]?.count || 0,
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

    return NextResponse.json({ posts: postsWithUsers, menuUrlMap });
  } catch (error) {
    console.error('Popular posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular posts' },
      { status: 500 }
    );
  }
}