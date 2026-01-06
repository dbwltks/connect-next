"use client";

import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { api } from "@/lib/api";
import { IBoardPost } from "@/types/index";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// 게시물 데이터를 가져오는 fetcher 함수
async function fetchEventPosts(pageId: string, limit: number = 4) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ Events fetch error:", error);
    throw error;
  }
}

export function Events() {
  // 교회 소식 페이지 ID (고정)
  const pageId = "4c38782d-ea47-4f5c-ade6-9c46a933702d";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["eventPosts", pageId],
    () => fetchEventPosts(pageId, 4),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const posts = data?.posts || [];
  const menuUrlMap = data?.menuUrlMap || {};

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <section
        id="events"
        className="bg-gray-50 dark:bg-gray-950 flex flex-col"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex-1 flex flex-col py-16 md:py-32">
          <div className="mb-12 md:mb-16">
            <span className="text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
              Upcoming
            </span>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] mt-6 mb-4 tracking-tight text-black dark:text-white">
              다가오는 이벤트
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-800 h-64 md:h-full mb-4 md:mb-6"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 에러 또는 데이터가 없을 때 기본 이벤트 표시
  const events = posts && posts.length > 0 ? posts : [];

  return (
    <section id="events" className="bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex flex-col py-16 md:py-24">
        <div className="mb-12 md:mb-16">
          <span className="text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Upcoming
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.1] mt-6 mb-4 tracking-tight text-black dark:text-white">
            교회 소식
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 py-12">
            등록된 소식이 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일: Swiper 캐러셀 */}
            <div className="md:hidden">
              <Swiper
                modules={[Pagination, Navigation]}
                slidesPerView={2}
                spaceBetween={12}
                pagination={{
                  clickable: true,
                  bulletActiveClass:
                    "swiper-pagination-bullet-active !bg-black dark:!bg-white",
                }}
                style={{
                  paddingBottom: "38px",
                }}
              >
                {events.map((post: IBoardPost, index: number) => (
                  <SwiperSlide key={post.id}>
                    <Link
                      href={getPostUrl(post)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="relative rounded-2xl aspect-[3/4] overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
                        {post.thumbnail_image ? (
                          <ImageWithFallback
                            src={post.thumbnail_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                            <span className="text-white text-4xl font-bold opacity-50">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                          <h3 className="font-medium text-sm text-white mb-1 line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="flex gap-2 text-xs text-white/80">
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* 데스크탑: Grid 레이아웃 */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {events.map((post: IBoardPost, index: number) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
                  className="group cursor-pointer flex flex-col"
                >
                  <div className="relative rounded-2xl aspect-[3/4] overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4 md:mb-6">
                    {post.thumbnail_image ? (
                      <ImageWithFallback
                        src={post.thumbnail_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-50">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 z-10">
                      <h3 className="text-2xl text-white mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex gap-4 text-sm text-white/80">
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        {events.length > 0 && (
          <div className="sm:mt-16 mt-8 text-center">
            <Link href={menuUrlMap[pageId] || "#"}>
              <button className="px-12 py-5 border-2 rounded-2xl border-black dark:border-white text-black dark:text-white text-sm uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                View All News
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
