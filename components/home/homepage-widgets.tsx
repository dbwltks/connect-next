"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { supabase } from "@/db";

// 위젯 컴포넌트 가져오기
import { MediaWidget } from "@/components/widgets/media-widget";
import { BoardWidget } from "@/components/widgets/board-widget";
import { GalleryWidget } from "@/components/widgets/gallery-widget";
import { BannerWidget } from "@/components/widgets/banner-widget";
import LocationWidget from "@/components/widgets/location-widget";

// 위젯 타입 정의
import { IWidget } from "@/types/index";
export type Widget = IWidget;

interface HomepageWidgetsProps {
  menuItems?: any[];
  pages?: any[];
  boardPosts?: { [key: string]: any[] };
  initialWidgets?: Widget[];
}

export default function HomepageWidgets({
  menuItems = [],
  pages = [],
  boardPosts = {},
  initialWidgets,
}: HomepageWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets || []);
  const [isLoading, setIsLoading] = useState(!initialWidgets);
  const [error, setError] = useState<string | null>(null);

  // 로컬 스토리지에서 위젯 데이터 가져오기
  const getLocalWidgets = () => {
    if (typeof window === "undefined") return null;

    try {
      const cachedData = localStorage.getItem("homepage_widgets");
      if (!cachedData) return null;

      const { widgets: cachedWidgets, timestamp } = JSON.parse(cachedData);

      // 캐시 유효시간 확인 (5분)
      const isExpired = Date.now() - timestamp > 5 * 60 * 1000;

      if (isExpired) {
        return null; // 캐시 만료되었으면 null 반환
      }

      return cachedWidgets;
    } catch (err) {
      console.error("캐시된 위젯 데이터 불러오기 오류:", err);
      return null;
    }
  };

  // 로컬 스토리지에 위젯 데이터 저장
  const saveLocalWidgets = (widgetsData: Widget[]) => {
    if (typeof window === "undefined") return;

    try {
      const dataToCache = {
        widgets: widgetsData,
        timestamp: Date.now(),
      };

      localStorage.setItem("homepage_widgets", JSON.stringify(dataToCache));
    } catch (err) {
      console.error("위젯 데이터 캐싱 오류:", err);
    }
  };

  // 위젯 데이터 가져오기
  const fetchWidgets = async (skipCache = false) => {
    try {
      // 초기 데이터가 있는 경우 사용
      if (initialWidgets) {
        setWidgets(initialWidgets);
        saveLocalWidgets(initialWidgets);
        return;
      }

      // 캐시를 사용하지 않거나 캐시가 없는 경우에만 로딩 상태 표시
      if (!skipCache) {
        const cachedWidgets = getLocalWidgets();
        if (cachedWidgets) {
          setWidgets(cachedWidgets);
          setIsLoading(false);

          // 백그라운드에서 데이터 갱신 (사용자에게 로딩 표시 없이)
          fetchWidgets(true);
          return;
        }
      }

      if (!skipCache) {
        setIsLoading(true);
      }
      setError(null);

      const { data: widgetsData = [], error: widgetsError } = await supabase
        .from("cms_layout")
        .select("*")
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (widgetsError) {
        console.error("Error fetching widgets:", widgetsError);
        if (!skipCache) {
          setError("위젯 데이터를 불러오는 중 오류가 발생했습니다.");
        }
        return;
      }

      // 위젯 데이터 타입 변환
      const typedWidgets: Widget[] = (widgetsData || [])
        .filter((widget: any) => widget.is_active)
        .map((widget: any) => ({
          id: widget.id,
          type: widget.type,
          title: widget.title,
          content: widget.content,
          settings: widget.settings,
          column_position: widget.column_position || 0,
          order: widget.order || 0,
          width: widget.width || 12,
          height: widget.height,
          display_options: widget.display_options,
          is_active: widget.is_active,
        }));

      setWidgets(typedWidgets);
      saveLocalWidgets(typedWidgets);
    } catch (err) {
      console.error("위젯 데이터를 불러오는 중 오류가 발생했습니다:", err);
      if (!skipCache) {
        setError("위젯 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (!skipCache) {
        setIsLoading(false);
      }
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    fetchWidgets();
  }, [initialWidgets]);
  // 위젯 타입에 따른 렌더링
  const renderWidget = (widget: Widget) => {
    if (!widget.is_active) return null;

    const sourceId = widget.settings?.source_id;

    // 페이지 및 게시물 데이터 찾기
    const initialPage = pages.find((item) => item.id === sourceId);
    const initialPagePosts =
      initialPage && initialPage.page_type === "board"
        ? boardPosts[initialPage.id] || []
        : [];

    // 위젯 타입별 렌더링
    switch (widget.type) {
      case "media":
        return (
          <MediaWidget
            widget={widget as any}
            page={initialPage}
            posts={initialPagePosts}
          />
        );

      case "banner":
        return <BannerWidget widget={widget as any} page={initialPage} />;

      case "gallery":
        return (
          <GalleryWidget
            widget={widget as any}
            page={initialPage}
            posts={initialPagePosts}
          />
        );

      case "board":
        return (
          <BoardWidget
            widget={widget as any}
            page={initialPage}
            posts={initialPagePosts}
          />
        );

      case "location":
        return (
          <LocationWidget
            id={`location-widget-${widget.id}`}
            widget={widget as any}
            page={initialPage}
          />
        );

      default:
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded">알 수 없는 위젯</div>
            </CardContent>
          </Card>
        );
    }
  };

  // 위젯 정렬 및 그룹화
  const sortAndGroupWidgets = () => {
    // 활성화된 위젯만 필터링
    const activeWidgets = widgets.filter((widget) => widget.is_active);

    // 순서대로 정렬
    return activeWidgets.sort((a, b) => {
      // 먼저 column_position으로 정렬
      if (a.column_position !== b.column_position) {
        return a.column_position - b.column_position;
      }
      // 그 다음 order로 정렬
      return a.order - b.order;
    });
  };

  const sortedWidgets = sortAndGroupWidgets();

  // 디버깅 로그 제거

  if (isLoading) {
    return (
      <div className="sm:container px-2 mx-auto py-2">
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse text-gray-500">
            위젯 데이터를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sm:container px-4 mx-auto py-2">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">오류!</strong>
          <span className="block sm:inline ml-1">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:container px-4 mx-auto py-2">
      <div className="grid grid-cols-12 gap-4 space-y-6">
        {sortedWidgets.map((widget) => {
          // 위젯 너비에 따라 그리드 컬럼 수 결정 (모바일에서는 한 줄에 하나씩)
          let colSpan;
          switch (widget.width) {
            case 3:
              colSpan = "col-span-12 sm:col-span-6 md:col-span-3";
              break; // 25% (모바일: 100%, 태블릿: 50%, 일반: 25%)
            case 4:
              colSpan = "col-span-12 sm:col-span-6 md:col-span-4";
              break; // 33% (모바일: 100%, 태블릿: 50%, 일반: 33%)
            case 6:
              colSpan = "col-span-12 md:col-span-6";
              break; // 50% (모바일: 100%, 일반: 50%)
            case 8:
              colSpan = "col-span-12 md:col-span-8";
              break; // 66% (모바일: 100%, 일반: 66%)
            case 9:
              colSpan = "col-span-12 md:col-span-9";
              break; // 75% (모바일: 100%, 일반: 75%)
            case 12:
              colSpan = "col-span-12";
              break; // 100% (모든 화면에서 100%)
            default:
              colSpan = "col-span-12"; // 기본값
          }

          return (
            <div
              key={widget.id}
              className={`${colSpan}`}
              style={widget.height ? { height: `${widget.height}px` } : {}}
            >
              <div className="h-full w-full overflow-hidden">
                {renderWidget(widget)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
