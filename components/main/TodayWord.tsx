"use client";

import { ArrowRight } from "lucide-react";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";

// 게시물 데이터를 가져오는 fetcher 함수
async function fetchBoardPosts(pageId: string, limit: number = 5) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ TodayWord fetch error:", error);
    throw error;
  }
}

export function TodayWord() {
  // BIBLE CONNECT IN 페이지 ID 및 주보 페이지 ID
  const bcinPageId = "bf8f4735-bed5-48e7-8220-77d1af9e2a11";
  const bulletinPageId = "aecbfe7e-9ca4-43b1-a7fe-6f7250c87fe7";

  // SWR을 사용한 데이터 페칭 (BCIN)
  const { data: bcinData, isLoading: isBcinLoading } = useSWR(
    ["bcinPosts", bcinPageId],
    () => fetchBoardPosts(bcinPageId, 5),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // SWR을 사용한 데이터 페칭 (주보)
  const { data: bulletinData, isLoading: isBulletinLoading } = useSWR(
    ["bulletinPosts", bulletinPageId],
    () => fetchBoardPosts(bulletinPageId, 5),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const bcinPosts = bcinData?.posts || [];
  const bcinMenuUrlMap = bcinData?.menuUrlMap || {};
  
  const bulletinPosts = bulletinData?.posts || [];
  const bulletinMenuUrlMap = bulletinData?.menuUrlMap || {};

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost, menuUrlMap: Record<string, string>) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  return (
    <section id="today-word" className="min-h-screen bg-white flex items-center py-24 border-b border-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* 왼쪽: 성경과 커넥트 */}
          <div>
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-sm uppercase tracking-[0.3em] text-gray-400">Bible Connect IN</span>
                <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] mt-4 tracking-tight">
                  성경과 커넥트
                </h2>
              </div>
              <Link href="/sermons/bcin">
                <button className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium hover:opacity-60 transition-opacity mb-1">
                  전체보기 <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>

            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {isBcinLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-6 animate-pulse">
                    <div className="h-3 bg-gray-100 w-20 mb-3"></div>
                    <div className="h-6 bg-gray-100 w-3/4"></div>
                  </div>
                ))
              ) : bcinPosts.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  등록된 말씀이 없습니다.
                </div>
              ) : (
                bcinPosts.map((post: IBoardPost) => (
                  <Link
                    key={post.id}
                    href={getPostUrl(post, bcinMenuUrlMap)}
                    className="group flex flex-col justify-center py-6 hover:bg-gray-50/50 transition-all px-4 -mx-4 rounded-xl"
                  >
                    <div className="text-[11px] text-gray-400 tracking-wider mb-2">
                      {formatDate(post.published_at || post.created_at)}
                    </div>
                    <h3 className="text-lg md:text-xl tracking-tight group-hover:text-black/70 transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 오른쪽: 주보 */}
          <div>
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-sm uppercase tracking-[0.3em] text-gray-400">Weekly Bulletin</span>
                <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] mt-4 tracking-tight">
                  온라인 주보
                </h2>
              </div>
              <Link href="/connecting/weekly-bulletin">
                <button className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium hover:opacity-60 transition-opacity mb-1">
                  전체보기 <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>

            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {isBulletinLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-6 animate-pulse">
                    <div className="h-3 bg-gray-100 w-20 mb-3"></div>
                    <div className="h-6 bg-gray-100 w-3/4"></div>
                  </div>
                ))
              ) : bulletinPosts.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  등록된 주보가 없습니다.
                </div>
              ) : (
                bulletinPosts.map((post: IBoardPost) => (
                  <Link
                    key={post.id}
                    href={getPostUrl(post, bulletinMenuUrlMap)}
                    className="group flex flex-col justify-center py-6 hover:bg-gray-50/50 transition-all px-4 -mx-4 rounded-xl"
                  >
                    <div className="text-[11px] text-gray-400 tracking-wider mb-2">
                      {formatDate(post.published_at || post.created_at)}
                    </div>
                    <h3 className="text-lg md:text-xl tracking-tight group-hover:text-black/70 transition-colors line-clamp-1">
                      {post.title}
                    </h3>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
