import { notFound } from "next/navigation";
import SectionRenderer from "@/components/sections/section-renderer";
import { createClient } from "@/utils/supabase/server";

import MainBanner from "@/components/home/main-banner";
import Breadcrumb from "@/components/home/breadcrumb";
import UpcomingEvents from "@/components/home/upcoming-events";
import LatestSermon from "@/components/home/latest-sermon";
import Announcements from "@/components/home/announcements";
import WelcomeMessage from "@/components/home/welcome-message";
import ServiceTimes from "@/components/home/service-times";
import { Section } from "@/components/admin/section-manager";
import BoardDetail from "@/components/sections/board-detail";
import BoardWrite from "@/components/sections/board-write";
import HomepageWidgets, { Widget } from "@/components/home/homepage-widgets";

export default async function DynamicPage(props: { params: any }) {
  const params =
    typeof props.params.then === "function" ? await props.params : props.params;
  const supabase = await createClient();

  // 메뉴 항목 SSR에서 패칭
  const { data: menuItemsRaw } = await supabase
    .from("cms_menus")
    .select("*")
    .eq("is_active", true)
    .order("order_num", { ascending: true });
  const menuItems = menuItemsRaw ?? [];

  // 평면 구조를 트리 구조로 변환하는 함수
  function buildMenuTree(items: any[]) {
    const rootItems = items.filter((item) => item.parent_id === null);
    return rootItems.map((item) => ({
      ...item,
      submenu: findChildren(item.id, items),
    }));
  }
  function findChildren(parentId: string, items: any[]): any[] {
    const children = items.filter((item) => item.parent_id === parentId);
    return children.map((child) => ({
      ...child,
      submenu: findChildren(child.id, items),
    }));
  }
  const menuTree = buildMenuTree(menuItems);

  // 홈(/) 경로일 때: 기존 Home 페이지 UI 렌더링
  if (!params.slug || params.slug.length === 0) {
    // 레이아웃 매니저에서 설정한 위젯 가져오기
    const { data: widgets = [], error: widgetsError } = await supabase
      .from("cms_layout")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (widgetsError) {
      console.error("Error fetching widgets:", widgetsError);
    }

    // 위젯 데이터 타입 변환
    const typedWidgets: Widget[] = (widgets || [])
      .filter((widget: any) => widget.is_active)
      .map((widget: any) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        content: widget.content,
        settings: widget.settings,
        column_position: widget.column_position || 0,
        order: widget.order || 0,
        width: widget.width || 12,
        height: widget.height,
        display_options: widget.display_options,
        is_active: widget.is_active,
      }));

    // 게시판 위젯만 필터링 (board 타입만)
    const boardWidgets = typedWidgets.filter(
      (widget) => widget.type === "board" && widget.settings?.board_id
    );

    // 게시판 페이지 정보 가져오기
    const pageIds = boardWidgets
      .map((widget) => widget.settings.board_id)
      .filter(Boolean);

    const { data: pages = [] } = await supabase
      .from("cms_pages")
      .select("id, title, page_type, category_id")
      .in("id", pageIds);

    // 게시판 데이터 가져오기
    const boardPostsMap: { [key: string]: any[] } = {};

    for (const widget of boardWidgets) {
      const pageId = widget.settings.board_id;
      if (!pageId) continue;

      const limit = widget.settings?.post_limit || 5;
      try {
        const { data: posts = [] } = await supabase
          .from("board_posts")
          .select(
            `
            id,
            title,
            created_at,
            views,
            is_notice,
            is_pinned,
              comment_count:board_comments(count)
          `
          )
          .eq("page_id", pageId)
          .eq("is_active", true)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(limit);

        boardPostsMap[pageId] = posts || [];
      } catch (error) {
        boardPostsMap[pageId] = [];
      }
    }

    // 섹션 관리자에서 설정한 섹션 불러오기 (홈화면에 필요한 것만)
    const { data: sections = [], error: sectionsError } = await supabase
      .from("cms_sections")
      .select("id, title, name, type, content, order, settings")
      .eq("is_active", true)
      .eq("show_in_home", true)
      .order("order", { ascending: true });

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
    }

    // 섹션 데이터 타입 변환
    const typedSections: Section[] = (sections || []).map((section: any) => ({
      id: section.id,
      title: section.title,
      name: section.name,
      description: section.description,
      type: section.type || "custom",
      isActive: section.is_active,
      content: section.content,
      order: section.order,
      settings: section.settings,
      dbTable: section.db_table,
      pageType: section.page_type,
    }));

    console.log("Typed widgets:", typedWidgets);

    return (
      <>
        <MainBanner menuId={null} />
        <main className="flex-1 flex flex-col gap-12 px-0 sm:px-4 py-4">
          {/* 위젯 섹션 */}
          {typedWidgets.length > 0 && (
            <div className="mb-2">
              <HomepageWidgets
                widgets={typedWidgets}
                pages={pages || []}
                boardPosts={boardPostsMap}
              />
            </div>
          )}

          {/* 기존 고정 섹션들 */}
          {/* <WelcomeMessage churchInfo={} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ServiceTimes churchInfo={} />
            <LatestSermon sermon={} />
            <UpcomingEvents  />
          <Announcements  />
          </div> */}

          {/* 섹션 관리자에서 설정한 동적 섹션들 */}
          {typedSections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              className="mb-8"
            />
          ))}
        </main>
      </>
    );
  }
  // slug가 없으면 홈('/') 처리
  const currentPath =
    params.slug && params.slug.length > 0 ? "/" + params.slug.join("/") : "/";
  console.log("currentPath:", currentPath);

  // 1. 글쓰기 페이지: .../write로 끝나면 BoardWrite 렌더링
  if (currentPath.endsWith("/write")) {
    // menu 정보 먼저 조회
    const { data: menu, error: menuError } = await supabase
      .from("cms_menus")
      .select("*, page:page_id(*, category:category_id(*))")
      .eq("url", currentPath.replace(/\/write$/, ""))
      .single();
    const pageId = menu?.page?.id;
    const categoryId = menu?.page?.category?.id;
    return (
      <main className="container mx-auto py-8 px-0 sm:px-4">
        <BoardWrite pageId={pageId} categoryId={categoryId} />
      </main>
    );
  }

  // 1-2. 수정 페이지: .../[id]/edit 형식으로 렌더링
  const isEditPage = currentPath.endsWith("/edit");

  // 수정 페이지 패턴: /[id]/edit
  if (isEditPage) {
    // 게시글 ID 추출 (예: /board/notice/123/edit -> 123)
    const segments = currentPath.split("/");
    const postId = segments[segments.length - 2]; // edit 앞의 세그먼트가 ID

    // 게시글 정보 가져오기
    const { data: post, error: postError } = await supabase
      .from("board_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      notFound();
    }

    // 기본 경로 추출 (예: /board/notice/123/edit -> /board/notice)
    const basePath = currentPath.replace(/\/[^/]+\/edit$/, "");

    // menu 정보 조회
    const { data: menu, error: menuError } = await supabase
      .from("cms_menus")
      .select("*, page:page_id(*, category:category_id(*))")
      .eq("url", basePath)
      .single();

    return (
      <main className="container mx-auto py-8 sm:px-4">
        {/* <h1 className="text-2xl font-bold mb-6">게시글 수정ㄴ</h1> */}
        <BoardWrite
          pageId={post.page_id}
          categoryId={post.category_id}
          postId={postId}
          initialData={{
            title: post.title,
            content: post.content,
            allow_comments: post.allow_comments,
          }}
          isEditMode={true}
        />
      </main>
    );
  }

  // 1. 메뉴 url로 먼저 조회
  const { data: menu, error: menuError } = await supabase
    .from("cms_menus")
    .select("*, page:page_id(*, category:category_id(*))")
    .eq("url", currentPath)
    .single();

  if (menu && menu.page) {
    console.log("currentPath:", currentPath);
    console.log("menu:", menu);
    console.log("menu.page:", menu.page);
    console.log("menuError:", menuError);
    return (
      <>
        <MainBanner menuId={menu.id} />
        <div className="container mx-auto mt-4 mb-2 px-0 sm:px-4">
          <Breadcrumb currentTitle={menu.title} />
        </div>
        <main>
          <div className="container mx-auto px-0 sm:px-4">
            <h1 className="text-3xl font-bold mb-4"></h1>
          </div>
          <SectionRenderer
            section={{
              ...menu.page,
              category: menu.page?.category,
              display_type: menu.page?.category?.display_type,
            }}
            menuTitle={menu.title}
          />
        </main>
      </>
    );
  }

  // 2. 게시글 상세: 경로가 .../[id] (id가 6자 이상, UUID 등)이면서 /edit으로 끝나지 않는 경우 BoardDetail 렌더링
  const postPathMatch = currentPath.match(/\/([a-zA-Z0-9\-]{6,})$/);
  if (postPathMatch && !isEditPage) {
    // 게시글이 속한 메뉴 정보 가져오기
    const basePath = currentPath.replace(/\/[^/]+$/, "");
    const { data: postMenu } = await supabase
      .from("cms_menus")
      .select("id")
      .eq("url", basePath)
      .maybeSingle();

    // 게시글 상세 컴포넌트 (클라이언트 컴포넌트)
    return (
      <>
        <MainBanner menuId={postMenu?.id} />
        <main className="container mx-auto py-8 px-0 sm:px-4">
          <BoardDetail />
        </main>
      </>
    );
  }

  // 3. fallback: /page/[id] 형식이면 pageId로 직접 조회
  const pageIdMatch = currentPath.match(/^\/page\/([a-zA-Z0-9-]+)$/);
  if (pageIdMatch) {
    const pageId = pageIdMatch[1];
    const { data: page, error: pageError } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("id", pageId)
      .single();

    // 페이지와 연결된 메뉴 가져오기
    const { data: pageMenu } = await supabase
      .from("cms_menus")
      .select("id")
      .eq("page_id", pageId)
      .maybeSingle();

    if (page) {
      return (
        <>
          <MainBanner menuId={pageMenu?.id} />
          <main className="container mx-auto py-8 px-0 sm:px-4">
            <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
            <SectionRenderer section={page} />
          </main>
        </>
      );
    }
  }

  // 4. 모두 실패하면 404
  notFound();
}
