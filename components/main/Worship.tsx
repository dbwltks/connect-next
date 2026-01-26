"use client";

import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// 게시물 데이터를 가져오는 fetcher 함수
async function fetchWorshipPosts(pageId: string, limit: number = 3) {
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

export function Worship() {
  // 찬양과 간증 페이지 ID (고정)
  const pageId = "dc8460ce-b35b-4b2a-8844-91c18028bdad";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["worshipPosts", pageId],
    () => fetchWorshipPosts(pageId, 3),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const posts = data?.posts || [];
  const menuUrlMap = data?.menuUrlMap || {};

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
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  const worships = posts && posts.length > 0 ? posts : [];

  return (
    <section id="worship" className="bg-black dark:bg-gray-950 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex flex-col py-16 md:py-24">
        <div className="mb-12">
          <span className="lg:text-sm text-xs uppercase tracking-[0.3em] text-gray-500">
            Praise & Testimony
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3rem)] font-medium leading-[1.1] my-4 tracking-tight text-white">
            찬양과 간증
          </h2>
          <p className="lg:text-xl text-base text-gray-400">
            하나님께 드리는 찬양과 은혜의 간증
          </p>
        </div>

        {isLoading ? (
          <>
            {/* 모바일 로딩 */}
            <div className="md:hidden">
              <div className="animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 mb-6"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
              </div>
            </div>
            {/* 데스크탑 로딩 */}
            <div className="hidden md:grid grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-800 mb-6"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/2"></div>
                </div>
              ))}
            </div>
          </>
        ) : worships.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            등록된 게시물이 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일: Swiper 캐러셀 */}
            <div className="md:hidden">
              <Swiper
                modules={[Pagination, Navigation]}
                slidesPerView={1}
                spaceBetween={16}
                pagination={{
                  clickable: true,
                  bulletActiveClass:
                    "swiper-pagination-bullet-active !bg-white",
                }}
                style={{
                  paddingBottom: "38px",
                }}
              >
                {worships.map((post: IBoardPost) => (
                  <SwiperSlide key={post.id}>
                    <Link
                      href={getPostUrl(post)}
                      className="group cursor-pointer block"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-2xl mb-6 bg-gray-200 dark:bg-gray-800">
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
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-base font-bold md:text-2xl text-white group-hover:text-gray-300 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                        </div>
                        <div className="flex gap-4 text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* 데스크탑: Grid 레이아웃 */}
            <div className="hidden md:grid grid-cols-3 gap-8">
              {worships.map((post: IBoardPost) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
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
                        <span className="text-white text-3xl font-bold opacity-30">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="lg:text-base text-sm font-bold text-white group-hover:text-gray-300 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                    </div>
                    <div className="flex gap-4 lg:text-sm text-xs text-gray-400 uppercase tracking-widest">
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="sm:mt-16 mt-8 text-center">
          <Link href={menuUrlMap[pageId] || "#"}>
            <button className="px-12 py-5 border-2 rounded-2xl border-white text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              View All Praise & Testimony
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
