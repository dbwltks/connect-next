"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { IWidget, IPage } from "@/types";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

interface Post {
  id: string;
  title: string;
  views: number;
  like_count: number;
  comment_count: number;
  page_id: string;
}

interface PopularPostsWidgetProps {
  widget: IWidget;
  page?: IPage;
}

// SWR 페처 함수 분리 - 메뉴 URL 매핑과 함께 반환
async function fetchPopularPosts(
  itemCount: number,
  sortBy: string
): Promise<{ posts: Post[]; menuUrlMap: Record<string, string> }> {
  const result = await api.popular.getPosts(itemCount, sortBy as 'views' | 'likes' | 'comments');
  // API 응답이 { posts: [...], menuUrlMap: {...} } 구조
  const posts = result.posts || result || [];
  const menuUrlMap = result.menuUrlMap || {};
  return { posts, menuUrlMap };
}

export default function PopularPostsWidget({
  widget,
  page,
}: PopularPostsWidgetProps) {
  const itemCount = widget.display_options?.item_count || 5;
  const sortBy = widget.display_options?.sort_by || "views";

  // 메뉴 URL 계산 (boardlist-widget.tsx와 동일한 방식)
  const menuUrl = page?.slug || widget.display_options?.menu_url || "/";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ['popularPosts', itemCount, sortBy],
    () => fetchPopularPosts(itemCount, sortBy),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const posts = data?.posts || [];
  const menuUrlMap = data?.menuUrlMap || {};

  // 게시글별 메뉴 URL 매핑을 함수로 처리 - 쿼리스트링 방식으로 변경
  const getPostUrl = (post: Post) => {
    const menuUrl = menuUrlMap[post.page_id];
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden border-gray-100 border">
        <div className="px-4 py-3 border-b">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="px-4 py-2 space-y-3">
          {[...Array(itemCount)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
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
          <h3 className="text-base text-gray-800 font-semibold">
            {widget.title || "인기 게시글"}
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
    <div className="bg-white rounded-lg overflow-hidden border border-slate-100">
      <div className="px-4 py-3 border-b">
        <h3 className="text-base text-gray-800 font-semibold">
          {widget.title || "인기 게시글"}
        </h3>
      </div>
      {posts && posts.length > 0 ? (
        <ul className="px-4 py-3 space-y-3">
          {posts.map((post, index) => {
            const rank = index + 1;
            let rankStyle = "text-gray-400 font-semibold";
            if (rank === 1)
              rankStyle =
                "font-bold px-1 py-0.5 rounded-sm bg-amber-50 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300";
            else if (rank === 2)
              rankStyle =
                "font-bold px-1 py-0.5 rounded-sm bg-amber-50 text-amber-400 dark:bg-amber-500/15 dark:text-amber-400/80";
            else if (rank === 3)
              rankStyle =
                "px-1 py-0.5 rounded-sm bg-amber-25 text-amber-300 dark:bg-amber-500/10 dark:text-amber-500/80 font-bold";

            return (
              <li
                key={post.id}
                className="flex items-center text-sm widget-scale"
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-xs mr-1 ${rankStyle}`}
                >
                  {rank}
                </span>
                <Link
                  href={getPostUrl(post)}
                  className="flex-1 truncate text-xs text-gray-700"
                >
                  {post.title}
                </Link>
                {sortBy === "likes" ? (
                  <div className="flex items-center ml-2 text-xs">
                    <Heart className="w-3 h-3 mr-1 text-red-400 fill-current" />
                    <span className="text-red-400">{post.like_count || 0}</span>
                  </div>
                ) : sortBy === "comments" ? (
                  <div className="flex items-center ml-2 text-xs">
                    <span className="mr-1">💬</span>
                    <span className="text-blue-400">
                      {post.comment_count || 0}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center ml-2 text-xs">
                    <span className="mr-1">👀</span>
                    <span className="text-blue-400">{post.views || 0}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-4 text-center text-gray-500">
          <div className="text-lg mb-2">📝</div>
          <div>게시글이 없습니다</div>
        </div>
      )}
    </div>
  );
}
