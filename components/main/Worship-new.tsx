"use client";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

// 게시물 데이터를 가져오는 fetcher 함수
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

export function WorshipNew() {
  // 찬양과 간증 페이지 ID (고정)
  const pageId = "dc8460ce-b35b-4b2a-8844-91c18028bdad";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["worshipPosts", pageId],
    () => fetchWorshipPosts(pageId, 4),
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  const worships = posts && posts.length > 0 ? posts : [];

  return (
    <section id="worship-new" className="bg-black dark:bg-gray-950 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex flex-col py-16 md:py-24">
        <div className="mb-12 text-center">
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
                <div className="aspect-square bg-gray-800 mb-4 rounded-lg"></div>
              </div>
            </div>
            {/* 데스크탑 로딩 */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-800 rounded-lg"></div>
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
                modules={[Pagination]}
                slidesPerView={1.2}
                spaceBetween={12}
                centeredSlides={true}
                pagination={{
                  clickable: true,
                  bulletActiveClass:
                    "swiper-pagination-bullet-active !bg-white",
                }}
                style={{
                  paddingBottom: "40px",
                }}
              >
                {worships.map((post: IBoardPost) => (
                  <SwiperSlide key={post.id}>
                    <Link
                      href={getPostUrl(post)}
                      className="group cursor-pointer block"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-900">
                        {post.thumbnail_image ? (
                          <ImageWithFallback
                            src={post.thumbnail_image}
                            alt={post.title}
                            className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-110 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <span className="text-white text-5xl font-bold opacity-20">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        {/* 하단 그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                        {/* 하단 텍스트 */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-xs text-gray-400 mb-2">{formatDate(post.created_at)}</p>
                          <h3 className="text-sm font-bold text-white line-clamp-2">
                            {post.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* 데스크탑: Grid 레이아웃 */}
            <div className="hidden md:grid grid-cols-4 gap-4">
              {worships.map((post: IBoardPost) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-900">
                    {post.thumbnail_image ? (
                      <ImageWithFallback
                        src={post.thumbnail_image}
                        alt={post.title}
                        className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-110 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <span className="text-white text-5xl font-bold opacity-20">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* 하단 그라데이션 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* 하단 텍스트 */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-xs text-gray-400 mb-2">{formatDate(post.created_at)}</p>
                      <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-gray-200 transition-colors">
                        {post.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="sm:mt-16 mt-8 text-center">
          <Link href={menuUrlMap[pageId] || "#"}>
            <button className="px-12 py-5 bg-white text-black text-sm uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all">
              View All
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
