import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/toaster";
import type { BoardPostStatus } from "@/types/index";
import {
  logBoardPostCreate,
  logBoardPostUpdate,
  logBoardPostPublish,
  logDraftCreate,
} from "./activityLogService";

// 유저 정보 가져오기 (사용자 인증 기반)
export const getCurrentUser = async () => {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { session: null, profile: null };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return { session: { user }, profile };
  } catch (error) {
    console.error("사용자 정보 가져오기 실패:", error);
    return { session: null, profile: null };
  }
};

// 헤더용 사용자 정보 가져오기 (호환성을 위해 추가)
export const getHeaderUser = async () => {
  try {
    const { session, profile } = await getCurrentUser();
    return profile || session?.user || null;
  } catch (error) {
    console.error("헤더 사용자 정보 가져오기 실패:", error);
    return null;
  }
};

// 임시등록 목록 불러오기 (status='draft')
export async function fetchDrafts({
  userId,
  pageId,
  categoryId,
}: {
  userId: string;
  pageId: string;
  categoryId?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from("board_posts")
    .select("*")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .eq("status", "draft");
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// 임시등록 삭제
export async function deleteDraft({ draftId }: { draftId: string }) {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_posts")
    .delete()
    .eq("id", draftId)
    .eq("status", "draft");
  if (error) throw error;
  return true;
}

// 게시글 저장/수정 (status: draft/published)
export async function saveBoardPost({
  postId,
  isEditMode,
  title,
  content,
  allowComments,
  thumbnailImage,
  uploadedFiles,
  userId,
  pageId,
  categoryId,
  status,
  number,
  description,
  isNotice,
  publishedAt,
}: {
  postId?: string;
  isEditMode?: boolean;
  title: string;
  content: string;
  allowComments: boolean;
  thumbnailImage?: string;
  uploadedFiles: any[];
  userId: string;
  pageId: string;
  categoryId?: string;
  status: BoardPostStatus;
  number?: number;
  description?: string;
  isNotice?: boolean;
  publishedAt?: string | null;
}) {
  console.log("[boardService] saveBoardPost 호출됨. userId:", userId);
  console.log("[boardService] 저장할 데이터:", {
    postId,
    isEditMode,
    title: title.substring(0, 20) + (title.length > 20 ? "..." : ""),
    contentLength: content.length,
    userId,
    pageId,
    categoryId,
    status,
    isNotice,
    publishedAt,
  });
  const filesJson = JSON.stringify(uploadedFiles);
  let result;
  let newId = postId;

  // 로그에 사용할 세부 정보
  const logDetails = {
    content_length: content.length,
    has_files: uploadedFiles.length > 0,
    files_count: uploadedFiles.length,
    page_id: pageId,
    category_id: categoryId,
    status,
    is_notice: isNotice,
    allow_comments: allowComments,
  };

  if (isEditMode && postId) {
    // 수정모드: 기존 글 정보 먼저 조회 (변경 전 데이터)
    console.log("[boardService] 수정 모드 실행. user_id:", userId);

    const supabase = createClient();
    const { data: beforeData, error: beforeError } = await supabase
      .from("board_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (beforeError) {
      console.error("기존 게시글 조회 실패:", beforeError);
      throw beforeError;
    }

    result = await supabase
      .from("board_posts")
      .update({
        title,
        content,
        allow_comments: allowComments,
        thumbnail_image: thumbnailImage,
        files: filesJson,
        updated_at: new Date().toISOString(),
        user_id: userId, // 사용자 ID 업데이트
        status,
        description, // 상세 설명 필드 추가
        is_notice: isNotice, // 공지사항 필드 추가
        published_at: publishedAt, // 게시일 필드 추가
      })
      .eq("id", postId);
    console.log("[boardService] 수정 결과:", result);

    // 수정 로그 기록 (변경 전후 비교)
    if (!result.error) {
      if (status === "published") {
        // 변경 전후 데이터를 모두 JSON에 담기
        const changeLog = {
          ...logDetails,
          before_data: {
            title: beforeData.title,
            content: beforeData.content,
            allow_comments: beforeData.allow_comments,
            thumbnail_image: beforeData.thumbnail_image,
            files: beforeData.files ? JSON.parse(beforeData.files) : [],
            is_notice: beforeData.is_notice,
            description: beforeData.description,
            status: beforeData.status,
            updated_at: beforeData.updated_at,
          },
          after_data: {
            title: title,
            content: content,
            allow_comments: allowComments,
            thumbnail_image: thumbnailImage,
            files: uploadedFiles,
            is_notice: isNotice,
            description: description,
            status: status,
            updated_at: new Date().toISOString(),
          },
        };

        await logBoardPostUpdate(userId, postId, title, changeLog);
      } else if (status === "draft") {
        // 임시저장 업데이트는 별도 로그 없이 진행
      }
    }
  } else if (postId) {
    // 임시저장/불러오기: 기존 draft update
    console.log("[boardService] 임시저장 업데이트 모드 실행. user_id:", userId);
    const supabase = createClient();
    result = await supabase
      .from("board_posts")
      .update({
        title,
        content,
        allow_comments: allowComments,
        thumbnail_image: thumbnailImage,
        files: filesJson,
        updated_at: new Date().toISOString(),
        user_id: userId, // 사용자 ID 업데이트
        status,
        description, // 상세 설명 필드 추가
        is_notice: isNotice, // 공지사항 필드 추가
        published_at: publishedAt, // 게시일 필드 추가
      })
      .eq("id", postId);
    console.log("[boardService] 임시저장 업데이트 결과:", result);

    // 임시저장에서 발행으로 변경되는 경우 발행 로그 기록
    if (!result.error && status === "published") {
      await logBoardPostPublish(userId, postId, title, logDetails);
    }
  } else {
    // 새 글 작성(임시저장 or 등록)
    console.log("[boardService] 새 글 작성 모드 실행. user_id:", userId);
    const supabase = createClient();
    const insertData = {
      title,
      content,
      user_id: userId, // 사용자 ID 설정
      page_id: pageId,
      category_id: categoryId,
      allow_comments: allowComments,
      thumbnail_image: thumbnailImage || null,
      files: filesJson,
      number: number,
      status,
      description, // 상세 설명 필드 추가
      is_notice: isNotice, // 공지사항 필드 추가
      published_at: publishedAt, // 게시일 필드 추가
    };
    console.log("[boardService] 삽입할 데이터:", {
      ...insertData,
      content: "(content length: " + content.length + ")",
      files: "(files json length: " + filesJson.length + ")",
    });

    const insertResult = await supabase
      .from("board_posts")
      .insert([insertData])
      .select("id, user_id") // user_id도 함께 반환하도록 수정
      .single();

    console.log("[boardService] 삽입 결과:", insertResult);
    result = insertResult;
    newId = insertResult.data?.id;

    // 새 글 작성 로그 기록
    if (!result.error && newId) {
      if (status === "published") {
        await logBoardPostCreate(userId, newId, title, logDetails);
      } else if (status === "draft") {
        await logDraftCreate(userId, newId, title);
      }
    }
  }

  if (result.error) throw result.error;
  return { id: newId };
}

// 게시글 데이터 로드 (수정 모드)
export async function getBoardPost({ postId }: { postId: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data;
}

async function handleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  try {
    return await requestFn();
  } catch (error: any) {
    // 세션 만료 에러 처리
    if (error.status === 401) {
      // 세션 갱신 시도
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.refreshSession();
      if (session) {
        // 세션 갱신 성공시 원래 요청 재시도
        return await requestFn();
      } else {
        toast({
          title: "세션이 만료되었습니다",
          description: "다시 로그인해주세요",
          variant: "destructive",
        });
        // 로그인 페이지로 리다이렉트
        window.location.href = "/login";
      }
    }
    throw error;
  }
}

export const boardService = {
  async getBoards() {
    return handleRequest(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    });
  },

  // 다른 메서드들도 handleRequest로 래핑
  // ...
};
