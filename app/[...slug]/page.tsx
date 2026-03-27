import { notFound } from "next/navigation";
import SectionRenderer from "@/components/sections/section-renderer";
import { createClient } from "@/utils/supabase/server";
import BoardDetail from "@/components/sections/board-detail";
import BoardWrite from "@/components/sections/board-write";
import { PAGE_CONTENTS } from "@/config/page-contents";

// 고정 페이지 매핑 (CMS 데이터 기반)
const PAGE_MAPPINGS: Record<string, {
  categoryId?: string;
  title: string;
  pageType: string;
  displayType: string;
  widgetType?: string;
  widgetSettings?: any;
}> = {
  // 게시판 타입 페이지들
  "/connecting/info-board": { categoryId: "edc61678-6d46-419c-8fe6-cb2571385979", title: "교회 소식", pageType: "widget", displayType: "board" },
  "/sermons/all-sermons": { categoryId: "19e27963-a138-4a77-bde8-71060a8e6c5d", title: "예배와 말씀", pageType: "widget", displayType: "board" },
  "/sermons/praise": { categoryId: "cd5a8012-8f59-4620-995a-0ea78f809a2b", title: "찬양과 간증", pageType: "widget", displayType: "board" },
  "/connecting/in-pictures": { categoryId: "1288e7ee-50f7-44dd-9b7d-2101baa6b15d", title: "사진 속 커넥트", pageType: "widget", displayType: "board" },
  "/connecting/media": { categoryId: "1ab7ebf9-f69c-4482-8d43-b71ae8fc35d8", title: "미디어 속 커넥트", pageType: "widget", displayType: "board" },
  "/sermons/bcin": { categoryId: "4d49a726-3037-4bb2-8f7c-5f66109118b0", title: "BCIN", pageType: "widget", displayType: "board" },
  "/connecting/weekly-bulletin": { categoryId: "f58de404-1751-41df-bbe5-6afc62036075", title: "온라인 주보", pageType: "widget", displayType: "board" },
  "/sermons/pastoral-column": { categoryId: "19e27963-a138-4a77-bde8-71060a8e6c5d", title: "목회 컬럼과 말씀 묵상", pageType: "widget", displayType: "board" },
  "/mission/domestic-mission": { categoryId: "1737d84d-96bf-41f7-8f49-4f5d64190600", title: "국내 선교", pageType: "widget", displayType: "board" },
  "/mission/overseas-mission": { categoryId: "03ea6f56-9ac5-40fb-9bca-3efe47cfbade", title: "국외 선교", pageType: "widget", displayType: "board" },
  "/mission/cooperating-group": { categoryId: "eb347125-5727-4134-8f19-04455fc69d77", title: "협력 단체", pageType: "widget", displayType: "board" },

  // 컨텐츠 타입 페이지들
  "/connect/about": { title: "교회소개", pageType: "content", displayType: "content" },
  "/connect/greeting": { title: "인사말", pageType: "content", displayType: "content" },
  "/connect/people": {
    title: "섬기는 사람들",
    pageType: "widget",
    displayType: "content",
    widgetType: "organization-chart",
    widgetSettings: {
      chart_style: "detailed",
      card_size: "large",
      card_spacing: "wide",
      show_avatars: false,
      description: "토론토 커넥트교회를 섬기는 사람들입니다",
      level_names: {
        "0": "사역자",
        "1": "셀 섬김이",
        "2": "운영 섬김이"
      },
      custom_data: [
        { id: "1", name: "김지연", position: "담임목사", department: "사역팀", level: 0 },
        { id: "2", name: "최유봉", position: "사모", department: "찬양팀", level: 0 },
        { id: "3", name: "박요셉", position: "운영섬김이", department: "재정팀", level: 1 },
        { id: "4", name: "서성혁", position: "운영섬김이", department: "예배팀", level: 1 },
        { id: "5", name: "최인애", position: "운영섬김이", department: "중보기도팀", level: 1 },
        { id: "6", name: "김동희", position: "운영섬김이", department: "미디어팀", level: 1 },
        { id: "7", name: "이채원", position: "운영섬김이", department: "디자인/퍼포먼스팀", level: 1 },
        { id: "8", name: "이예성", position: "운영섬김이", department: "선교/봉사팀", level: 1 },
        { id: "9", name: "윤지영", position: "운영섬김이", department: "새가족팀", level: 1 },
        { id: "10", name: "장한나", position: "운영섬김이", department: "교육팀", level: 1 }
      ]
    }
  },
  "/connect/church-info": { title: "예배 및 위치", pageType: "content", displayType: "content" },

  // 일정표
  "/connecting/calendar": { title: "일정표", pageType: "widget", displayType: "list" },
};

export default async function DynamicPage(props: { params: any }) {
  const params =
    typeof props.params.then === "function" ? await props.params : props.params;
  const supabase = await createClient();
  const slug = params.slug || [];

  const currentPath = "/" + slug.join("/");
  console.log("currentPath:", currentPath);

  // 1. 글쓰기 페이지: .../write로 끝나면 BoardWrite 렌더링
  if (currentPath.endsWith("/write")) {
    const basePath = currentPath.replace(/\/write$/, "");
    const pageMapping = PAGE_MAPPINGS[basePath];

    return (
      <main className="container mx-auto py-8 px-0 sm:px-4">
        <BoardWrite pageId={undefined} categoryId={pageMapping?.categoryId} />
      </main>
    );
  }

  // 2. 수정 페이지: .../[id]/edit 형식으로 렌더링
  const isEditPage = currentPath.endsWith("/edit");
  if (isEditPage) {
    const segments = currentPath.split("/");
    const postId = segments[segments.length - 2];

    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';
    const { data: post, error: postError } = await supabase
      .from("org_posts")
      .select("*")
      .eq("id", postId)
      .eq("organization_id", CONNECT_CHURCH_ORG_ID)
      .single();

    if (postError || !post) {
      notFound();
    }

    return (
      <main className="container mx-auto py-8 sm:px-4">
        <BoardWrite
          pageId={post.meta?.page_id || undefined}
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

  // 3. 고정 페이지 매핑 확인
  const pageMapping = PAGE_MAPPINGS[currentPath];

  if (pageMapping) {
    // 페이지 타입에 따라 렌더링
    return (
      <main>
        <SectionRenderer
          section={{
            id: pageMapping.categoryId || currentPath,
            title: pageMapping.title,
            name: pageMapping.title,
            description: "",
            type: pageMapping.widgetType || "content",
            isActive: true,
            content: PAGE_CONTENTS[currentPath] || "",
            order: 0,
            settings: pageMapping.widgetSettings,
            category_id: pageMapping.categoryId,
            displayType: pageMapping.displayType,
            display_type: pageMapping.displayType,
            page_type: pageMapping.pageType,
          } as any}
          menuTitle={pageMapping.title}
        />
      </main>
    );
  }

  // 4. 게시글 상세 페이지 확인
  const lastSegment = slug[slug.length - 1];
  if (lastSegment && !isEditPage) {
    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';
    const { data: post } = await supabase
      .from("org_posts")
      .select("id, meta")
      .eq("id", lastSegment)
      .eq("organization_id", CONNECT_CHURCH_ORG_ID)
      .maybeSingle();

    if (post) {
      return (
        <main className="container mx-auto py-0 sm:py-8 px-0 sm:px-4">
          <BoardDetail postId={lastSegment} />
        </main>
      );
    }
  }

  // 5. 상위 경로에서 페이지 매핑 추론
  if (!isEditPage) {
    let parentPath = currentPath;

    while (parentPath.includes("/")) {
      parentPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
      if (!parentPath) break;

      const parentMapping = PAGE_MAPPINGS[parentPath];
      if (parentMapping) {
        // 상위 경로의 페이지로 렌더링
        return (
          <main>
            <SectionRenderer
              section={{
                id: parentMapping.categoryId || parentPath,
                title: parentMapping.title,
                name: parentMapping.title,
                description: "",
                type: parentMapping.widgetType || "content",
                isActive: true,
                content: PAGE_CONTENTS[parentPath] || "",
                order: 0,
                settings: parentMapping.widgetSettings,
                category_id: parentMapping.categoryId,
                displayType: parentMapping.displayType,
                display_type: parentMapping.displayType,
                page_type: parentMapping.pageType,
              } as any}
              menuTitle={parentMapping.title}
            />
          </main>
        );
      }
    }
  }

  notFound();
}
