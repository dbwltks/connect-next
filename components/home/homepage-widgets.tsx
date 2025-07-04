"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// 위젯 컴포넌트 가져오기
import { MediaWidget } from "@/components/widgets/media-widget";
import { BoardlistWidget } from "@/components/widgets/boardlist-widget";
import { BoardWidget } from "@/components/widgets/board-widget";
import { BannerWidget } from "@/components/widgets/banner-widget";
import LocationWidget from "@/components/widgets/location-widget";
import MenuListWidget from "@/components/widgets/menu-list-widget";
import RecentCommentsWidget from "@/components/widgets/recent-comments-widget";
import PopularPostsWidget from "@/components/widgets/popular-posts-widget";
import LoginWidget from "@/components/widgets/login-widget";
import { StripWidget } from "@/components/widgets/strip-widget";
import { CarouselWidget } from "@/components/widgets/carousel-widget";
import { OrganizationChartWidget } from "@/components/widgets/organization-chart-widget";
import CalendarWidget from "@/components/widgets/calendar-widget";
import { IWidget } from "@/types/index";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";

type LayoutStructure = "1-col" | "2-col-left" | "2-col-right" | "3-col";

interface HomepageWidgetsProps {
  widgets?: IWidget[];
  pageId?: string;
}

// 위젯 데이터를 가져오는 fetcher 함수
async function fetchWidgets(pageId?: string): Promise<IWidget[]> {
  try {
    console.log("[fetchWidgets] 요청 시작:", {
      pageId,
      time: new Date().toISOString(),
    });

    // 매번 새로운 클라이언트 생성하여 최신 세션 보장
    const supabase = createClient();
    
    // 세션 상태 확인 (디버깅용)
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[fetchWidgets] 현재 세션 상태:", user ? "로그인됨" : "비로그인");

    let query = supabase
      .from("cms_layout")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (pageId) {
      query = query.eq("page_id", pageId);
    } else {
      query = query.is("page_id", null);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[fetchWidgets] Supabase 에러:", error);
      
      // 세션 만료 에러 확인 - 미들웨어 갱신 대기 후 재시도
      if (error.code === "PGRST301" || 
          error.message?.includes("JWT") || 
          error.message?.includes("expired") ||
          error.message?.includes("unauthorized")) {
        console.warn("[fetchWidgets] 세션 만료 감지 - 미들웨어 갱신 후 SWR 재시도 예정");
        // 인증 에러임을 표시하되 재시도 허용
        const authError = new Error(`세션 만료: 갱신 후 재시도`);
        (authError as any).isAuthError = true;
        throw authError;
      }
      
      // 일반 에러
      throw new Error(`위젯 데이터 로드 실패: ${error.message}`);
    }

    console.log("[fetchWidgets] 성공:", { count: data?.length || 0 });
    return data || [];
  } catch (err) {
    console.error("[fetchWidgets] 예외 발생:", err);
    throw err;
  }
}

export default function HomepageWidgets({
  widgets: initialWidgets,
  pageId,
}: HomepageWidgetsProps) {
  // SWR을 사용해서 위젯 데이터 관리 - 전역 설정 사용
  const {
    data: widgets,
    error,
    isLoading,
  } = useSWR(
    pageId ? ["widgets", pageId] : ["widgets"],
    () => (pageId ? fetchWidgets(pageId) : fetchWidgets()),
    {
      fallbackData: initialWidgets,
      // 전역 설정 사용
    }
  );

  const renderWidget = (widget: IWidget) => {
    if (!widget.is_active) return null;

    switch (widget.type) {
      case "media":
        return <MediaWidget widget={widget} />;
      case "banner":
        return <BannerWidget widget={widget} />;
      case "board":
        return <BoardlistWidget widget={widget} />;
      case "board-section":
        return <BoardWidget widget={widget} />;
      case "location":
        return (
          <LocationWidget id={`location-widget-${widget.id}`} widget={widget} />
        );
      case "menu-list":
        return <MenuListWidget widget={widget} />;
      case "recent-comments":
        return <RecentCommentsWidget widget={widget} />;
      case "popular-posts":
        return <PopularPostsWidget widget={widget} />;
      case "login":
        return <LoginWidget widget={widget} />;
      case "strip":
        // 컨테이너 사용 여부를 전달
        const useContainer = widget.settings?.use_full_width === false;
        return <StripWidget widget={widget} useContainer={useContainer} />;
      case "carousel":
        return <CarouselWidget widget={widget} />;
      case "organization-chart":
        return <OrganizationChartWidget widget={widget} />;
      case "calendar":
        return (
          <CalendarWidget
            widgetId={widget.id}
            settings={{
              ...widget.settings,
              title: widget.title,
            }}
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

  const getLayoutStructure = (widgets: IWidget[]): LayoutStructure => {
    const activeWidgets = widgets.filter((w) => w.is_active);
    const hasLeft = activeWidgets.some((w) => w.column_position === 0);
    const hasRight = activeWidgets.some((w) => w.column_position === 2);

    if (hasLeft && hasRight) return "3-col";
    if (hasLeft) return "2-col-left";
    if (hasRight) return "2-col-right";
    return "1-col";
  };

  const groupWidgets = () => {
    const left: IWidget[] = [];
    const main: IWidget[] = [];
    const right: IWidget[] = [];
    const strips: IWidget[] = []; // 전체 너비 스트립 위젯들

    (widgets || [])
      .filter((w) => w.is_active)
      .forEach((widget) => {
        // 스트립 위젯 중에서 전체 너비를 사용하는 것만 별도 처리
        if (
          widget.type === "strip" &&
          widget.settings?.use_full_width !== false
        ) {
          strips.push(widget);
          return;
        }

        switch (widget.column_position) {
          case 0: // Left Sidebar
            left.push(widget);
            break;
          case 2: // Right Sidebar
            right.push(widget);
            break;
          default: // Main Content (1 or null) - 컨테이너 내 스트립 포함
            main.push(widget);
            break;
        }
      });

    // 각 열 내부에서 위젯 순서 정렬
    left.sort((a, b) => a.order - b.order);
    main.sort((a, b) => a.order - b.order);
    right.sort((a, b) => a.order - b.order);
    strips.sort((a, b) => a.order - b.order); // 스트립도 순서대로 정렬

    return { left, main, right, strips };
  };

  const renderWidgetSkeleton = () => (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  const renderColumn = (widgetsToRender: IWidget[]) => (
    <div className="space-y-6">
      {error ? (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            {(error as any)?.isAuthError 
              ? "데이터를 불러오는 중입니다... (세션 갱신 중)" 
              : "위젯 데이터를 불러올 수 없습니다."}
          </p>
          {!(error as any)?.isAuthError && (
            <p className="text-xs text-yellow-600 mt-1">
              잠시 후 다시 시도됩니다.
            </p>
          )}
        </div>
      ) : isLoading ? (
        Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex flex-col">
            <div className="relative h-64 w-full flex-1 overflow-hidden rounded-xl border border-slate-100">
              {renderWidgetSkeleton()}
            </div>
          </div>
        ))
      ) : (
        widgetsToRender.map((widget) => (
          <div
            key={widget.id}
            className="flex flex-col"
            style={widget.height ? { height: `${widget.height}px` } : {}}
          >
            <div className="relative h-full w-full flex-1 overflow-hidden rounded-xl border border-slate-100">
              {renderWidget(widget)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const getWidgetWidthClass = (width: number): string => {
    switch (width) {
      case 3:
        return "col-span-12 lg:col-span-3";
      case 4:
        return "col-span-12 lg:col-span-4";
      case 6:
        return "col-span-12 lg:col-span-6";
      case 8:
        return "col-span-12 lg:col-span-8";
      case 9:
        return "col-span-12 lg:col-span-9";
      case 12:
        return "col-span-12";
      default:
        return "col-span-12";
    }
  };

  // 에러 상태 처리
  if (error) {
    return (
      <div className="2xl:container mx-auto sm:px-8 md:px-12 lg:px-16 py-8 2xl:px-0">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-500 text-center p-4">
              <h3 className="font-semibold mb-2">위젯 로드 오류</h3>
              <p className="text-sm">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!widgets || widgets.length === 0) {
    // if (isLoading) {
    //   // 로딩 중일 때 스켈레톤 표시
    //   return (
    //     <div className="xl:container mx-auto sm:px-8 md:px-12 lg:px-16 py-0 sm:py-4 xl:px-0">
    //       <div className="grid grid-cols-12 gap-6">
    //         <div className="col-span-12">
    //           <div className="grid grid-cols-12 gap-6">
    //             {Array.from({ length: 4 }).map((_, index) => (
    //               <div
    //                 key={index}
    //                 className="col-span-12 lg:col-span-6 flex flex-col"
    //               >
    //                 <div className="relative h-64 w-full flex-1 overflow-hidden">
    //                   {renderWidgetSkeleton()}
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }

    return (
      <div className="xl:container mx-auto sm:px-8 md:px-12 lg:px-16 py-8 xl:px-0">
        <Card>
          <CardContent className="pt-6">
            <div className="text-gray-500 text-center p-8">
              <p>표시할 위젯이 없습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const layoutStructure = getLayoutStructure(widgets);
  const { left, main, right, strips } = groupWidgets();

  const mainContent = (
    <div className="grid grid-cols-12 gap-6">
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="col-span-12 lg:col-span-4 flex flex-col"
            >
              <div className="relative h-64 w-full flex-1 overflow-hidden">
                {renderWidgetSkeleton()}
              </div>
            </div>
          ))
        : main.map((widget) => (
            <div
              key={widget.id}
              className={`${getWidgetWidthClass(widget.width)} flex flex-col`}
              style={widget.height ? { height: `${widget.height}px` } : {}}
            >
              <div className="relative h-full w-full flex-1 overflow-hidden">
                {renderWidget(widget)}
              </div>
            </div>
          ))}
    </div>
  );

  const leftSidebar = renderColumn(left);
  const rightSidebar = renderColumn(right);

  return (
    <>
      {/* 스트립 위젯들을 컨테이너 밖에서 렌더링 */}
      {strips.map((stripWidget) => (
        <div key={stripWidget.id}>{renderWidget(stripWidget)}</div>
      ))}

      {/* 기존 메인 레이아웃 */}
      <div className="xl:container mx-auto pt-6 sm:px-8 md:px-12 lg:px-16 py-0 sm:py-6 xl:px-0">
        <div className="grid grid-cols-12 gap-6">
          {layoutStructure === "1-col" && (
            <div className="col-span-12 flex justify-center">
              <div className="w-full max-w-7xl">{mainContent}</div>
            </div>
          )}
          {layoutStructure === "2-col-left" && (
            <>
              <div className="hidden xl:block col-span-12 lg:col-span-3 w-full sticky top-24 self-start">
                {leftSidebar}
              </div>
              <div className="col-span-12 lg:col-span-9">{mainContent}</div>
            </>
          )}
          {layoutStructure === "2-col-right" && (
            <>
              <div className="col-span-12 lg:col-span-9">{mainContent}</div>
              <div className="hidden lg:block col-span-12 lg:col-span-3 sticky top-24 self-start">
                {rightSidebar}
              </div>
            </>
          )}
          {layoutStructure === "3-col" && (
            <>
              <div className="hidden xl:block col-span-2 sticky top-24 self-start">
                {leftSidebar}
              </div>
              <div className="col-span-12 xl:col-span-8">{mainContent}</div>
              <div className="hidden xl:block col-span-2 sticky top-24 self-start">
                {rightSidebar}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
