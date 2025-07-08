import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const itemCount = parseInt(searchParams.get('itemCount') || '10');
    const searchType = searchParams.get('searchType') || 'title';
    const searchTerm = searchParams.get('searchTerm') || '';
    
    const supabase = await createClient();
    
    // 1. 전체 게시글 수 조회
    let countQuery = supabase
      .from('board_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
      
    if (pageId) countQuery = countQuery.eq('page_id', pageId);
    if (categoryId) countQuery = countQuery.eq('category_id', categoryId);
    if (searchTerm) {
      if (searchType === 'title') countQuery = countQuery.ilike('title', `%${searchTerm}%`);
      else if (searchType === 'content') countQuery = countQuery.ilike('content', `%${searchTerm}%`);
      else if (searchType === 'author') countQuery = countQuery.ilike('user_id', `%${searchTerm}%`);
    }
    
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;
    
    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemCount));
    
    // 2. 실제 게시글 목록 조회
    let query = supabase
      .from('board_posts')
      .select(`
        id, title, content, user_id, created_at, views, category_id, page_id, 
        is_notice, is_pinned, comment_count:board_comments(count), 
        thumbnail_image, status, published_at, tags
      `)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * itemCount, page * itemCount - 1);
      
    if (pageId) query = query.eq('page_id', pageId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (searchTerm) {
      if (searchType === 'title') query = query.ilike('title', `%${searchTerm}%`);
      else if (searchType === 'content') query = query.ilike('content', `%${searchTerm}%`);
      else if (searchType === 'author') query = query.ilike('user_id', `%${searchTerm}%`);
    }
    
    const { data: posts, error: postsError } = await query;
    if (postsError) throw postsError;
    
    const postsWithComments = (posts || []).map((post: any) => ({
      ...post,
      comment_count: post.comment_count?.[0]?.count || 0,
      view_count: post.views || 0,
    }));
    
    // 3. 작성자 정보 조회
    const userIds = postsWithComments
      .map(post => post.user_id)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, self) => self.indexOf(id) === index);
      
    let authorInfoMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);
        
      (users || []).forEach((user: any) => {
        authorInfoMap[user.id] = {
          username: user.username || '익명',
          avatar_url: user.avatar_url,
        };
      });
    }
    
    return NextResponse.json({
      posts: postsWithComments,
      totalCount,
      totalPages,
      authorInfoMap,
    });
    
  } catch (error) {
    console.error('Board API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board data' },
      { status: 500 }
    );
  }
}