"use client";

import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// 설교 데이터 가져오기
async function fetchSermonPosts(pageId: string, limit: number = 2) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ Sermons fetch error:", error);
    throw error;
  }
}

// 찬양 데이터 가져오기
async function fetchWorshipPosts(pageId: string, limit: number = 4) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ Worship fetch error:", error);
    throw error;
  }
}

export function SermonWorship() {
  const sermonPageId = "a379684a-b9a1-4c51-a126-918d1c0e9b30";
  const worshipPageId = "dc8460ce-b35b-4b2a-8844-91c18028bdad";

  // 설교 데이터
  const { data: sermonData, isLoading: sermonLoading } = useSWR(
    ["sermonPosts", sermonPageId],
    () => fetchSermonPosts(sermonPageId, 2),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // 찬양 데이터
  const { data: worshipData, isLoading: worshipLoading } = useSWR(
    ["worshipPosts", worshipPageId],
    () => fetchWorshipPosts(worshipPageId, 4),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const sermons = sermonData?.posts || [];
  const sermonMenuUrlMap = sermonData?.menuUrlMap || {};
  const worships = worshipData?.posts || [];
  const worshipMenuUrlMap = worshipData?.menuUrlMap || {};

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost, menuUrlMap: Record<string, string>) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex flex-col py-16 md:py-24">
        {/* 헤더 */}
        <div className="mb-0">
          <span className="lg:text-sm text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Messages & Worship
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3rem)] font-medium leading-[1.1] my-4 tracking-tight text-black dark:text-white">
            말씀과 찬양
          </h2>
        </div>

        {/* 설교 섹션 - 2개 */}
        <div className="mb-4">
          <div className="flex justify-end mb-4">
            <Link
              href={sermonMenuUrlMap[sermonPageId] || "#"}
              className="group text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              자세히보기
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {sermonLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 mb-6"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : sermons.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10">
              등록된 설교가 없습니다.
            </div>
          ) : (
            <>
              {/* 모바일: Swiper */}
              <div className="md:hidden">
                <Swiper
                  modules={[Navigation]}
                  slidesPerView={1}
                  spaceBetween={16}
                >
                  {sermons.map((post: IBoardPost) => (
                    <SwiperSlide key={post.id}>
                      <Link
                        href={getPostUrl(post, sermonMenuUrlMap)}
                        className="group cursor-pointer block border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                      >
                        <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
                          {post.thumbnail_image ? (
                            <ImageWithFallback
                              src={post.thumbnail_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                              <span className="text-white text-4xl font-bold opacity-30">
                                {post.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="text-base font-bold text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                          </div>
                          <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* 데스크탑: Grid 2열 */}
              <div className="hidden md:grid grid-cols-2 gap-8">
                {sermons.map((post: IBoardPost) => (
                  <Link
                    key={post.id}
                    href={getPostUrl(post, sermonMenuUrlMap)}
                    className="group cursor-pointer block border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-video overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {post.thumbnail_image ? (
                        <ImageWithFallback
                          src={post.thumbnail_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <span className="text-white text-3xl font-bold opacity-30">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="lg:text-lg text-sm font-bold text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                      </div>
                      <div className="flex gap-4 lg:text-sm text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 찬양 섹션 - 4개 */}
        <div>
          {worshipLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 mb-6 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : worships.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10">
              등록된 게시물이 없습니다.
            </div>
          ) : (
            <>
              {/* 모바일: Swiper - 2개씩 */}
              <div className="md:hidden">
                <Swiper
                  modules={[Pagination]}
                  slidesPerView={2}
                  spaceBetween={12}
                  pagination={{
                    clickable: true,
                    bulletActiveClass:
                      "swiper-pagination-bullet-active !bg-black dark:!bg-white",
                  }}
                  style={{ paddingBottom: "38px" }}
                >
                  {worships.map((post: IBoardPost) => (
                    <SwiperSlide key={post.id}>
                      <Link
                        href={getPostUrl(post, worshipMenuUrlMap)}
                        className="group cursor-pointer block"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-lg mb-3 bg-gray-200 dark:bg-gray-800">
                          {post.thumbnail_image ? (
                            <ImageWithFallback
                              src={post.thumbnail_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold opacity-30">
                                {post.title.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-black dark:text-white line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* 데스크탑: Grid 4열 */}
              <div className="hidden md:grid grid-cols-4 gap-8">
                {worships.map((post: IBoardPost) => (
                  <Link
                    key={post.id}
                    href={getPostUrl(post, worshipMenuUrlMap)}
                    className="group cursor-pointer block"
                  >
                    <div className="relative aspect-video overflow-hidden mb-6 rounded-xl bg-gray-200 dark:bg-gray-800">
                      {post.thumbnail_image ? (
                        <ImageWithFallback
                          src={post.thumbnail_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold opacity-30">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-base font-bold text-black dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <ChevronRight className="w-5 h-5 text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </div>
                      <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end mt-4">
            <Link
              href={worshipMenuUrlMap[worshipPageId] || "#"}
              className="group text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
            >
              자세히보기
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
