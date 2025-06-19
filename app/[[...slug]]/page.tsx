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

  // 메뉴 항목은 이미 app/layout.tsx에서 가져오므로 여기서는 제거

  // 홈(/) 경로일 때: 기존 Home 페이지 UI 렌더링
  if (!params.slug || params.slug.length === 0) {
    // 위젯 데이터 패칭
    let { data: widgets } = await supabase
      .from("cms_layout")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });
    if (!widgets) widgets = [];

    return (
      <>
        <MainBanner menuId={null} />
        <main className="flex-1 flex flex-col gap-12 px-0 sm:px-4 py-4">
          {/* 위젯 섹션 - 컴포넌트 내부에서 데이터 로딩 */}
          <div className="mb-2">
            <HomepageWidgets widgets={widgets} />
          </div>
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
        <div className="container mx-auto mt-4 mb-2 px-4">
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
