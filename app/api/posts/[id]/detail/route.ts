import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    console.log('API Debug - postId:', postId);
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 1. 게시글 기본 정보 조회
    const { data: post, error: postError } = await supabase
      .from('board_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      // 더 자세한 에러 정보 반환
      return NextResponse.json({ 
        error: 'Post not found', 
        details: postError?.message || 'No post data',
        postId 
      }, { status: 404 });
    }

    // 2. 작성자 정보 조회
    let authorInfo = null;
    if (post.user_id) {
      const { data: userInfo } = await supabase
        .from('users')
        .select('id, username, nickname, avatar_url')
        .eq('id', post.user_id)
        .single();
      authorInfo = userInfo;
    }

    console.log('API Debug - post:', post);
    console.log('API Debug - authorInfo:', authorInfo);

    // 3. 좋아요 수 조회
    const { count: likeCount } = await supabase
      .from('board_like')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    // 3. 댓글 수 조회
    const { count: commentCount } = await supabase
      .from('board_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    // 4. 메뉴 정보 조회 (페이지 ID로)
    let menuInfo = null;
    if (post.page_id) {
      const { data: menu } = await supabase
        .from('cms_menus')
        .select('title, url')
        .eq('page_id', post.page_id)
        .single();
      menuInfo = menu;
    }

    // 5. 이전글/다음글 조회 (같은 페이지의 게시글들 중에서)
    const [prevPostQuery, nextPostQuery] = await Promise.all([
      // 이전글 (더 오래된 글)
      supabase
        .from('board_posts')
        .select('id, title')
        .eq('page_id', post.page_id)
        .eq('status', 'published')
        .lt('created_at', post.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      
      // 다음글 (더 최신 글)  
      supabase
        .from('board_posts')
        .select('id, title')
        .eq('page_id', post.page_id)
        .eq('status', 'published')
        .gt('created_at', post.created_at)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
    ]);

    // 6. 첨부파일 조회 (posts 테이블의 files 필드에서)
    let attachments = [];
    if (post.files) {
      try {
        const filesData = JSON.parse(post.files);
        attachments = Array.isArray(filesData) ? filesData : [];
      } catch (error) {
        console.error('첨부파일 파싱 오류:', error);
        attachments = [];
      }
    }

    // 응답 데이터 구성
    const responseData = {
      post: {
        ...post,
        author: {
          username: authorInfo?.nickname || authorInfo?.username || '익명',
          avatar_url: authorInfo?.avatar_url,
        },
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
      },
      menuInfo,
      prevPost: prevPostQuery.data || null,
      nextPost: nextPostQuery.data || null,
      attachments: attachments || [],
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Post detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post details' },
      { status: 500 }
    );
  }
}