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
    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';

    // 1. 게시글 기본 정보 조회 - org_posts 테이블 사용
    const { data: post, error: postError } = await supabase
      .from('org_posts')
      .select('*')
      .eq('id', postId)
      .eq('organization_id', CONNECT_CHURCH_ORG_ID)
      .single();

    if (postError || !post) {
      // 더 자세한 에러 정보 반환
      return NextResponse.json({
        error: 'Post not found',
        details: postError?.message || 'No post data',
        postId
      }, { status: 404 });
    }

    // 2. 작성자 정보 조회 - author_id 사용
    let authorInfo = null;
    if (post.author_id) {
      const { data: userInfo } = await supabase
        .from('users')
        .select('id, username, nickname, avatar_url')
        .eq('id', post.author_id)
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
    const pageId = post.meta?.page_id;
    if (pageId) {
      // 먼저 하위메뉴에서 찾기 (parent_id가 있는 메뉴)
      const { data: subMenu } = await supabase
        .from('cms_menus')
        .select('title, url')
        .eq('page_id', pageId)
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
          .eq('page_id', pageId)
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
        .from('org_posts')
        .select('id, title, published_at, created_at')
        .eq('category_id', post.category_id)
        .eq('organization_id', CONNECT_CHURCH_ORG_ID)
        .eq('status', 'published')
        .lt('published_at', currentSortKey)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

      // 다음글 (더 최신 글) - 게시일 우선, 생성일 보조
      supabase
        .from('org_posts')
        .select('id, title, published_at, created_at')
        .eq('category_id', post.category_id)
        .eq('organization_id', CONNECT_CHURCH_ORG_ID)
        .eq('status', 'published')
        .gt('published_at', currentSortKey)
        .order('published_at', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
    ]);

    // 6. 첨부파일 조회 (meta 필드에서)
    let attachments = [];
    if (post.meta?.files) {
      try {
        const filesData = post.meta.files;
        attachments = Array.isArray(filesData) ? filesData : [];
      } catch (error) {
        console.error('첨부파일 파싱 오류:', error);
        attachments = [];
      }
    }

    // 응답 데이터 구성 - 하위 호환성을 위한 필드 매핑
    const responseData = {
      post: {
        ...post,
        user_id: post.author_id, // 하위 호환성
        page_id: post.meta?.page_id, // 하위 호환성
        thumbnail_image: post.thumbnail_url, // 하위 호환성
        files: post.meta?.files ? JSON.stringify(post.meta.files) : '[]', // 하위 호환성
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