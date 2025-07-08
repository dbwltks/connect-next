import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    const supabase = await createClient();
    
    const { data: comments, error } = await supabase
      .from('board_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('최근 댓글 조회 실패:', error);
      throw error;
    }

    // 게시물과 사용자 정보를 수동으로 조회
    let commentsWithData = comments || [];
    if (comments && comments.length > 0) {
      const postIds = Array.from(
        new Set(comments.map((comment: any) => comment.post_id).filter(Boolean))
      );
      const userIds = Array.from(
        new Set(comments.map((comment: any) => comment.user_id).filter(Boolean))
      );

      // 게시물 정보 조회 (page_id 포함)
      let postsMap = new Map();
      if (postIds.length > 0) {
        const { data: posts } = await supabase
          .from('board_posts')
          .select('id, title, page_id')
          .in('id', postIds);

        postsMap = new Map(posts?.map((post) => [post.id, post]) || []);
      }

      // 사용자 정보 조회
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, username, nickname')
          .in('id', userIds);

        usersMap = new Map(users?.map((user) => [user.id, user]) || []);
      }

      // 모든 댓글에 author 필드 추가 (사용자 정보가 없어도)
      commentsWithData = comments.map((comment: any) => {
        const user = usersMap.get(comment.user_id);
        return {
          ...comment,
          board_posts: postsMap.get(comment.post_id) || null,
          users: user || null,
          author: user ? (user.nickname || user.username || '익명') : '익명',
        };
      });
    }

    // 메뉴 URL 매핑 정보 조회
    let menuUrlMap: Record<string, string> = {};
    if (commentsWithData && commentsWithData.length > 0) {
      const pageIds = Array.from(
        new Set(commentsWithData.map((comment: any) => comment.board_posts?.page_id).filter(Boolean))
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

    return NextResponse.json({ comments: commentsWithData, menuUrlMap });
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}