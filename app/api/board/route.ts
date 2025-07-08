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
    const sortOption = searchParams.get('sortOption') || 'latest';
    
    
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
      .eq('status', 'published');
      
    // 필터 조건 먼저 적용
    if (pageId) query = query.eq('page_id', pageId);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (searchTerm) {
      if (searchType === 'title') query = query.ilike('title', `%${searchTerm}%`);
      else if (searchType === 'content') query = query.ilike('content', `%${searchTerm}%`);
      else if (searchType === 'author') query = query.ilike('user_id', `%${searchTerm}%`);
    }
    
    // 정렬 적용 (고정글과 공지글 우선)
    query = query
      .order('is_pinned', { ascending: false })
      .order('is_notice', { ascending: false });
      
    // 정렬 옵션에 따른 데이터베이스 레벨 정렬 (성능 향상)
    switch (sortOption) {
      case 'popular':
        query = query.order('views', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
      // likes와 comments는 여전히 JavaScript 정렬 필요
    }
    
    // pagination 적용 (popular은 이제 DB에서 정렬되므로 바로 pagination 가능)
    if (sortOption === 'likes' || sortOption === 'comments') {
      // 좋아요/댓글 정렬만 더 많이 가져와서 JS 정렬
      query = query.limit(100);
    } else {
      // latest, popular은 DB에서 정렬되므로 바로 pagination
      query = query.range((page - 1) * itemCount, page * itemCount - 1);
    }
    
    const { data: posts, error: postsError } = await query;
    if (postsError) throw postsError;
    
    console.log('API Debug - Raw posts from DB:', posts?.length || 0, 'posts found');
    console.log('API Debug - First post:', posts?.[0]);
    
    let postsWithComments = (posts || []).map((post: any) => ({
      ...post,
      comment_count: post.comment_count?.[0]?.count || 0,
      view_count: post.views || 0,
    }));
    
    // JavaScript 정렬은 likes와 comments만 필요 (popular은 이미 DB에서 정렬됨)
    
    // 좋아요와 댓글 정렬을 위한 추가 처리
    if (sortOption === 'likes') {
      // 각 게시글의 좋아요 수를 조회
      const postsWithLikes = await Promise.all(
        postsWithComments.map(async (post: any) => {
          const { count } = await supabase
            .from('board_like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return {
            ...post,
            likes_count: count || 0
          };
        })
      );
      
      // 좋아요 수로 정렬 (고정글, 공지글 우선 유지)
      postsWithLikes.sort((a: any, b: any) => {
        // 고정글 우선
        if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
        // 공지글 우선
        if (a.is_notice !== b.is_notice) return b.is_notice ? 1 : -1;
        // 좋아요 수로 정렬
        return b.likes_count - a.likes_count;
      });
      
      // 정렬 후 pagination 적용
      const startIndex = (page - 1) * itemCount;
      const endIndex = startIndex + itemCount;
      postsWithComments = postsWithLikes.slice(startIndex, endIndex);
      
    } else if (sortOption === 'comments') {
      // 댓글 수로 정렬 (이미 comment_count가 있으므로)
      postsWithComments.sort((a: any, b: any) => {
        // 고정글 우선
        if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
        // 공지글 우선
        if (a.is_notice !== b.is_notice) return b.is_notice ? 1 : -1;
        // 댓글 수로 정렬
        return b.comment_count - a.comment_count;
      });
      
      // 정렬 후 pagination 적용
      const startIndex = (page - 1) * itemCount;
      const endIndex = startIndex + itemCount;
      postsWithComments = postsWithComments.slice(startIndex, endIndex);
    }
    
    console.log('API Debug - Posts with comments:', postsWithComments.length);
    
    // 3. 작성자 정보 조회
    const userIds = postsWithComments
      .map(post => post.user_id)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, self) => self.indexOf(id) === index);
      
    let authorInfoMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, username, nickname, avatar_url')
        .in('id', userIds);
        
      (users || []).forEach((user: any) => {
        authorInfoMap[user.id] = {
          username: user.nickname || user.username || '익명',
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