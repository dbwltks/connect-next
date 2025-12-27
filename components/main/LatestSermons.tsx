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
async function fetchSermonPosts(pageId: string, limit: number = 3) {
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

export function LatestSermons() {
  // 예배와 말씀 페이지 ID (고정)
  const pageId = "a379684a-b9a1-4c51-a126-918d1c0e9b30";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["sermonPosts", pageId],
    () => fetchSermonPosts(pageId, 3),
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
      year: "numeric",
    });
  };

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  const sermons = posts && posts.length > 0 ? posts : [];

  return (
    <section id="sermons" className="bg-black text-white sm:py-32 py-16">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-14 sm:mb-20">
          <span className="text-sm uppercase tracking-[0.3em] text-white/40">Latest Messages</span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.1] mt-6 mb-6 tracking-tight">
            최신 설교
          </h2>
          <p className="text-xl text-white/60">
            말씀으로 함께 성장합니다
          </p>
        </div>

{isLoading ? (
          <>
            {/* 모바일 로딩 */}
            <div className="md:hidden">
              <div className="animate-pulse">
                <div className="aspect-video bg-white/5 mb-6"></div>
                <div className="h-6 bg-white/5 mb-3 w-3/4"></div>
                <div className="h-4 bg-white/5 w-1/2"></div>
              </div>
            </div>
            {/* 데스크탑 로딩 */}
            <div className="hidden md:grid grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-white/5 mb-6"></div>
                  <div className="h-6 bg-white/5 mb-3 w-3/4"></div>
                  <div className="h-4 bg-white/5 w-1/2"></div>
                </div>
              ))}
            </div>
          </>
        ) : sermons.length === 0 ? (
          <div className="text-center text-white/40 py-20">
            등록된 설교가 없습니다.
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
                  bulletActiveClass: 'swiper-pagination-bullet-active !bg-white',
                }}
                style={{
                  paddingBottom: '48px',
                }}
              >
                {sermons.map((post: IBoardPost) => (
                  <SwiperSlide key={post.id}>
                    <Link
                      href={getPostUrl(post)}
                      className="group cursor-pointer block"
                    >
                      <div className="relative aspect-video overflow-hidden mb-6 bg-white/5">
                        {post.thumbnail_image ? (
                          <ImageWithFallback
                            src={post.thumbnail_image}
                            alt={post.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <span className="text-white text-4xl font-bold opacity-30">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-xl md:text-2xl group-hover:text-white/70 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                        </div>
                        <div className="flex gap-4 text-sm text-white/40 uppercase tracking-widest">
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
              {sermons.map((post: IBoardPost) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-video overflow-hidden mb-6 bg-white/5">
                    {post.thumbnail_image ? (
                      <ImageWithFallback
                        src={post.thumbnail_image}
                        alt={post.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-30">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-xl md:text-2xl group-hover:text-white/70 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
                    </div>
                    <div className="flex gap-4 text-sm text-white/40 uppercase tracking-widest">
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="mt-20 text-center">
          <button className="px-12 py-5 border-2 border-white text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all">
            View All Sermons
          </button>
        </div>
      </div>
    </section>
  );
}
