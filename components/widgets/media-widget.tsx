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
  isPreview?: boolean;
}

export function MediaWidget({
  widget,
  page,
  posts: initialPosts = [],
  isPreview = false,
}: MediaWidgetProps) {
  // 미리보기 모드일 경우 생성할 샘플 데이터
  const samplePosts: IBoardPost[] = [
    {
      id: "1",
      title: "샘플 미디어 콘텐츠 1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: "샘플 작성자",
      view_count: 123,
      content: "샘플 내용입니다.",
      thumbnail: undefined,
      page_id: "sample",
      status: "published",
      user_id: "sample",
    },
    {
      id: "2",
      title: "샘플 미디어 콘텐츠 2",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: "샘플 작성자",
      view_count: 76,
      content: "샘플 내용입니다.",
      thumbnail: undefined,
      page_id: "sample",
      status: "published",
      user_id: "sample",
    },
    {
      id: "3",
      title: "샘플 미디어 콘텐츠 3",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: "샘플 작성자",
      view_count: 42,
      content: "샘플 내용입니다.",
      thumbnail: undefined,
      page_id: "sample",
      status: "published",
      user_id: "sample",
    },
    {
      id: "4",
      title: "샘플 미디어 콘텐츠 4",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: "샘플 작성자",
      view_count: 89,
      content: "샘플 내용입니다.",
      thumbnail: undefined,
      page_id: "sample",
      status: "published",
      user_id: "sample",
    },
  ];

  // 초기화 시 미리보기 모드면 바로 샘플 데이터 사용
  const [posts, setPosts] = useState<IBoardPost[]>(
    isPreview ? samplePosts : initialPosts
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 디버깅용 로그 추가
  console.log("[미디어 위젯] 초기화:", {
    isPreview,
    widget,
    page,
    initialPostsLength: initialPosts.length,
  });

  useEffect(() => {
    // 미리보기 모드일 때는 샘플 데이터 사용
    if (isPreview) {
      console.log("[미디어 위젯] 미리보기 모드 사용 중");
      // 이미 useState에서 초기화 했으므로 여기서는 추가 작업 없음
      return;
    }

    // 초기 데이터가 있으면 로드하지 않음
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
      console.log("[미디어 위젯] 초기 데이터 사용:", initialPosts);
      return;
    }

    // 페이지 ID 또는 display_options에 페이지 ID가 없으면 로드하지 않음
    const pageId = page?.id || widget.display_options?.page_id;
    console.log("[미디어 위젯] 페이지 ID:", pageId);
    if (!pageId) {
      console.log(
        "[미디어 위젯] 페이지 ID가 없어 데이터를 로드할 수 없습니다."
      );
      setError("페이지 ID가 없어 데이터를 로드할 수 없습니다.");
      return;
    }

    const loadMediaPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 미리보기 모드일 경우 샘플 데이터 사용
        if (isPreview) {
          setPosts([
            {
              id: "1",
              title: "샘플 미디어 콘텐츠 1",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author: "샘플 작성자",
              view_count: 123,
              content: "샘플 내용입니다.",
              thumbnail: undefined,
              page_id: "sample",
            },
            {
              id: "2",
              title: "샘플 미디어 콘텐츠 2",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author: "샘플 작성자",
              view_count: 76,
              content: "샘플 내용입니다.",
              thumbnail: undefined,
              page_id: "sample",
            },
            {
              id: "3",
              title: "샘플 미디어 콘텐츠 3",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author: "샘플 작성자",
              view_count: 42,
              content: "샘플 내용입니다.",
              thumbnail: undefined,
              page_id: "sample",
            },
          ]);
          return;
        }

        // 실제 데이터 로드 - join 제거하고 기본 쿼리로 돌리기
        let query = supabase
          .from("board_posts")
          .select("*")
          .eq("page_id", pageId)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        // 표시할 항목 수 제한
        const limit = widget.display_options?.item_count || 6; // 기본값 6개로 변경 (메인 1개 + 사이드바 5개)
        query = query.limit(limit);

        console.log("[미디어 위젯] 데이터 조회 시도:", { pageId, limit });
        const { data, error } = await query;
        console.log("[미디어 위젯] 데이터 결과:", { data, error });

        if (error) throw error;

        if (data && data.length > 0) {
          // 게시물 데이터 처리 및 작성자 정보 가져오기
          const processedPosts = [];

          for (const post of data) {
            // 작성자 정보 가져오기 (boardService.ts의 getHeaderUser 함수와 동일한 방식)
            let authorName = "익명";

            if (post.user_id) {
              // 사용자 정보와 프로필 정보 함께 가져오기
              const { data: userInfo } = await supabase
                .from("users")
                .select("email")
                .eq("id", post.user_id)
                .single();

              const { data: profile } = await supabase
                .from("profiles")
                .select("username, full_name")
                .eq("id", post.user_id)
                .single();

              // boardService.ts의 getHeaderUser와 동일한 처리 방식 적용
              authorName =
                profile?.username ||
                (userInfo?.email ? userInfo.email.split("@")[0] : null) ||
                profile?.full_name ||
                "익명";
            }

            processedPosts.push({
              ...post,
              thumbnail: post.thumbnail_image, // 실제 DB에는 thumbnail_image 필드로 저장되어 있음
              author: authorName, // 프로필에서 가져온 사용자 이름 설정
            });
          }

          console.log("[미디어 위젯] 처리된 데이터:", processedPosts);
          setPosts(processedPosts as IBoardPost[]);
        } else {
          setPosts([]);
        }
      } catch (err: any) {
        console.error("미디어 데이터를 불러오는 중 오류가 발생했습니다:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaPosts();
  }, [
    page?.id,
    widget.display_options?.page_id,
    isPreview,
    initialPosts.length,
  ]);

  return (
    <div className="h-full">
      <div className="py-6">
        {isLoading && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-500">데이터 불러오는 중...</span>
          </div>
        )}

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
                        {posts[0].thumbnail ? (
                          <img
                            src={posts[0].thumbnail}
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
                        <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white py-1 px-2 rounded">
                          {/* 동영상 시간은 실제 데이터에 있다면 사용할 수 있습니다 */}
                          미디어
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            NEW
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <span>
                                {posts[0].author || "익명"} ·{"  "}
                                {new Date(
                                  posts[0].created_at
                                ).toLocaleDateString()}
                                {"   "}
                              </span>
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
                        <div className="w-full overflow-hidden">
                          <h4 className="text-lg font-medium truncate block w-full">
                            {posts[0].title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{posts[0].author || "익명"}</span>
                          <span>·</span>

                          <span>
                            {new Date(posts[0].created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-md h-full">
                    <div className="p-4 flex items-center justify-center h-full bg-gray-50 text-gray-500">
                      등록된 미디어 콘텐츠가 없습니다.
                    </div>
                  </div>
                )}
              </div>

              {/* Video List */}
              <div className="space-y-3">
                {posts.length > 1 ? (
                  posts.slice(1).map((post, index) => (
                    <div
                      key={post.id}
                      className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 rounded-md w-full"
                    >
                      <Link
                        href={`${page?.slug}/${post.id}`}
                        className="flex flex-row w-full"
                      >
                        <div className="relative w-20 sm:w-28 h-16 sm:h-20 flex-shrink-0">
                          {post.thumbnail ? (
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200"></div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              className="sm:w-4 sm:h-4 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                        <div className="p-1.5 sm:p-2 flex-1 w-full overflow-hidden">
                          <div className="w-full overflow-hidden">
                            <h4 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1 truncate block w-full">
                              {post.title}
                            </h4>
                          </div>
                          <div className="flex flex-col sm:space-y-1 text-[10px] sm:text-xs text-gray-500">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <span
                                className="truncate inline-block"
                                style={{ maxWidth: "70px" }}
                              >
                                {post.author || "익명"}
                              </span>
                              <span className="text-[8px] sm:text-xs">·</span>
                              <span className="text-[10px] sm:text-xs whitespace-nowrap">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="8"
                                height="8"
                                className="sm:w-[10px] sm:h-[10px]"
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
                              <span className="ml-1 text-[10px] sm:text-xs">
                                {post.views || post.view_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    등록된 미디어 콘텐츠가 없습니다.
                  </div>
                ) : null}

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
