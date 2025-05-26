import { supabase } from "@/db";

// 유저 정보 가져오기 (세션 기반)
export async function getHeaderUser() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", session.user.id)
        .single();
      return {
        id: session.user.id,
        username:
          profile?.username || session.user.email?.split("@")[0] || "익명",
        email: session.user.email,
      };
    }
    if (typeof window === "undefined") return null;
    const stored =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

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
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("user_id", userId)
    .eq("page_id", pageId)
    .eq("category_id", categoryId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// 임시등록 삭제
export async function deleteDraft({ draftId }: { draftId: string }) {
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
  status: "draft" | "published";
  number?: number;
}) {
  const filesJson = JSON.stringify(uploadedFiles);
  let result;
  let newId = postId;
  if (isEditMode && postId) {
    // 수정모드: 기존 글 update
    result = await supabase
      .from("board_posts")
      .update({
        title,
        content,
        allow_comments: allowComments,
        thumbnail_image: thumbnailImage,
        files: filesJson,
        updated_at: new Date().toISOString(),
        user_id: userId,
        status,
      })
      .eq("id", postId);
  } else if (postId) {
    // 임시저장/불러오기: 기존 draft update
    result = await supabase
      .from("board_posts")
      .update({
        title,
        content,
        allow_comments: allowComments,
        thumbnail_image: thumbnailImage,
        files: filesJson,
        updated_at: new Date().toISOString(),
        user_id: userId,
        status,
      })
      .eq("id", postId);
  } else {
    // 새 글 작성(임시저장 or 등록)
    const insertResult = await supabase
      .from("board_posts")
      .insert([
        {
          title,
          content,
          user_id: userId,
          page_id: pageId,
          category_id: categoryId,
          allow_comments: allowComments,
          thumbnail_image: thumbnailImage || null,
          files: filesJson,
          number: number,
          status,
        },
      ])
      .select("id")
      .single();
    result = insertResult;
    newId = insertResult.data?.id;
  }
  if (result.error) throw result.error;
  return { id: newId };
}

// 게시글 데이터 로드 (수정 모드)
export async function getBoardPost({ postId }: { postId: string }) {
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data;
}
