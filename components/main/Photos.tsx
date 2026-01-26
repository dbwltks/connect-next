"use client";

import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";

// 게시물 데이터를 가져오는 fetcher 함수
async function fetchPhotoPosts(pageId: string, limit: number = 6) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ Photos fetch error:", error);
    throw error;
  }
}

export function Photos() {
  // 사진속 커넥트 페이지 ID (고정)
  const pageId = "037cba64-c934-4ef6-a01c-1e01d3931919";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["photoPosts", pageId],
    () => fetchPhotoPosts(pageId, 4),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const posts = data?.posts || [];
  const menuUrlMap = data?.menuUrlMap || {};

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  return (
    <section id="photos" className="py-24 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <span className="lg:text-sm text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Memory
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,3rem)] font-medium leading-[1.1] my-4 tracking-tight text-black dark:text-white">
            사진 속 커넥트
          </h2>
        </div>

        {isLoading ? (
          <>
            {/* 모바일 로딩 - 4개 */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 dark:bg-gray-800 aspect-square"
                ></div>
              ))}
            </div>
            {/* 데스크탑 로딩 - 3개 */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 dark:bg-gray-800 aspect-square"
                ></div>
              ))}
            </div>
          </>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            등록된 사진이 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일: 4개 표시 (2x2) */}
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {posts.map((post: IBoardPost) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-square relative"
                >
                  {post.thumbnail_image ? (
                    <ImageWithFallback
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-lg">
                        {post.title}
                      </span>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <p className="text-white text-lg font-medium px-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {post.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {/* 데스크탑: 3개 표시 */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {posts.slice(0, 3).map((post: IBoardPost) => (
                <Link
                  key={post.id}
                  href={getPostUrl(post)}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 aspect-square relative"
                >
                  {post.thumbnail_image ? (
                    <ImageWithFallback
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-lg">
                        {post.title}
                      </span>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <p className="text-white text-lg font-medium px-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {post.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {posts.length > 0 && (
          <div className="mt-16 text-center">
            <Link href={menuUrlMap[pageId] || "#"}>
              <button className="px-12 py-5 border-2 rounded-2xl border-black dark:border-white text-black dark:text-white text-sm uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                View All Photos
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
