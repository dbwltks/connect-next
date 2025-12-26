"use client";

import { Play } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import useSWR from "swr";
import { IBoardPost } from "@/types/index";
import Link from "next/link";

// 게시물 데이터를 가져오는 fetcher 함수
async function fetchVideoPosts(pageId: string, limit: number = 2) {
  try {
    const url = `/api/board-posts?pageId=${pageId}&limit=${limit}&type=widget`;
    const response = await fetch(url);
    const result = await response.json();
    return {
      posts: Array.isArray(result) ? result : result.posts || [],
      menuUrlMap: result.menuUrlMap || {},
    };
  } catch (error) {
    console.error("❌ Videos fetch error:", error);
    throw error;
  }
}

export function Videos() {
  // 미디어 속 커넥트 페이지 ID (고정)
  const pageId = "2bb2b2c6-a830-4a90-995e-1bb196013f22";

  // SWR을 사용한 데이터 페칭
  const { data, error, isLoading } = useSWR(
    ["videoPosts", pageId],
    () => fetchVideoPosts(pageId, 2),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const posts = data?.posts || [];
  const menuUrlMap = data?.menuUrlMap || {};

  // 게시글별 메뉴 URL 매핑 함수
  const getPostUrl = (post: IBoardPost) => {
    const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
    return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
  };

  return (
    <section id="videos" className="py-24 bg-gray-50 text-black">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-16">
          <span className="text-sm uppercase tracking-[0.3em] text-gray-400">Video</span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] mt-6 mb-4 tracking-tight">
            영상 속 커넥트
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 aspect-video"></div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            등록된 영상이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post: IBoardPost) => (
              <Link
                key={post.id}
                href={getPostUrl(post)}
                className="group cursor-pointer block"
              >
                <div className="relative aspect-video overflow-hidden mb-6 bg-gray-200">
                  {post.thumbnail_image ? (
                    <ImageWithFallback
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold opacity-30">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-black transition-colors duration-500">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl group-hover:text-gray-600 transition-colors line-clamp-1">
                    {post.title}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-400 uppercase tracking-widest">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-16 text-center">
            <Link href={menuUrlMap[pageId] || '#'}>
              <button className="px-12 py-5 border-2 border-black text-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                View All Videos
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
