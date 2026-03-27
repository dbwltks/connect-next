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
    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';

    // org_posts 테이블에서 데이터 조회
    let query = supabase
      .from('org_posts')
      .select('*')
      .eq('organization_id', CONNECT_CHURCH_ORG_ID)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    // category_id로 필터링 (pageId를 category_id로 매핑)
    if (boardId || pageId) {
      const categoryId = boardId || pageId;
      query = query.eq('category_id', categoryId);
    }

    const { data: posts, error } = await query;
    if (error) {
      console.error('Board posts query error:', error);
      throw error;
    }

    console.log(`[board-posts API] Fetched ${posts?.length || 0} posts for category: ${boardId || pageId}`);

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

    // 사용자 정보 조회 - org_posts는 author_id 사용
    let postsWithUsers = sortedPosts;
    if (posts && posts.length > 0) {
      const userIds = Array.from(
        new Set(posts.map((post: any) => post.author_id).filter(Boolean))
      );

      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email, username, nickname, display_name')
          .in('id', userIds);

        userMap = new Map(users?.map((user: any) => [user.id, user]) || []);
      }

      // 좋아요 수 추가
      const postsWithLikes = await Promise.all(
        sortedPosts.map(async (post: any) => {
          const { count } = await supabase
            .from('board_like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            likes_count: count || 0  // likes_count 필드로 추가
          };
        })
      );

      // 모든 게시글에 author 필드 추가 (사용자 정보가 없어도)
      postsWithUsers = postsWithLikes.map((post: any) => {
        const user = userMap.get(post.author_id);

        // 썸네일이 없으면 첨부파일 또는 content에서 첫 번째 이미지 추출
        let thumbnailImage = post.thumbnail_url;

        if (!thumbnailImage) {
          // 1. meta.files에서 첫 번째 이미지 파일 찾기
          if (post.meta?.files && Array.isArray(post.meta.files)) {
            const firstImageFile = post.meta.files.find((file: any) =>
              file.type?.startsWith('image/') ||
              /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || file.url || '')
            );
            if (firstImageFile) {
              thumbnailImage = firstImageFile.url || firstImageFile.path;
            }
          }

          // 2. 첨부파일에 없으면 content HTML에서 첫 번째 이미지 추출
          if (!thumbnailImage && post.content) {
            const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              thumbnailImage = imgMatch[1];
            }
          }
        }

        return {
          ...post,
          users: user || null,
          author: user ? (user.nickname || user.username || '익명') : '익명',
          // 하위 호환성을 위해 추가 필드 매핑
          user_id: post.author_id,
          page_id: post.meta?.page_id || null,
          thumbnail_image: thumbnailImage,
        };
      });
    }

    // 메뉴 URL 매핑 정보 조회
    let menuUrlMap: Record<string, string> = {};
    let pageTitleMap: Record<string, string> = {};
    if (postsWithUsers && postsWithUsers.length > 0) {
      const pageIds = Array.from(
        new Set(postsWithUsers.map((post: any) => post.page_id).filter(Boolean))
      );

      if (pageIds.length > 0) {
        // 메뉴 URL 정보
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

        // 페이지/게시판 제목 정보
        const { data: pages } = await supabase
          .from('cms_pages')
          .select('id, title')
          .in('id', pageIds);

        if (pages) {
          pageTitleMap = pages.reduce((acc: Record<string, string>, page: any) => {
            if (page.id && page.title) {
              acc[page.id] = page.title;
            }
            return acc;
          }, {});
        }
      }
    }

    console.log(`[board-posts API] Returning ${postsWithUsers.length} posts with users`);

    if (type === 'media') {
      return NextResponse.json({ posts: postsWithUsers, menuUrlMap, pageTitleMap });
    }

    return NextResponse.json({ posts: postsWithUsers, menuUrlMap, pageTitleMap });
  } catch (error) {
    console.error('Board posts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board posts' },
      { status: 500 }
    );
  }
}