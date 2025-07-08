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

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, username, display_name')
          .in('id', userIds);

        const userMap = new Map(users?.map((user) => [user.id, user]) || []);

        postsWithUsers = sortedPosts.map((post: any) => ({
          ...post,
          users: userMap.get(post.user_id) || null,
        }));
      }
    }

    if (type === 'media') {
      return NextResponse.json({ posts: postsWithUsers });
    }

    return NextResponse.json(postsWithUsers);
  } catch (error) {
    console.error('Board posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board posts' },
      { status: 500 }
    );
  }
}