"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IPage, IWidget, IMediaWidgetOptions, IBoardPost } from "@/types/index";
import Link from "next/link";
import { supabase } from "@/db";

interface MediaWidgetProps {
  widget: IWidget & {
    display_options?: IMediaWidgetOptions;
  };
  page?: IPage;
  posts?: IBoardPost[];
}

export function MediaWidget({
  widget,
  page,
  posts: initialPosts = [],
}: MediaWidgetProps) {
  // 초기 데이터로 상태 초기화
  const [posts, setPosts] = useState<IBoardPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시 키 생성 - 위젯 ID와 페이지 ID 기반
  const getCacheKey = (widgetId: string, pageId: string) => {
    return `media_widget_${widgetId}_${pageId}`;
  };

  // 로컬 스토리지에서 미디어 데이터 가져오기
  const getLocalMediaPosts = (widgetId: string, pageId: string) => {
    if (typeof window === "undefined") return null;

    try {
      const cacheKey = getCacheKey(widgetId, pageId);
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;

      const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);

      // 캐시 유효시간 확인 (10분)
      const isExpired = Date.now() - timestamp > 10 * 60 * 1000;

      if (isExpired) {
        return null; // 캐시 만료되었으면 null 반환
      }

      return cachedPosts;
    } catch (err) {
      console.error("캐시된 미디어 데이터 불러오기 오류:", err);
      return null;
    }
  };

  // 로컬 스토리지에 미디어 데이터 저장
  const saveLocalMediaPosts = (
    widgetId: string,
    pageId: string,
    postsData: IBoardPost[]
  ) => {
    if (typeof window === "undefined") return;

    try {
      const cacheKey = getCacheKey(widgetId, pageId);
      const dataToCache = {
        posts: postsData,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    } catch (err) {
      console.error("미디어 데이터 캐싱 오류:", err);
    }
  };

  // 미디어 데이터 가져오기 (캐시 사용 여부 지정 가능)
  const loadMediaPosts = async (skipCache = false) => {
    // 페이지 ID 확인
    const pageId = page?.id || widget.display_options?.page_id;
    if (!pageId || !widget.id) {
      setError("페이지 ID가 없어 데이터를 로드할 수 없습니다.");
      return;
    }

    try {
      // 캐시 사용 여부 확인
      if (!skipCache) {
        const cachedPosts = getLocalMediaPosts(widget.id, pageId);
        if (cachedPosts) {
          setPosts(cachedPosts);
          // 백그라운드에서 데이터 갱신 (사용자에게 로딩 표시 없이)
          setTimeout(() => loadMediaPosts(true), 100);
          return;
        }
      }

      if (!skipCache) {
        setIsLoading(true);
      }
      setError(null);

      // 최적화: JOIN을 사용해 한 번의 쿼리로 게시물과 작성자 정보 가져오기
      const limit = widget.display_options?.item_count || 6; // 기본값 6개 (메인 1개 + 사이드바 5개)

      const { data, error } = await supabase
        .from("board_posts")
        .select("*")
        .eq("page_id", pageId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      if (data && data.length > 0) {
        setPosts(data as IBoardPost[]);
        // 캐시에 데이터 저장
        saveLocalMediaPosts(widget.id, pageId, data as IBoardPost[]);
      } else {
        setPosts([]);
        // 빈 배열도 캐싱 (서버에 데이터가 없다는 사실도 캐싱 가치가 있음)
        saveLocalMediaPosts(widget.id, pageId, []);
      }
    } catch (err: any) {
      console.error("미디어 데이터를 불러오는 중 오류가 발생했습니다:", err);
      if (!skipCache) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (!skipCache) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // 초기 데이터가 있으면 로드하지 않음
    if (initialPosts.length > 0) {
      setPosts(initialPosts);

      // 초기 데이터도 캐싱
      const pageId = page?.id || widget.display_options?.page_id;
      if (pageId && widget.id) {
        saveLocalMediaPosts(widget.id, pageId, initialPosts);
      }
      return;
    }

    // 초기 데이터가 없으면 로드
    loadMediaPosts();
  }, [
    page?.id,
    widget.id,
    widget.display_options?.page_id,
    initialPosts.length,
  ]);

  return (
    <div className="h-full">
      <div className="py-6">
        {/* 로딩 중일 때는 아무것도 표시하지 않음 */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">오류!</strong>
            <span className="block sm:inline ml-1">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {widget.display_options?.media_title ||
                  "지금 미디어, 다양한 미디어 콘텐츠를 만나보세요"}
              </h3>
              <p className="text-gray-600 text-sm">
                {widget.display_options?.media_subtitle ||
                  "최신 영상, 오디오 콘텐츠를 한 곳에서 확인하세요"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Featured Video */}
              <div className="lg:col-span-2">
                {posts.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 rounded-md">
                    <Link href={`${page?.slug}/${posts[0].id}`}>
                      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-700 group cursor-pointer">
                        {posts[0].thumbnail_image ? (
                          <img
                            src={posts[0].thumbnail_image}
                            alt={posts[0].title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full object-cover bg-gray-200"></div>
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
                            {/* <circle cx="12" cy="12" r="10"></circle> */}
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                          </svg>
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs bg-black/50 bg-red-100 text-red-800 py-1 px-2 rounded">
                          {/* 동영상 시간은 실제 데이터에 있다면 사용할 수 있습니다 */}
                          NEW
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="w-full overflow-hidden">
                          <h4 className="text-lg font-medium truncate block w-full">
                            {posts[0].title}
                          </h4>
                        </div>
                        <div className="h-5 flex items-center space-x-3 truncate text-sm text-gray-700">
                          {posts[0].description && (
                            <span>{posts[0].description}</span>
                          )}
                        </div>
                        <div className="pt-1 flex items-center justify-end space-x-2">
                          <span className="text-xs text-gray-500 ">
                            {posts[0].author || ""} ·{" "}
                            {new Date(posts[0].created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>

                              <span>
                                {posts[0].views || posts[0].view_count || 0}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                              </svg>
                              <span> {posts[0].likes_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ) : null}
              </div>

              {/* Video List */}
              <div className="space-y-3">
                {posts.length > 1
                  ? posts.slice(1).map((post) => (
                      <div
                        key={post.id}
                        className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 rounded-md w-full"
                      >
                        <Link
                          href={`${page?.slug}/${post.id}`}
                          className="flex flex-row w-full group"
                        >
                          <div className="relative w-20 sm:w-28 h-20 flex-shrink-0">
                            {post.thumbnail_image ? (
                              <img
                                src={post.thumbnail_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200"></div>
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
                              <h4 className="text-md font-medium truncate block w-full">
                                {post.title}
                              </h4>
                            </div>
                            <div className="h-5 flex items-center space-x-3 truncate text-xs text-gray-600">
                              {post.description && (
                                <span>{post.description}</span>
                              )}
                            </div>
                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] text-gray-500">
                                {post.author || "익명"} ·{" "}
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                              <div className="flex items-center space-x-2 text-[10px] text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  <span>{post.views || 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                  </svg>
                                  <span>{post.likes_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))
                  : posts.length === 0
                    ? null
                    : null}

                <Link
                  href={page?.slug || "/"}
                  className="w-full py-2 px-4 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors text-sm flex items-center justify-center"
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
                    className="ml-1"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
