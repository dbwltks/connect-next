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

      // 게시물 정보 조회
      let postsMap = new Map();
      if (postIds.length > 0) {
        const { data: posts } = await supabase
          .from('board_posts')
          .select('id, title')
          .in('id', postIds);

        postsMap = new Map(posts?.map((post) => [post.id, post]) || []);
      }

      // 사용자 정보 조회
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, username')
          .in('id', userIds);

        usersMap = new Map(users?.map((user) => [user.id, user]) || []);
      }

      commentsWithData = comments.map((comment: any) => ({
        ...comment,
        board_posts: postsMap.get(comment.post_id) || null,
        users: usersMap.get(comment.user_id) || null,
      }));
    }

    return NextResponse.json(commentsWithData);
  } catch (error) {
    console.error('Comments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}