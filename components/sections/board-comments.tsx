"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User,
  MoreHorizontal,
  Trash2,
  Reply,
  Image,
  Smile,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import {
  fetchComments,
  fetchUsersMap,
  addComment,
  addReply,
  deleteComment as serviceDeleteComment,
  updateComment as serviceUpdateComment,
} from "@/services/commentService";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";

interface BoardComment {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_id?: string | null;
  reply_to?: string | null;
  users?: {
    username: string;
    avatar_url: string | null;
  };
}

// 대댓글 트리 구조 생성 함수 - 한 단계만 들여쓰기
function buildCommentTree(
  comments: BoardComment[]
): Array<BoardComment & { replies: BoardComment[] }> {
  const map = new Map<string, BoardComment & { replies: BoardComment[] }>();
  const roots: Array<BoardComment & { replies: BoardComment[] }> = [];
  const allReplies: string[] = []; // 대댓글 ID만 저장하는 배열이므로 string[] 타입으로 변경

  // 모든 댓글 맵 생성
  comments.forEach((c: BoardComment) => {
    map.set(c.id, { ...c, replies: [] });
  });

  // 모든 댓글 분류
  comments.forEach((comment: BoardComment) => {
    if (comment.parent_id) {
      // 대댓글이든 대대댓글이든 모두 최상위 부모를 찾음
      let rootParentId = comment.parent_id;
      let rootParent = map.get(rootParentId);

      // 최상위 부모가 있는지 확인 (루트 댓글인지)
      while (rootParent && rootParent.parent_id) {
        rootParentId = rootParent.parent_id;
        rootParent = map.get(rootParentId);
      }

      // 최상위 부모에 대한 대댓글로 추가
      if (rootParent) {
        allReplies.push(comment.id); // 대댓글 ID 추가
        const commentWithReplies = map.get(comment.id);
        if (commentWithReplies) {
          rootParent.replies.push(commentWithReplies);
        }
      }
    } else {
      const commentWithReplies = map.get(comment.id);
      if (commentWithReplies) {
        roots.push(commentWithReplies);
      }
    }
  });

  // 루트 댓글에서 중복 대댓글 제거
  roots.forEach((root) => {
    const uniqueReplies = new Map<
      string,
      BoardComment & { replies: BoardComment[] }
    >();
    // 타입 단언을 사용하여 타입 오류 해결
    root.replies.forEach((reply) => {
      uniqueReplies.set(
        reply.id,
        reply as BoardComment & { replies: BoardComment[] }
      );
    });
    root.replies = Array.from(uniqueReplies.values());
  });

  return roots;
}

// 아바타 공통 컴포넌트
function UserAvatar({
  userId,
  username,
  size = 8, // tailwind 기준 (h-8 w-8 등)
  avatarMap,
  className = "",
}: {
  userId?: string;
  username?: string;
  size?: number;
  avatarMap?: { [userId: string]: string | null };
  className?: string;
}) {
  return (
    <Avatar className={`h-${size} w-${size} ${className}`}>
      <AvatarImage
        src={
          (userId && avatarMap?.[userId]) ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${username}`
        }
        alt={username}
      />
      <AvatarFallback>
        {username?.substring(0, 2).toUpperCase() || "U"}
      </AvatarFallback>
    </Avatar>
  );
}

export default function BoardComments({
  postId,
  allowComments = true,
}: {
  postId: string;
  allowComments?: boolean;
}) {
  // 게시글 작성자 정보 상태
  const [postAuthor, setPostAuthor] = useState<{
    username: string;
    user_id: string | null;
  } | null>(null);
  // 댓글 목록 상태
  const [comments, setComments] = useState<BoardComment[]>([]);
  // 댓글 입력 상태: { [댓글id]: 답글텍스트 }
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  // 답글 입력창 오픈 상태: 현재 열린 댓글 ID
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 댓글 입력 상태
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 메뉴 외부 클릭 감지를 위한 ref
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 댓글 수정 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  // 로그인 유저 가져오기 (단일 선언)
  async function getHeaderUser() {
    try {
      const supabase = createClient();
      // 먼저 Supabase 세션 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // users 테이블에서 username, nickname, role 받아오기
        const { data: profile } = await supabase
          .from("users")
          .select("username, nickname, role")
          .eq("id", session.user.id)
          .single();
        return {
          id: session.user.id,
          username: profile?.nickname || profile?.username || "익명",
          email: session.user.email,
          role: profile?.role || undefined,
        };
      }
      // Supabase 세션이 없으면 로컬/세션 스토리지 확인
      if (typeof window === "undefined") return null;
      const stored =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          username: parsed.username || "익명",
          role: parsed.role || undefined,
        };
      } catch {
        return null;
      }
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      return null;
    }
  }
  // 사용자 정보 가져오기
  const { user } = useAuth();
  const { profile } = useUserProfile(user);

  // 댓글 아바타 맵 상태 추가
  const [avatarMap, setAvatarMap] = useState<{
    [userId: string]: string | null;
  }>({});

  // reply_to(user_id) → {username, avatar_url} 매핑 상태 추가
  const [replyToMap, setReplyToMap] = useState<{
    [userId: string]: { username: string; avatar_url: string | null };
  }>({});

  // 댓글 목록 조회 시 join 없이 user_id만 가져옴
  useEffect(() => {
    async function loadComments() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchComments(postId);
        setComments(data);
      } catch (error: any) {
        setError("댓글을 불러오는 중 오류가 발생했습니다.");
      }
      setLoading(false);
    }
    loadComments();
  }, [postId]);

  // 댓글 목록 불러온 후 user_id, reply_to 모두 users 테이블에서 avatar_url, username 조회
  useEffect(() => {
    async function loadUsersMap() {
      // 댓글 작성자들 + 현재 로그인한 사용자 ID 수집
      let userIds: string[] = [];
      if (comments.length === 0 && user?.id) {
        userIds = [user?.id].filter((id): id is string => typeof id === "string");
      } else {
        userIds = Array.from(
          new Set([
            ...comments.map((c: any) => c.user_id),
            ...comments.map((c: any) => c.reply_to),
            ...(user?.id ? [user.id] : []), // 현재 로그인한 사용자 ID 추가
          ])
        ).filter((id): id is string => typeof id === "string");
      }
      if (userIds.length === 0) return;
      try {
        const usersMap = await fetchUsersMap(userIds);
        setReplyToMap(usersMap);
        // avatarMap도 usersMap에서 추출
        const avatarMap: { [userId: string]: string | null } = {};
        Object.entries(usersMap).forEach(([id, u]) => {
          avatarMap[id] = u.avatar_url;
        });
        setAvatarMap(avatarMap);
      } catch {}
    }
    loadUsersMap();
  }, [comments, user]);

  useEffect(() => {
    async function fetchPostAuthor() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_posts")
        .select("author, user_id")
        .eq("id", postId)
        .single();
      if (!error && data) {
        setPostAuthor({
          username: data.author,
          user_id: data.user_id,
        });
      }
    }
    fetchPostAuthor();
  }, [postId]);

  if (loading) return <div className="text-gray-400 dark:text-gray-500 py-4">댓글 로딩 중...</div>;
  if (error) return <div className="text-red-500 dark:text-red-400 py-4">{error}</div>;

  // 댓글 등록 핸들러
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      toast({
        title: "댓글 내용 필요",
        description: "댓글 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const currentUser = await getHeaderUser();
      if (!currentUser || !currentUser.id) {
        toast({
          title: "로그인 필요",
          description: "댓글을 작성하려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
      await addComment({ postId, content: comment, userId: currentUser.id });
      setComment("");
      toast({
        title: "댓글 등록 완료",
        description: "댓글이 성공적으로 등록되었습니다.",
      });
      // 새로고침
      const data = await fetchComments(postId);
      setComments(data);
    } catch (err: any) {
      setSubmitError(err.message || "댓글 등록 중 오류가 발생했습니다.");
      toast({
        title: "댓글 등록 실패",
        description: err.message || "댓글 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // 대댓글 등록 핸들러
  const handleReplySubmit = async (c: BoardComment) => {
    if (!replyInputs[c.id]?.trim()) {
      toast({
        title: "답글 내용 필요",
        description: "답글 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    try {
      const currentUser = await getHeaderUser();
      if (!currentUser || !currentUser.id) {
        toast({
          title: "로그인 필요",
          description: "답글을 작성하려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
      await addReply({
        postId,
        content: replyInputs[c.id],
        userId: currentUser.id,
        parentId: c.id,
        replyTo: c.user_id,
      });
      setReplyInputs((prev) => ({ ...prev, [c.id]: "" }));
      setActiveReplyId(null);
      // 새로고침
      const data = await fetchComments(postId);
      setComments(data);
      toast({
        title: "답글 등록 완료",
        description: "답글이 성공적으로 등록되었습니다.",
      });
    } catch (err: any) {
      toast({
        title: "답글 등록 실패",
        description: err.message || "답글 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 대댓글 렌더링 함수
  function renderCommentTree(
    tree: Array<BoardComment & { replies: BoardComment[] }>,
    depth = 0,
    replyIndex = 0
  ) {
    // 댓글과 대댓글 모두 최대 한 번만 들여쓰기
    return (
      <ul
        className={
          depth === 0 ? "space-y-4" : "mt-2 space-y-4 border-t border-gray-200 dark:border-gray-600"
        }
      >
        {tree.map((c: BoardComment & { replies: BoardComment[] }, index: any) => (
          <li
            key={c.id}
            className={`pt-4 ${index !== 0 ? "border-t border-gray-200 dark:border-gray-600" : ""} ${depth > 0 ? "ml-12" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                <UserAvatar
                  userId={c.user_id}
                  username={replyToMap[c.user_id]?.username}
                  size={9}
                  avatarMap={avatarMap}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {replyToMap[c.user_id]?.username}
                  </span>
                  {postAuthor?.user_id && c.user_id === postAuthor.user_id && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      작성자
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <div className="text-gray-800 dark:text-gray-200 text-[15px] mb-2">
                  {editingCommentId === c.id ? (
                    <form
                      className="mt-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!editInput.trim()) {
                          toast({
                            title: "내용 필요",
                            description: "수정할 내용을 입력하세요.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setEditLoading(true);
                        try {
                          await serviceUpdateComment({
                            commentId: c.id,
                            content: editInput,
                          });
                          setEditingCommentId(null);
                          setEditInput("");
                          const data = await fetchComments(postId);
                          setComments(data);
                          toast({
                            title: "수정 완료",
                            description: "댓글이 수정되었습니다.",
                          });
                        } catch (err: any) {
                          toast({
                            title: "수정 실패",
                            description:
                              err.message ||
                              "댓글 수정 중 오류가 발생했습니다.",
                            variant: "destructive",
                          });
                        } finally {
                          setEditLoading(false);
                        }
                      }}
                    >
                      <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              userId={user?.id || ""}
                              username={profile?.username || ""}
                              size={6}
                              avatarMap={avatarMap}
                            />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {profile?.username}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {editInput.length}/1000
                          </span>
                        </div>
                        <input
                          type="text"
                          className="w-full px-4 focus:outline-none text-sm text-gray-800 dark:text-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="댓글을 수정하세요"
                          value={editInput}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= 1000) {
                              setEditInput(newValue);
                            }
                          }}
                          maxLength={1000}
                          required
                          disabled={editLoading}
                          autoFocus
                        />
                        <div className="flex justify-between items-center p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                              tabIndex={-1}
                            >
                              <Image className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                              tabIndex={-1}
                            >
                              <Smile className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-xs"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditInput("");
                              }}
                              disabled={editLoading}
                            >
                              취소
                            </button>
                            <button
                              type="submit"
                              className={`px-3 py-2 rounded-md text-xs transition-colors duration-200 ${editInput.trim() ? "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800" : " cursor-not-allowed"}`}
                              disabled={!editInput.trim() || editLoading}
                            >
                              {editLoading ? "등록중" : "등록"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* 대댓글일 경우에만 '@유저이름' 표시, 두번째 답글부터 표시 */}
                      {c.parent_id &&
                        c.reply_to &&
                        typeof c.reply_to === "string" &&
                        replyToMap[c.reply_to] && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium mr-1">
                            @{replyToMap[c.reply_to].username}
                          </span>
                        )}
                      {c.content}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* 로그인 유저만 답글 버튼 노출 */}
                  {user && profile?.username && (
                    <button
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs flex items-center gap-1"
                      onClick={() => {
                        if (activeReplyId === c.id) {
                          setActiveReplyId(null);
                        } else {
                          setActiveReplyId(c.id);
                          setReplyInputs((prev) => ({ ...prev, [c.id]: "" }));
                        }
                      }}
                    >
                      <Reply className="h-3.5 w-3.5" />
                      {activeReplyId === c.id ? "취소" : "답글"}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-gray-400 dark:text-gray-500 relative" ref={menuRef}>
                <button
                  className="p-1 hover:text-gray-600 dark:hover:text-gray-400 rounded-full"
                  onClick={() =>
                    setActiveMenuId(activeMenuId === c.id ? null : c.id)
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {activeMenuId === c.id && user && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 shadow-md rounded-md py-1 z-10 w-24 border dark:border-gray-600">
                    {/* 본인 댓글이면 수정/삭제, 관리자면 삭제만 */}
                    {user?.id === c.user_id && (
                      <button
                        className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                        onClick={() => {
                          setEditingCommentId(c.id);
                          setEditInput(c.content);
                          setActiveMenuId(null);
                        }}
                      >
                        <Reply className="h-3.5 w-3.5" />
                        수정
                      </button>
                    )}
                    {(user?.id === c.user_id || profile?.role === "admin") && (
                      <button
                        className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                        onClick={async () => {
                          if (window.confirm("댓글을 삭제하시겠습니까?")) {
                            await serviceDeleteComment(c.id);
                            // 새로고침
                            const data = await fetchComments(postId);
                            setComments(data);
                            toast({
                              title: "댓글 삭제 완료",
                              description: "댓글이 성공적으로 삭제되었습니다.",
                            });
                          }
                          setActiveMenuId(null);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* 답글 입력창 - 하나만 표시 */}
            {activeReplyId === c.id && user && (
              <form
                className="mt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  handleReplySubmit(c);
                }}
              >
                <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      {/* 작성자(로그인 유저) 아바타/이름 */}
                      <UserAvatar
                        userId={user?.id || ""}
                        username={profile?.username || ""}
                        size={6}
                        avatarMap={avatarMap}
                      />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {profile?.username}
                      </span>
                      {/* 답글 대상 username은 placeholder에서만 사용 */}
                      {c.parent_id &&
                        c.reply_to &&
                        typeof c.reply_to === "string" &&
                        replyToMap[c.reply_to] && (
                          <span className="font-medium text-xs text-blue-600 dark:text-blue-400 ml-2">
                            @{replyToMap[c.reply_to]?.username}님께 답글
                          </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {(replyInputs[c.id] || "").length}/1000
                    </span>
                  </div>
                  <input
                    type="text"
                    className="w-full px-4 focus:outline-none text-sm text-gray-800 dark:text-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={
                      c.parent_id &&
                      c.reply_to &&
                      typeof c.reply_to === "string"
                        ? `${replyToMap[c.reply_to]?.username || replyToMap[c.user_id]?.username || ""}님께 답글쓰기`
                        : "답글을 입력하세요"
                    }
                    value={replyInputs[c.id] || ""}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue.length <= 1000) {
                        setReplyInputs((prev) => ({
                          ...prev,
                          [c.id]: newValue,
                        }));
                      }
                    }}
                    maxLength={1000}
                    required
                  />
                  <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                      >
                        <Image className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md text-xs"
                        onClick={() => setActiveReplyId(null)}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className={`px-3 py-2 rounded-md text-xs transition-colors duration-200 ${replyInputs[c.id]?.trim() ? "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800" : " cursor-not-allowed"}`}
                        disabled={!replyInputs[c.id]?.trim()}
                      >
                        등록
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
            {/* 대댓글 재귀 렌더링 - 들여쓰기 한 번만 */}
            {c.replies.length > 0 && (
              <div className="mt-4">
                {renderCommentTree(
                  c.replies as Array<
                    BoardComment & { replies: BoardComment[] }
                  >,
                  depth + 1,
                  0
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // 트리 구조로 변환
  const commentTree = buildCommentTree(comments);

  // 댓글 허용 여부에 따라 다른 UI 렌더링
  if (!allowComments) {
    return (
      <div className="">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            작성자가 댓글을 허용하지 않은 게시글입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h3 className="font-bold text-md mb-2 text-gray-900 dark:text-white">댓글</h3>
      {comments.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">아직 댓글이 없습니다.</div>
      ) : (
        renderCommentTree(
          commentTree as Array<BoardComment & { replies: BoardComment[] }>,
          0
        )
      )}
      <Toaster />
      {/* 댓글 입력 폼 - 로그인 유저만 */}
      {user && profile?.username ? (
        <form onSubmit={handleSubmit} className="pt-6">
          <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <UserAvatar
                  userId={user?.id || ""}
                  username={profile?.username || ""}
                  size={8}
                  avatarMap={avatarMap}
                />
                <span className="font-medium text-sm text-gray-900 dark:text-white">{profile?.username}</span>
                {postAuthor?.user_id && user?.id === postAuthor.user_id}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {comment.length}/1000
              </span>
            </div>
            <input
              type="text"
              className="w-full p-4 focus:outline-none text-sm text-gray-800 dark:text-gray-200 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="댓글을 남겨보세요"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setComment(e.target.value);
                }
              }}
              maxLength={1000}
              required
              disabled={submitting}
            />
            <div className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                >
                  <Image className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
              <div>
                <button
                  type="submit"
                  className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${comment.trim() ? "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800" : " cursor-not-allowed"}`}
                  disabled={submitting || !comment.trim()}
                >
                  <span className="text-sm">
                    {submitting ? "등록 중..." : "등록"}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {submitError && (
            <div className="text-red-500 dark:text-red-400 text-sm mt-2">{submitError}</div>
          )}
        </form>
      ) : (
        <div className="text-gray-400 dark:text-gray-500 text-xs mt-4">
          로그인 후 댓글 작성 가능
        </div>
      )}
    </div>
  );
}
