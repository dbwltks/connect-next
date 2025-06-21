import { Card, CardContent } from "@/components/ui/card";
import { IPage, IWidget, IMediaWidgetOptions, IBoardPost } from "@/types/index";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { fetchMediaWidgetPosts } from "@/services/widgetService";

interface MediaWidgetProps {
  widget: IWidget;
}

export function MediaWidget({ widget }: MediaWidgetProps) {
  const [posts, setPosts] = useState<IBoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("미디어 위젯 데이터:", {
      widget,
      displayOptions: widget.display_options,
      pageId: widget.display_options?.page_id,
    });

    const pageId = widget.display_options?.page_id;
    if (!pageId) {
      setError("페이지가 선택되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchMediaWidgetPosts(pageId)
      .then((data) => {
        setPosts(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("미디어 게시글 로딩 실패:", err);
        setError("게시글을 불러오는데 실패했습니다.");
        setIsLoading(false);
      });
  }, [widget.display_options?.page_id]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">게시글이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl border border-gray-100 p-6">
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

        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 ">
          {/* Featured Video */}
          <div className="lg:col-span-2">
            {posts.length > 0 ? (
              <div className="border border-gray-100 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 rounded-lg overflow-hidden">
                <Link
                  href={`${widget.display_options?.page_slug}/${posts[0].id}`}
                >
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
                    className="overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-500 transform hover:-translate-y-1 rounded-lg w-full"
                  >
                    <Link
                      href={`${widget.display_options?.page_slug}/${post.id}`}
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
                          <h4 className="text-md truncate block w-full">
                            {post.title}
                          </h4>
                        </div>
                        <div className="h-5 flex items-center space-x-3 truncate text-xs text-gray-600">
                          {post.description && <span>{post.description}</span>}
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
              href={widget.display_options?.page_slug || "/"}
              className="w-full py-2 px-4 border border-gray-200 rounded-md hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 text-sm flex items-center justify-center"
            >
              {widget.display_options?.media_more_text || "더 많은 미디어 보기"}
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
    </div>
  );
}
