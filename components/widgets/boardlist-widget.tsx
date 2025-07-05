import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IBoardPost, IPage, IWidget, IBoardWidgetOptions } from "@/types/index";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Calendar,
  MessageSquare,
  Clock,
  Eye,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/utils/utils";

interface BoardWidgetProps {
  widget: IWidget & {
    display_options?: IBoardWidgetOptions;
  };
  page?: IPage;
}

// 게시판 템플릿 타입 정의
type BoardTemplate = number;

// 템플릿 번호 정의
export const BOARD_TEMPLATE = {
  CLASSIC: 1,
  COMPACT: 2,
  CARD: 3,
  NOTICE: 4,
  GALLERY: 5,
};

// 템플릿별 기능 및 스타일 설명
const templateInfo = {
  [BOARD_TEMPLATE.CLASSIC]: {
    name: "클래식",
    description: "썸네일과 제목, 요약, 날짜를 모두 표시하는 기본 스타일",
  },
  [BOARD_TEMPLATE.COMPACT]: {
    name: "컴팩트",
    description: "좁은 공간에 최적화된 간결한 목록형 스타일",
  },
  [BOARD_TEMPLATE.CARD]: {
    name: "카드형",
    description: "각 게시물을 카드 형태로 표시하는 그리드 스타일",
  },
  [BOARD_TEMPLATE.NOTICE]: {
    name: "공지형",
    description: "공지사항 형태의 실선과 NEW 표시가 강조된 스타일",
  },
  [BOARD_TEMPLATE.GALLERY]: {
    name: "갤러리형",
    description: "썸네일만 큼직하게 보여주는 갤러리 스타일",
  },
};

// 게시판 위젯 데이터를 가져오는 fetcher 함수
async function fetchBoardWidgetPosts(
  pageId: string,
  limit: number = 10
): Promise<{ posts: IBoardPost[]; menuUrlMap: Record<string, string> }> {
  console.log(`🔍 Fetching board widget posts for pageId: ${pageId}, limit: ${limit}`);
  
  const supabase = createClient();
  
  // 세션 상태 확인
  const { data: session } = await supabase.auth.getSession();
  console.log(`🔑 Current session:`, session.session ? 'authenticated' : 'not authenticated');
  
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("page_id", pageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`❌ Error fetching board posts:`, error);
    throw error;
  }

  console.log(`✅ Fetched ${data?.length || 0} posts for pageId: ${pageId}`);

  const posts = (data as IBoardPost[]) || [];

  // 클라이언트에서 published_at 우선 정렬
  const sortedPosts = [...posts].sort((a, b) => {
    // 날짜 정렬: published_at 우선, 없으면 created_at
    const aDate = new Date(a.published_at || a.created_at);
    const bDate = new Date(b.published_at || b.created_at);
    const timeDiff = bDate.getTime() - aDate.getTime();

    // 날짜가 같으면 ID로 정렬
    if (timeDiff === 0) {
      return a.id.localeCompare(b.id);
    }

    return timeDiff;
  });

  // 메뉴 URL 매핑 생성
  const uniquePageIds = Array.from(
    new Set(posts.map((post) => post.page_id).filter(Boolean))
  );
  const menuUrlMap: Record<string, string> = {};

  for (const pId of uniquePageIds) {
    if (pId) {
      const { data: menuData, error: menuError } = await supabase
        .from("cms_menus")
        .select("*")
        .eq("page_id", pId);

      if (!menuError && menuData && menuData.length > 0) {
        menuUrlMap[pId] = (menuData[0] as any).url;
      }
    }
  }

  return { posts: sortedPosts, menuUrlMap };
}

export function BoardlistWidget({ widget, page }: BoardWidgetProps) {
  const [posts, setPosts] = useState<IBoardPost[]>([]);
  const [menuUrlMap, setMenuUrlMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 페이지 ID와 표시할 게시물 수 계산
  const pageId = page?.id || widget.display_options?.page_id;
  let limit = 10; // 기본값

  if (widget.display_options?.item_count) {
    if (typeof widget.display_options.item_count === "string") {
      limit = parseInt(widget.display_options.item_count, 10) || 10;
    } else {
      limit = widget.display_options.item_count;
    }
  }

  // 데이터 로딩 함수
  const loadBoardData = useCallback(async () => {
    if (!pageId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBoardWidgetPosts(pageId, limit);
      setPosts(data.posts);
      setMenuUrlMap(data.menuUrlMap);
    } catch (err) {
      console.error('Failed to load board data:', err);
      setError(err as Error);
      setPosts([]);
      setMenuUrlMap({});
    } finally {
      setIsLoading(false);
    }
  }, [pageId, limit]);

  // 컴포넌트 마운트 시와 pageId, limit 변경 시 데이터 로딩
  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // 템플릿 번호 가져오기 (문자열 또는 숫자 처리)
  const getTemplateNumber = (template: string | number | undefined): number => {
    if (template === undefined) return BOARD_TEMPLATE.CLASSIC;
    if (typeof template === "number") return template;

    // 이전 문자열 값 변환
    switch (template) {
      case "classic":
        return BOARD_TEMPLATE.CLASSIC;
      case "compact":
        return BOARD_TEMPLATE.COMPACT;
      case "card":
        return BOARD_TEMPLATE.CARD;
      case "notice":
        return BOARD_TEMPLATE.NOTICE;
      default:
        return BOARD_TEMPLATE.CLASSIC;
    }
  };

  // 표시 옵션 정의
  const templateNumber = getTemplateNumber(widget.display_options?.layout_type);
  const showThumbnail = widget.display_options?.show_thumbnail ?? true;
  const showDate = widget.display_options?.show_date ?? true;
  const showExcerpt = widget.display_options?.show_excerpt ?? true;

  // 로딩 상태 스켈레톤 렌더링
  const renderSkeleton = () => {
    const skeletonCount = Math.min(limit, 5); // 최대 5개 스켈레톤

    switch (templateNumber) {
      case BOARD_TEMPLATE.COMPACT:
        return (
          <div className="space-y-2">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        );

      case BOARD_TEMPLATE.CARD:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: Math.min(skeletonCount, 3) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-lg overflow-hidden"
                >
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              )
            )}
          </div>
        );

      case BOARD_TEMPLATE.GALLERY:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: Math.min(skeletonCount, 4) }).map(
              (_, index) => (
                <Skeleton key={index} className="w-full h-32 sm:h-40 rounded" />
              )
            )}
          </div>
        );

      case BOARD_TEMPLATE.NOTICE:
        return (
          <div className="space-y-4">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <Skeleton className="h-4 w-3/4 mb-2" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        );

      default: // CLASSIC
        return (
          <div className="space-y-4">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div key={index} className="flex items-start space-x-4">
                {showThumbnail && <Skeleton className="w-20 h-20 rounded" />}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  {showExcerpt && <Skeleton className="h-3 w-full" />}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  // 템플릿별 렌더링 함수
  const renderByTemplate = () => {
    if (isLoading) {
      return renderSkeleton();
    }

    if (error) {
      return (
        <div className="py-8 text-center">
          <div className="text-red-500 text-sm font-medium mb-1">
            데이터 로드 오류
          </div>
          <div className="text-gray-500 text-xs">{error.message}</div>
        </div>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500 text-sm">
          등록된 게시물이 없습니다.
        </div>
      );
    }

    // 게시글별 메뉴 URL 매핑을 함수로 처리 - 쿼리스트링 방식으로 변경
    const getPostUrl = (post: IBoardPost) => {
      const menuUrl = post.page_id ? menuUrlMap[post.page_id] : null;
      return menuUrl ? `${menuUrl}?post=${post.id}` : `/?post=${post.id}`;
    };

    switch (templateNumber) {
      case BOARD_TEMPLATE.COMPACT:
        return (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="cursor-pointer last:border-b-0 widget-scale"
              >
                <div className="flex items-center justify-between">
                  <Link href={getPostUrl(post)} className="flex-1 min-w-0">
                    <div className="text-xs text-gray-700 truncate">
                      {post.title}
                    </div>
                  </Link>
                  {showDate && (
                    <div className="block text-xs text-gray-400 flex items-center space-x-1 ml-1 flex-shrink-0">
                      <span className="truncate max-w-[80px]">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case BOARD_TEMPLATE.CARD:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="cursor-pointer overflow-hidden border-gray-100 widget-scale border rounded-lg hover:shadow-md"
              >
                {showThumbnail && post.thumbnail_image ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="text-gray-300" size={32} />
                  </div>
                )}
                <div className="p-3">
                  <Link href={getPostUrl(post)} className="">
                    <h4 className="font-medium truncate">{post.title}</h4>
                  </Link>
                  {showDate && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                      <span className="truncate">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case BOARD_TEMPLATE.GALLERY:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded overflow-hidden border-gray-50 border widget-scale"
              >
                <Link href={getPostUrl(post)}>
                  {showThumbnail && post.thumbnail_image ? (
                    <img
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-32 sm:h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 sm:h-40 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-300 text-xs">No Image</span>
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        );

      case BOARD_TEMPLATE.NOTICE:
        // 오늘 날짜 가져오기
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 0시 0분 0초로 설정

        return (
          <div className="space-y-4">
            {posts.map((post) => {
              // 게시물 작성일이 오늘이면 NEW 표시
              const postDate = new Date(post.created_at);
              postDate.setHours(0, 0, 0, 0);
              const isNew = postDate.getTime() === today.getTime();

              return (
                <div
                  key={post.id}
                  className="cursor-pointer flex items-center widget-scale justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Link href={getPostUrl(post)} className="block ">
                        <h4 className="font-medium truncate flex-1">
                          {post.title}
                        </h4>
                      </Link>
                      {isNew && (
                        <Badge className="bg-red-100 text-red-800 text-xs animate-pulse flex-shrink-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 overflow-hidden">
                      <span className="truncate max-w-[80px]">
                        {post.author}
                      </span>
                      <span className="truncate max-w-[90px]">
                        {formatRelativeTime(post.created_at)}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Eye className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{post.views || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        );

      // 기본 클래식 템플릿
      default:
        return (
          <div className="space-y-5 py-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="cursor-pointer flex items-start space-x-4 widget-scale"
              >
                {showThumbnail && post.thumbnail_image ? (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={post.thumbnail_image}
                      alt={post.title}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ) : showThumbnail ? (
                  <div className="w-20 h-20 flex-shrink-0 rounded bg-gray-100 flex items-center justify-center">
                    <MessageSquare className="text-gray-300" size={24} />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <Link href={getPostUrl(post)} className="block">
                    <h4 className="text-sm font-medium truncate">
                      {post.title}
                    </h4>
                  </Link>
                  {showExcerpt && (
                    <p className="text-sm text-gray-600 truncate">
                      {post.content
                        ?.replace(/<[^>]*>/g, "")
                        .substring(0, 120) || ""}
                    </p>
                  )}
                  {showDate && (
                    <div className="text-xs text-gray-500 mt-1 mb-2 flex items-center space-x-1">
                      <span className="truncate">
                        {formatRelativeTime(post.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  // 페이지 ID가 없으면 설정 필요 메시지 표시
  if (!pageId) {
    return (
      <div className="h-full bg-white rounded-xl border border-gray-100 p-4">
        <div className="pb-2">
          <div className="text-base font-semibold">
            {widget.title || "게시판"}
          </div>
        </div>
        <div className="py-8 text-center text-gray-500 text-sm">
          게시판 페이지를 설정해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-xl border border-slate-100 overflow-hidden p-4">
      <div className="pb-2">
        <div className="text-base font-semibold">
          {widget.title || page?.title || "게시판"}
        </div>
      </div>
      <div>{renderByTemplate()}</div>
    </div>
  );
}
