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
    } else {
      // 조회수로 정렬
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

    // 댓글 수로 정렬하는 경우 클라이언트에서 정렬
    let sortedPosts = posts || [];
    if (sortBy === 'comments' && posts) {
      sortedPosts = [...posts].sort((a: any, b: any) => {
        const aCount = a.comment_count?.[0]?.count || 0;
        const bCount = b.comment_count?.[0]?.count || 0;
        return bCount - aCount;
      });
    }

    // 사용자 정보를 수동으로 조회
    let postsWithUsers = sortedPosts;
    if (sortedPosts && sortedPosts.length > 0) {
      const userIds = Array.from(
        new Set(sortedPosts.map((post: any) => post.user_id).filter(Boolean))
      );

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, username, display_name')
          .in('id', userIds);

        const userMap = new Map(users?.map((user) => [user.id, user]) || []);

        postsWithUsers = sortedPosts.map((post: any) => ({
          ...post,
          comment_count: post.comment_count?.[0]?.count || 0,
          users: userMap.get(post.user_id) || null,
        }));
      }
    }

    return NextResponse.json({ posts: postsWithUsers });
  } catch (error) {
    console.error('Popular posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular posts' },
      { status: 500 }
    );
  }
}