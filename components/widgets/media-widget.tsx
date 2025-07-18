import { Skeleton } from "@/components/ui/skeleton";
import { IWidget } from "@/types/index";
import Link from "next/link";
import React from "react";
import { api } from "@/lib/api";
import useSWR from "swr";
import { Heart } from "lucide-react";

interface MediaWidgetProps {
  widget: IWidget;
  page?: { slug?: string; url?: string };
}

// SWR 키와 페처 함수
const fetchMediaData = async (pageId: string, maxItems: number = 5) => {
  // API를 통해 미디어 게시글 데이터 가져오기
  const result = await api.posts.getForMedia(pageId, maxItems);
  const posts = Array.isArray(result) ? result : result.posts || [];

  // 정렬: published_at 우선, 없으면 created_at
  const sortedPosts = [...posts].sort((a: any, b: any) => {
    const aDate = new Date(a.published_at || a.created_at);
    const bDate = new Date(b.published_at || b.created_at);
    const timeDiff = bDate.getTime() - aDate.getTime();

    if (timeDiff === 0) {
      return a.id.localeCompare(b.id);
    }

    return timeDiff;
  });

  return { posts: sortedPosts, menuUrlMap: result.menuUrlMap || {} };
};

export function MediaWidget({ widget, page }: MediaWidgetProps) {
  const pageId = widget.display_options?.page_id;
  // 표시할 항목 개수 (기본값: 5개, 최대: 10개)
  const itemCount = widget.display_options?.item_count;
  const maxItems = Math.min(parseInt(itemCount?.toString() || "5"), 10);

  const { data, error, isLoading } = useSWR(
    pageId ? ["mediaWidgetPosts", pageId, maxItems] : null,
    () => fetchMediaData(pageId!, maxItems)
    // 전역 설정 사용 - 필요한 경우만 오버라이드
  );

  // 페이지 ID가 없는 경우
  if (!pageId) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-100 p-4">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">⚙️</div>
            <div>페이지 ID가 설정되지 않았습니다</div>
            <div className="text-sm mt-1">
              위젯 설정에서 페이지를 선택해주세요
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-100 p-4">
        <div className="text-center mb-6">
          <Skeleton className="h-4 w-48 mx-auto mb-2" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {/* Featured Video Skeleton */}
          <div className="lg:col-span-2">
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-3">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Video List Skeleton */}
          <div className="space-y-3">
            {[...Array(Math.max(maxItems - 1, 0))].map((_, index: any) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg overflow-hidden"
              >
                <div className="flex">
                  <Skeleton className="w-20 sm:w-28 h-20 flex-shrink-0" />
                  <div className="p-2 flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="h-full bg-white rounded-xl border border-red-200 p-4">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg mb-2">❌</div>
            <div className="font-medium mb-1">데이터를 불러올 수 없습니다</div>
            <div className="text-sm text-red-500">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  // 게시글별 메뉴 URL 매핑을 함수로 처리 - 쿼리스트링 방식으로 변경
  const getPostUrl = (post: any) => {
    const menuUrlMap = data?.menuUrlMap as Record<string, string> | undefined;
    const menuUrl =
      menuUrlMap?.[post.page_id] || page?.slug || page?.url || "/";
    return `${menuUrl}?post=${post.id}`;
  };

  // 데이터가 없는 경우
  if (!data || data.posts.length === 0) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-100 p-4">
        <div className="text-center mb-6">
          {widget.display_options?.media_description && (
            <div className="mb-2 text-gray-700 text-base">
              {widget.display_options.media_description}
            </div>
          )}
          <h3 className="sm:text-2xl text-xl font-bold text-gray-900 mb-2">
            {widget.display_options?.media_title ||
              "지금 미디어, 다양한 미디어 콘텐츠를 만나보세요"}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            {widget.display_options?.media_subtitle ||
              "최신 영상, 오디오 콘텐츠를 한 곳에서 확인하세요"}
          </p>
        </div>

        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📹</div>
          <div className="text-gray-500">등록된 미디어가 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-100 p-4">
      <div>
        <div className="text-center mb-6">
          {widget.display_options?.media_description && (
            <div className="mb-2 text-gray-700 text-base">
              {widget.display_options.media_description}
            </div>
          )}
          <h3 className="sm:text-2xl text-xl font-bold text-gray-900 mb-2">
            {widget.display_options?.media_title ||
              "지금 미디어, 다양한 미디어 콘텐츠를 만나보세요"}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            {widget.display_options?.media_subtitle ||
              "최신 영상, 오디오 콘텐츠를 한 곳에서 확인하세요"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {/* Featured Video */}
          <div className="lg:col-span-3 col-span-2">
            <div className="border border-gray-100 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 rounded-lg overflow-hidden">
              <Link href={getPostUrl(data.posts[0])}>
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-700 group cursor-pointer">
                  {data.posts[0].thumbnail_image ? (
                    <img
                      src={data.posts[0].thumbnail_image}
                      alt={data.posts[0].title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full object-cover bg-gray-200 flex items-center justify-center">
                      <div className="text-gray-400 text-4xl">📹</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                    </svg>
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs bg-black/50 bg-red-100 text-red-800 py-1 px-2 rounded">
                    NEW
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <div className="w-full overflow-hidden">
                    <h4 className="text-xl font-medium truncate block w-full">
                      {data.posts[0].title}
                    </h4>
                  </div>
                  <div className="h-5 flex items-center space-x-3 truncate text-sm text-gray-600">
                    {data.posts[0].description && (
                      <span> {data.posts[0].description}</span>
                    )}
                  </div>
                  <div className="pt-1 flex items-center justify-end space-x-3">
                    <span className="text-xs text-gray-500">
                      {new Date(data.posts[0].created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span className="">👀</span>
                        <span>
                          {data.posts[0].views || data.posts[0].view_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-red-500 fill-current" />
                        <span>{data.posts[0].likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-3 col-span-2">
            {data.posts.slice(1).map((post: any) => (
              <div
                key={post.id}
                className="overflow-hidden bg-white border border-gray-100 hover:shadow-md transition-all duration-500 transform hover:-translate-y-1 rounded-lg w-full"
              >
                <Link
                  href={getPostUrl(post)}
                  className="flex flex-row w-full group"
                >
                  <div className="relative w-20 sm:w-28 h-20 flex-shrink-0">
                    {post.thumbnail_image ? (
                      <img
                        src={post.thumbnail_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        {/* <div className="text-gray-400 text-xl">📹</div> */}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/10 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        className="text-white opacity-80 group-hover:opacity-100"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 flex-1 w-full overflow-hidden">
                    <div className="w-full overflow-hidden">
                      <div className="text-base truncate block w-full">
                        {post.title}
                      </div>
                    </div>
                    <div className="h-5 flex items-center space-x-3 truncate text-xs text-gray-600">
                      {post.description && <span>{post.description}</span>}
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span className="">👀</span>
                          <span>{post.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-red-500 fill-current" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {data.posts.length > 1 && (
              <Link
                href={page?.slug || page?.url || "/"}
                className="w-full bg-white py-2 px-4 border border-gray-200 rounded-md hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 text-sm flex items-center justify-center group"
              >
                {widget.display_options?.media_more_text ||
                  "더 많은 미디어 보기"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1 transition-transform duration-200 group-hover:translate-x-1"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
