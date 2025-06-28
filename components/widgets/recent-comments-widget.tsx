"use client";

import Link from "next/link";
import { supabase } from "@/db";
import { IWidget, IPage } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  board_posts: any;
}

interface RecentCommentsWidgetProps {
  widget: IWidget;
  page?: IPage;
}

// SWR 페처 함수 분리 - 메뉴 URL 매핑과 함께 반환
async function fetchRecentComments(
  itemCount: number
): Promise<{ comments: Comment[]; menuUrlMap: Record<string, string> }> {
  const { data, error } = await supabase
    .from("board_comments")
    .select(
      "id, content, created_at, post_id, board_posts!inner( title, status, page_id )"
    )
    .eq("board_posts.status", "published")
    .order("created_at", { ascending: false })
    .limit(itemCount);

  if (error) throw error;

  const comments = (data || []) as Comment[];

  // 메뉴 URL 매핑 생성
  const uniquePageIds = Array.from(
    new Set(
      comments
        .map((comment) => {
          const post = Array.isArray(comment.board_posts)
            ? comment.board_posts[0]
            : comment.board_posts;
          return post?.page_id;
        })
        .filter(Boolean)
    )
  );

  const menuUrlMap: Record<string, string> = {};

  for (const pId of uniquePageIds) {
    const { data: menuData, error: menuError } = await supabase
      .from("cms_menus")
      .select("*")
      .eq("page_id", pId);

    if (!menuError && menuData && menuData.length > 0) {
      menuUrlMap[pId] = (menuData[0] as any).url;
    }
  }

  return { comments, menuUrlMap };
}

export default function RecentCommentsWidget({
  widget,
  page,
}: RecentCommentsWidgetProps) {
  const itemCount = widget.display_options?.item_count || 5;

  // 메뉴 URL 계산 (boardlist-widget.tsx와 동일한 방식)
  const menuUrl = page?.slug || widget.display_options?.menu_url || "/";

  const { data, error, isLoading } = useSWR(
    ["recentComments", itemCount],
    () => fetchRecentComments(itemCount),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1분간 중복 요청 방지 (댓글은 비교적 자주 업데이트됨)
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      shouldRetryOnError: true,
    }
  );

  const comments = data?.comments || [];
  const menuUrlMap = data?.menuUrlMap || {};

  // 댓글별 메뉴 URL 매핑을 함수로 처리 - 쿼리스트링 방식으로 변경
  const getCommentUrl = (comment: Comment) => {
    const post = Array.isArray(comment.board_posts)
      ? comment.board_posts[0]
      : comment.board_posts;
    const menuUrl = menuUrlMap[post?.page_id];
    return menuUrl
      ? `${menuUrl}?post=${comment.post_id}`
      : `/?post=${comment.post_id}`;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden border-gray-100 border">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="px-4 py-2 space-y-3">
          {[...Array(itemCount)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden border-red-200 border">
        <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold">
            {widget.title || "최신 댓글"}
          </h3>
        </div>
        <div className="p-4 text-center">
          <div className="text-red-600">
            <div className="text-lg mb-1">❌</div>
            <div className="font-medium mb-1">데이터를 불러올 수 없습니다</div>
            <div className="text-sm text-red-500">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h3 className="text-base font-semibold">
          {widget.title || "최신 댓글"}
        </h3>
      </div>
      {comments && comments.length > 0 ? (
        <ul className="px-4 py-2 space-y-2 widget-scale">
          {comments.map((comment) => (
            <li key={comment.id} className="text-sm">
              <Link href={getCommentUrl(comment)} className="">
                <p className="truncate">{comment.content}</p>
                <span className="block truncate text-xs text-gray-500">
                  -{" "}
                  {Array.isArray(comment.board_posts)
                    ? comment.board_posts[0]?.title
                    : comment.board_posts?.title || "원본 게시글"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <div className="text-lg mb-2">💬</div>
          <div>댓글이 없습니다</div>
        </div>
      )}
    </div>
  );
}
