import { createClient } from "@/utils/supabase/client";
import { logCommentCreate, logCommentDelete } from "./activityLogService";

// 댓글 목록 불러오기
export async function fetchComments(postId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// users 정보 매핑 (user_id/reply_to 배열로)
export async function fetchUsersMap(userIds: string[]) {
  if (!userIds.length) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .in("id", userIds);
  if (error) throw error;
  const usersMap: {
    [userId: string]: { username: string; avatar_url: string | null };
  } = {};
  (data || []).forEach((u: any) => {
    usersMap[u.id] = {
      username: u.username,
      avatar_url: u.avatar_url || null,
    };
  });
  return usersMap;
}

// 댓글 등록
export async function addComment({
  postId,
  content,
  userId,
}: {
  postId: string;
  content: string;
  userId: string;
}) {
  try {
    // 게시글 제목 가져오기 (로그용)
    const supabase = createClient();
    const { data: postData } = await supabase
      .from("board_posts")
      .select("title")
      .eq("id", postId)
      .single();

    const { data, error } = await supabase
      .from("board_comments")
      .insert([{ post_id: postId, content, user_id: userId }])
      .select()
      .single();

    if (error) throw error;

    // 댓글 생성 로그 기록
    if (data?.id) {
      await logCommentCreate(userId, data.id, postData?.title || "제목 없음", {
        post_id: postId,
        content_length: content.length,
      });
    }

    return data;
  } catch (error) {
    console.error("댓글 등록 오류:", error);
    throw error;
  }
}

// 대댓글 등록
export async function addReply({
  postId,
  content,
  userId,
  parentId,
  replyTo,
}: {
  postId: string;
  content: string;
  userId: string;
  parentId: string;
  replyTo: string;
}) {
  try {
    // 게시글 제목 가져오기 (로그용)
    const supabase = createClient();
    const { data: postData } = await supabase
      .from("board_posts")
      .select("title")
      .eq("id", postId)
      .single();

    const { data, error } = await supabase
      .from("board_comments")
      .insert([
        {
          post_id: postId,
          content,
          user_id: userId,
          parent_id: parentId,
          reply_to: replyTo,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 대댓글 생성 로그 기록
    if (data?.id) {
      await logCommentCreate(userId, data.id, postData?.title || "제목 없음", {
        post_id: postId,
        parent_id: parentId,
        reply_to: replyTo,
        content_length: content.length,
        is_reply: true,
      });
    }

    return data;
  } catch (error) {
    console.error("대댓글 등록 오류:", error);
    throw error;
  }
}

// 댓글 삭제
export async function deleteComment(commentId: string) {
  try {
    // 삭제할 댓글 정보 먼저 가져오기 (로그용)
    const supabase = createClient();
    const { data: commentData } = await supabase
      .from("board_comments")
      .select(
        `
        id,
        content,
        user_id,
        post_id,
        board_posts!inner(title)
      `
      )
      .eq("id", commentId)
      .single();

    const { error } = await supabase
      .from("board_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    // 댓글 삭제 로그 기록
    if (commentData && commentData.user_id) {
      const postTitle = (commentData as any).board_posts?.title || "제목 없음";
      await logCommentDelete(commentData.user_id, commentId, postTitle, {
        post_id: commentData.post_id,
        content_length: commentData.content?.length || 0,
      });
    }
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    throw error;
  }
}

// 댓글 수정
export async function updateComment({
  commentId,
  content,
}: {
  commentId: string;
  content: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_comments")
    .update({ content })
    .eq("id", commentId);
  if (error) throw error;
}
