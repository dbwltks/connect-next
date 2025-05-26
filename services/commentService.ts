import { supabase } from "@/db";

// 댓글 목록 불러오기
export async function fetchComments(postId: string) {
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
  const { error } = await supabase
    .from("board_comments")
    .insert([{ post_id: postId, content, user_id: userId }]);
  if (error) throw error;
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
  const { error } = await supabase.from("board_comments").insert([
    {
      post_id: postId,
      content,
      user_id: userId,
      parent_id: parentId,
      reply_to: replyTo,
    },
  ]);
  if (error) throw error;
}

// 댓글 삭제
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from("board_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}

// 댓글 수정
export async function updateComment({
  commentId,
  content,
}: {
  commentId: string;
  content: string;
}) {
  const { error } = await supabase
    .from("board_comments")
    .update({ content })
    .eq("id", commentId);
  if (error) throw error;
}
