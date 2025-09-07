import { notFound } from "next/navigation";
import SectionRenderer from "@/components/sections/section-renderer";
import { createClient } from "@/utils/supabase/server";
import MainBanner from "@/components/home/main-banner";
import BoardDetail from "@/components/sections/board-detail";
import BoardWrite from "@/components/sections/board-write";
import HomepageWidgets from "@/components/home/homepage-widgets";

export default async function DynamicPage(props: { params: any }) {
  const params =
    typeof props.params.then === "function" ? await props.params : props.params;
  const supabase = await createClient();
  const slug = params.slug || [];

  const currentPath = "/" + slug.join("/");
  console.log("currentPath:", currentPath);

  // 1. 글쓰기 페이지: .../write로 끝나면 BoardWrite 렌더링
  if (currentPath.endsWith("/write")) {
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

  // 2. 수정 페이지: .../[id]/edit 형식으로 렌더링
  const isEditPage = currentPath.endsWith("/edit");
  if (isEditPage) {
    const segments = currentPath.split("/");
    const postId = segments[segments.length - 2];

    const { data: post, error: postError } = await supabase
      .from("board_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      notFound();
    }

    const basePath = currentPath.replace(/\/[^/]+\/edit$/, "");
    const { data: menu, error: menuError } = await supabase
      .from("cms_menus")
      .select("*, page:page_id(*, category:category_id(*))")
      .eq("url", basePath)
      .single();

    return (
      <main className="container mx-auto py-8 sm:px-4">
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

  // 3. 메뉴 url로 조회
  const { data: menus, error: menuError } = await supabase
    .from("cms_menus")
    .select("*, page:page_id(*, category:category_id(*))")
    .eq("url", currentPath)
    .limit(1);
  const menu = Array.isArray(menus) ? menus[0] : menus;

  if (menu && menu.page) {
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
            <main className="flex-1 flex flex-col gap-12">
              <div className="">
                <HomepageWidgets widgets={widgets} pageId={menu.page.id} />
              </div>
            </main>
          </>
        );

      default:
        return (
          <>
            <MainBanner menuId={menu.id} />
            <main>
              <div className="mx-auto">
                <h1 className="text-3xl font-bold"></h1>
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

  // 4. 게시글 상세 페이지 확인
  const lastSegment = slug[slug.length - 1];
  if (lastSegment && !isEditPage) {
    const { data: post } = await supabase
      .from("board_posts")
      .select("id, page_id")
      .eq("id", lastSegment)
      .maybeSingle();

    if (post) {
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
          <main className="container mx-auto py-0 sm:py-8 px-0 sm:px-4">
            <BoardDetail postId={lastSegment} />
          </main>
        </>
      );
    }
  }

  // 5. 상위 경로에서 페이지 타입 추론
  if (!isEditPage) {
    let parentPath = currentPath;
    let parentMenu = null;

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
        return (
          <>
            <MainBanner menuId={parentMenu.id} />
            <main className="container mx-auto py-8 px-0 sm:px-4">
              <BoardDetail />
            </main>
          </>
        );
      } else if (parentMenu.page.page_type === "widget") {
        let { data: widgets } = await supabase
          .from("cms_layout")
          .select("*")
          .eq("page_id", parentMenu.page.id)
          .eq("is_active", true)
          .order("order", { ascending: true });
        if (!widgets) widgets = [];

        return (
          <>
            <MainBanner menuId={parentMenu.id} />
            <main className="flex-1 flex flex-col gap-12">
              <div className="">
                <HomepageWidgets
                  widgets={widgets}
                  pageId={parentMenu.page.id}
                />
              </div>
            </main>
          </>
        );
      }
    }
  }

  // 6. /page/[id] 형식 처리
  const pageIdMatch = currentPath.match(/^\/page\/([a-zA-Z0-9-]+)$/);
  if (pageIdMatch) {
    const pageId = pageIdMatch[1];
    const { data: page, error: pageError } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("id", pageId)
      .single();

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

  notFound();
}
