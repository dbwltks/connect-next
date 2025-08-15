"use client";

import Link from "next/link";
import { api } from "@/lib/api";
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
  const result = await api.comments.getRecent(itemCount);
  // API 응답이 { comments: [...], menuUrlMap: {...} } 구조
  return { 
    comments: Array.isArray(result) ? result : result.comments || [],
    menuUrlMap: result.menuUrlMap || {}
  };
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
    () => fetchRecentComments(itemCount)
    // 전역 설정 사용 - 필요한 경우만 오버라이드
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="px-4 py-2 space-y-3">
          {[...Array(itemCount)].map((_, i: any) => (
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-red-200 dark:border-red-700">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {widget.title || "최신 댓글"}
          </h3>
        </div>
        <div className="p-4 text-center">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-lg mb-1">❌</div>
            <div className="font-medium mb-1">데이터를 불러올 수 없습니다</div>
            <div className="text-sm text-red-500 dark:text-red-400">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {widget.title || "최신 댓글"}
        </h3>
      </div>
      {comments && comments.length > 0 ? (
        <ul className="px-4 py-2 space-y-2 widget-scale">
          {comments.map((comment: any) => (
            <li key={comment.id} className="text-sm">
              <Link href={getCommentUrl(comment)} className="hover:text-blue-600 dark:hover:text-blue-400">
                <p className="truncate text-gray-900 dark:text-white">{comment.content}</p>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
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
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg mb-2">💬</div>
          <div>댓글이 없습니다</div>
        </div>
      )}
    </div>
  );
}
