import { notFound } from "next/navigation";
import SectionRenderer from "@/components/sections/section-renderer";
import { createClient } from "@/utils/supabase/server";

import MainBanner from "@/components/home/main-banner";
import Breadcrumb from "@/components/home/breadcrumb";
import { Section } from "@/components/admin/section-manager";
import BoardDetail from "@/components/sections/board-detail";
import BoardWrite from "@/components/sections/board-write";
import HomepageWidgets from "@/components/home/homepage-widgets";

export default async function DynamicPage(props: { params: any }) {
  const params =
    typeof props.params.then === "function" ? await props.params : props.params;
  const supabase = await createClient();
  const slug = params.slug || [];

  // 메뉴 항목은 이미 app/layout.tsx에서 가져오므로 여기서는 제거

  // --- 0. 홈페이지 (/) 처리 ---
  if (slug.length === 0) {
    let { data: widgets } = await supabase
      .from("cms_layout")
      .select("*")
      .is("page_id", null) // page_id가 null인 위젯만 필터링
      .eq("is_active", true)
      .order("order", { ascending: true });
    if (!widgets) widgets = [];

    return (
      <>
        <MainBanner menuId={null} />
        <main className="flex-1 flex flex-col gap-12">
          <div className="mb-2">
            <HomepageWidgets widgets={widgets} />
          </div>
        </main>
      </>
    );
  }

  const currentPath = "/" + slug.join("/");
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

  // 1. 메뉴 url로 먼저 조회 (정확한 매칭)
  const { data: menus, error: menuError } = await supabase
    .from("cms_menus")
    .select("*, page:page_id(*, category:category_id(*))")
    .eq("url", currentPath)
    .limit(1);
  const menu = Array.isArray(menus) ? menus[0] : menus;

  // 1-1. 정확히 일치하는 메뉴가 있고, 페이지가 연결된 경우
  if (menu && menu.page) {
    // 페이지 타입에 따라 렌더링 분기
    switch (menu.page.page_type) {
      case "widget":
        let { data: widgets } = await supabase
          .from("cms_layout")
          .select("*")
          .eq("page_id", menu.page.id)
          .eq("is_active", true)
          .order("order", { ascending: true });
        if (!widgets) widgets = [];

        return (
          <>
            <MainBanner menuId={menu.id} />
            {/* <div className="sm:container block lg:hidden mx-auto sm:mt-4 border border-gray-50 px-0">
              <Breadcrumb currentTitle={menu.title} />
            </div> */}
            <main className="flex-1 flex flex-col gap-12">
              <div className="mb-2">
                <HomepageWidgets widgets={widgets} />
              </div>
            </main>
          </>
        );

      default: // 'board', 'content' 등 나머지 타입
        return (
          <>
            <MainBanner menuId={menu.id} />
            {/* <div className="sm:container mx-auto sm:mt-4 border-gray-200 px-0">
              <Breadcrumb currentTitle={menu.title} />
            </div> */}
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
  }

  // 1-b. URL의 마지막 부분이 게시글 ID인지 확인하여 처리
  const lastSegment = slug[slug.length - 1];
  if (lastSegment && !isEditPage) {
    const { data: post } = await supabase
      .from("board_posts")
      .select("id, page_id")
      .eq("id", lastSegment)
      .maybeSingle();

    if (post) {
      // 게시글이 존재하면, BoardDetail 컴포넌트를 렌더링합니다.
      // 배너에 필요한 메뉴 정보를 찾기 위해 post의 page_id를 사용합니다.
      let menuForBanner = null;
      if (post.page_id) {
        const { data: pageMenu } = await supabase
          .from("cms_menus")
          .select("id")
          .eq("page_id", post.page_id)
          .is("is_active", true)
          .limit(1)
          .single();
        if (pageMenu) {
          menuForBanner = pageMenu;
        }
      }
      return (
        <>
          <MainBanner menuId={menuForBanner?.id} />
          <main className="container mx-auto py-8 px-0 sm:px-4">
            <BoardDetail postId={lastSegment} />
          </main>
        </>
      );
    }
  }

  // 2. 상위 경로에서 페이지 타입 추론 (게시글 상세, 하위 위젯 페이지 등)
  if (!isEditPage) {
    let parentPath = currentPath;
    let parentMenu = null;

    // 현재 경로에서부터 시작하여 / 로 구분된 경로를 하나씩 줄여가며 상위 메뉴를 찾음
    while (parentPath.includes("/")) {
      parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
      if (!parentPath) break;

      const { data: parentMenus, error } = await supabase
        .from("cms_menus")
        .select("*, page:page_id(page_type)")
        .eq("url", parentPath)
        .limit(1);
      const data = Array.isArray(parentMenus) ? parentMenus[0] : parentMenus;
      if (data && data.page) {
        parentMenu = data;
        break;
      }
    }

    if (parentMenu && parentMenu.page) {
      if (parentMenu.page.page_type === "board") {
        // 게시글 상세 컴포넌트 (클라이언트 컴포넌트)
        return (
          <>
            <MainBanner menuId={parentMenu.id} />
            <main className="container mx-auto py-8 px-0 sm:px-4">
              <BoardDetail />
            </main>
          </>
        );
      } else if (parentMenu.page.page_type === "widget") {
        // 상위 페이지가 위젯 페이지이면, 현재 경로도 위젯 페이지로 간주
        let { data: widgets } = await supabase
          .from("cms_layout")
          .select("*")
          .eq("page_id", parentMenu.page.id) // 상위 페이지의 위젯을 그대로 사용
          .eq("is_active", true)
          .order("order", { ascending: true });
        if (!widgets) widgets = [];

        return (
          <>
            <MainBanner menuId={parentMenu.id} />
            {/* <div className="sm:container block lg:hidden mx-auto sm:mt-4 border border-gray-50 px-0">
              <Breadcrumb currentTitle={parentMenu.title} />
            </div> */}
            <main className="flex-1 flex flex-col gap-12">
              <div className="mb-2">
                <HomepageWidgets widgets={widgets} />
              </div>
            </main>
          </>
        );
      }
    }
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
          {/* <div className="sm:container block lg:hidden mx-auto sm:mt-4 border border-gray-50 px-0">
            <Breadcrumb currentTitle={page.title} />
          </div> */}
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
