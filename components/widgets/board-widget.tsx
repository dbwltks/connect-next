import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IBoardPost, IPage, IWidget, IBoardWidgetOptions } from "@/types/index";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/db";
import {
  Calendar,
  MessageSquare,
  Clock,
  Eye,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
};

export function BoardWidget({ widget, page }: BoardWidgetProps) {
  const [posts, setPosts] = useState<IBoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시 키 생성 - 위젯 ID와 페이지 ID 기반
  const getCacheKey = (widgetId: string, pageId: string) => {
    return `board_widget_${widgetId}_${pageId}`;
  };

  // 로컬 스토리지에서 게시판 데이터 가져오기
  const getLocalBoardPosts = (widgetId: string, pageId: string) => {
    if (typeof window === "undefined") return null;

    try {
      const cacheKey = getCacheKey(widgetId, pageId);
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;

      const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);

      // 캐시 유효시간 확인 (10분)
      const isExpired = Date.now() - timestamp > 10 * 60 * 1000;

      if (isExpired) {
        return null; // 캐시 만료되었으면 null 반환
      }

      return cachedPosts;
    } catch (err) {
      console.error("캐시된 게시판 데이터 불러오기 오류:", err);
      return null;
    }
  };

  // 로컬 스토리지에 게시판 데이터 저장
  const saveLocalBoardPosts = (
    widgetId: string,
    pageId: string,
    postsData: IBoardPost[]
  ) => {
    if (typeof window === "undefined") return;

    try {
      const cacheKey = getCacheKey(widgetId, pageId);
      const dataToCache = {
        posts: postsData,
        timestamp: Date.now(),
      };

      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    } catch (err) {
      console.error("게시판 데이터 캐싱 오류:", err);
    }
  };

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

  // 게시판 데이터 로드 함수 (캐시 사용 여부 지정 가능)
  const loadBoardPosts = async (pageId: string, skipCache = false) => {
    if (!pageId || !widget.id) {
      setError("페이지 ID가 없어 데이터를 로드할 수 없습니다.");
      return;
    }

    try {
      // 캐시 사용 여부 확인
      if (!skipCache) {
        const cachedPosts = getLocalBoardPosts(widget.id, pageId);
        if (cachedPosts) {
          setPosts(cachedPosts);
          // 백그라운드에서 데이터 갱신 (사용자에게 로딩 표시 없이)
          // 추가 요청은 렌더링 완료 후 한 번만 하도록 설정 (무한 루프 방지)
          const timer = setTimeout(() => loadBoardPosts(pageId, true), 500);
          return () => clearTimeout(timer); // 클린업 함수로 타이머 제거
        }
      }

      if (!skipCache) {
        setIsLoading(true);
      }
      setError(null);

      // 게시물 조회
      let query = supabase
        .from("board_posts")
        .select("*")
        .eq("page_id", pageId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      // 표시할 게시물 수 제한 (기본 10개)
      let limit = 10; // 기본값

      // item_count가 문자열인 경우 숫자로 변환 (레이아웃 관리자에서 문자열로 저장하는 경우 처리)
      if (widget.display_options?.item_count) {
        if (typeof widget.display_options.item_count === "string") {
          limit = parseInt(widget.display_options.item_count, 10) || 10;
        } else {
          limit = widget.display_options.item_count;
        }
      }

      console.log("[게시판 위젯] 표시 개수:", limit);
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error("[게시판 위젯] 데이터 조회 오류:", error);
        if (!skipCache) {
          setError("데이터를 가져오는 중 오류가 발생했습니다.");
        }
        return;
      }

      if (data && data.length > 0) {
        setPosts(data as IBoardPost[]);
        // 캐시에 데이터 저장
        saveLocalBoardPosts(widget.id, pageId, data as IBoardPost[]);
      } else {
        setPosts([]);
        // 빈 배열도 캐싱 (서버에 데이터가 없다는 사실도 캐싱 가치가 있음)
        saveLocalBoardPosts(widget.id, pageId, []);
      }
    } catch (err) {
      console.error("[게시판 위젯] 데이터 로드 오류:", err);
      if (!skipCache) {
        setError("데이터를 가져오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (!skipCache) {
        setIsLoading(false);
      }
    }
  };

  // 초기 데이터 로드 상태를 추적하는 ref
  const dataLoadedRef = useRef(false);

  // loadBoardPosts 함수를 useCallback으로 메모이제이션
  const memorizedLoadBoardPosts = useCallback(
    async (pageId: string, skipCache = false) => {
      // loadBoardPosts 내부 로직
      if (!pageId || !widget.id) {
        setError("페이지 ID가 없어 데이터를 로드할 수 없습니다.");
        return;
      }

      try {
        // 캐시 사용 여부 확인
        if (!skipCache) {
          const cachedPosts = getLocalBoardPosts(widget.id, pageId);
          if (cachedPosts) {
            setPosts(cachedPosts);
            return;
          }
        }

        if (!skipCache) {
          setIsLoading(true);
        }
        setError(null);

        // 게시물 조회
        let query = supabase
          .from("board_posts")
          .select("*")
          .eq("page_id", pageId)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        // 표시할 게시물 수 제한 (기본 10개)
        let limit = 10; // 기본값

        // item_count가 문자열인 경우 숫자로 변환
        if (widget.display_options?.item_count) {
          if (typeof widget.display_options.item_count === "string") {
            limit = parseInt(widget.display_options.item_count, 10) || 10;
          } else {
            limit = widget.display_options.item_count;
          }
        }

        console.log("[게시판 위젯] 표시 개수:", limit);
        query = query.limit(limit);

        const { data, error } = await query;

        if (error) {
          console.error("[게시판 위젯] 데이터 조회 오류:", error);
          if (!skipCache) {
            setError("데이터를 가져오는 중 오류가 발생했습니다.");
          }
          return;
        }

        if (data && data.length > 0) {
          setPosts(data as IBoardPost[]);
          // 캐시에 데이터 저장
          saveLocalBoardPosts(widget.id, pageId, data as IBoardPost[]);
        } else {
          setPosts([]);
          // 빈 배열도 캐싱
          saveLocalBoardPosts(widget.id, pageId, []);
        }
      } catch (err) {
        console.error("[게시판 위젯] 데이터 로드 오류:", err);
        if (!skipCache) {
          setError("데이터를 가져오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!skipCache) {
          setIsLoading(false);
        }
      }
    },
    [widget.id, widget.display_options?.item_count]
  );

  // 초기화 및 데이터 로드
  useEffect(() => {
    // 페이지 ID가 있으면 데이터 로드
    const pageId = page?.id || widget.display_options?.page_id;
    if (pageId && !dataLoadedRef.current) {
      memorizedLoadBoardPosts(pageId);
      dataLoadedRef.current = true;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id, widget.id, widget.display_options?.page_id]);

  // 캐시된 데이터 갱신을 위한 별도 useEffect
  useEffect(() => {
    const pageId = page?.id || widget.display_options?.page_id;

    if (pageId) {
      // 컴포넌트 마운트 후 한 번만 백그라운드 갱신 수행
      const timer = setTimeout(() => {
        memorizedLoadBoardPosts(pageId, true);
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 템플릿별 렌더링 함수
  const renderByTemplate = () => {
    // 로딩 및 에러 상태 처리
    if (isLoading) {
      return (
        <div className="py-4 text-center text-gray-500">
          게시물을 불러오는 중...
        </div>
      );
    }

    if (error) {
      return <div className="py-4 text-center text-gray-500">{error}</div>;
    }

    if (posts.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          등록된 게시물이 없습니다.
        </div>
      );
    }

    switch (templateNumber) {
      case BOARD_TEMPLATE.COMPACT:
        return (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="py-2 border-b last:border-b-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium truncate flex-1">
                    {post.title}
                  </h4>
                  {showDate && (
                    <div className="text-xs text-gray-500 flex items-center space-x-1 ml-2 flex-shrink-0">
                      <Clock size={12} />
                      <span className="truncate max-w-[80px]">
                        {new Date(post.created_at).toLocaleDateString()}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
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
                  <h4 className="font-medium truncate">{post.title}</h4>
                  {showDate && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                      <Calendar size={12} />
                      <span className="truncate">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
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
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <h4 className="font-medium group-hover:text-blue-600 transition-colors truncate flex-1">
                        {post.title}
                      </h4>
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
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Eye className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{post.views || 0}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>
              );
            })}
          </div>
        );

      // 기본 클래식 템플릿
      default:
        return (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start space-x-4 border-b"
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
                  <h4 className="text-sm font-medium truncate">{post.title}</h4>
                  {showDate && (
                    <div className="text-xs text-gray-500 mt-1 mb-2 flex items-center space-x-1">
                      <Calendar size={12} className="flex-shrink-0" />
                      <span className="truncate">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {showExcerpt && (
                    <p className="text-sm text-gray-600 truncate">
                      {post.content
                        ?.replace(/<[^>]*>/g, "")
                        .substring(0, 120) || ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-white rounded-xl border border-gray-100 p-6">
      <div className="pb-2">
        <div className="text-xl font-bold">
          {widget.title || page?.title || "게시판"}
        </div>
      </div>
      <div>
        {renderByTemplate()}
        <div className="mt-3 text-center">
          <Link
            href={page?.slug || "/"}
            className="w-full py-2 px-4 border border-gray-200 rounded-md hover:bg-blue-50 transition-colors text-sm flex items-center justify-center"
          >
            더보기
          </Link>
        </div>
      </div>
    </div>
  );
}
