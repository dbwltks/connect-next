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

    // 4. 메뉴 정보 조회 (페이지 ID로, 우선순위: 하위메뉴 > 상위메뉴)
    let menuInfo = null;
    if (post.page_id) {
      // 먼저 하위메뉴에서 찾기 (parent_id가 있는 메뉴)
      const { data: subMenu } = await supabase
        .from('cms_menus')
        .select('title, url')
        .eq('page_id', post.page_id)
        .not('parent_id', 'is', null)
        .eq('is_active', true)
        .maybeSingle();
      
      if (subMenu) {
        menuInfo = subMenu;
      } else {
        // 하위메뉴가 없으면 상위메뉴에서 찾기
        const { data: parentMenu } = await supabase
          .from('cms_menus')
          .select('title, url')
          .eq('page_id', post.page_id)
          .is('parent_id', null)
          .eq('is_active', true)
          .maybeSingle();
        menuInfo = parentMenu;
      }
    }

    // 5. 이전글/다음글 조회 (게시일 우선, 생성일 보조 정렬)
    const currentSortKey = post.published_at || post.created_at;
    
    const [prevPostQuery, nextPostQuery] = await Promise.all([
      // 이전글 (더 오래된 글) - 게시일 우선, 생성일 보조
      supabase
        .from('board_posts')
        .select('id, title, published_at, created_at')
        .eq('page_id', post.page_id)
        .eq('status', 'published')
        .lt('published_at', currentSortKey)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      
      // 다음글 (더 최신 글) - 게시일 우선, 생성일 보조
      supabase
        .from('board_posts')
        .select('id, title, published_at, created_at')
        .eq('page_id', post.page_id)
        .eq('status', 'published')
        .gt('published_at', currentSortKey)
        .order('published_at', { ascending: true })
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