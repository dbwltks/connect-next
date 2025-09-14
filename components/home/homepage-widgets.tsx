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
import SimpleCalendarWidget from "@/components/widgets/simple-calendar-widget";
import ProgramsWidget from "@/components/widgets/programs-widget";
import { ContainerWidget } from "@/components/widgets/container-widget";
import { IWidget } from "@/types/index";
import React from "react";
import useSWR from "swr";

type LayoutStructure = "1-col" | "2-col-left" | "2-col-right" | "3-col";

interface HomepageWidgetsProps {
  widgets?: IWidget[];
  pageId?: string;
  page?: { slug?: string; url?: string };
  menuId?: string | null;
}

import { api } from "@/lib/api";

// API를 통한 위젯 데이터 fetcher 함수
async function fetchWidgets(
  pageId?: string,
  retryCount = 0
): Promise<IWidget[]> {
  const maxRetries = 3;

  try {
    const result = await api.widgets.getAll(pageId);
    return result.data || [];
  } catch (error) {
    console.error(`Widget fetch attempt ${retryCount + 1} failed:`, error);

    if (retryCount < maxRetries) {
      // 지수 백오프: 1초, 2초, 4초
      const delay = 1000 * Math.pow(2, retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWidgets(pageId, retryCount + 1);
    }

    console.error("All retry attempts failed, returning empty array");
    return [];
  }
}

export default function HomepageWidgets({
  widgets: initialWidgets,
  pageId,
  menuId,
}: HomepageWidgetsProps) {
  // SWR을 사용한 위젯 데이터 관리
  const {
    data: widgets,
    error,
    isLoading,
  } = useSWR(["widgets", pageId], () => fetchWidgets(pageId), {
    fallbackData: initialWidgets || [], // 초기 데이터를 fallback으로 사용
    // 전역 설정 사용
  });

  const renderWidgetContent = (widget: IWidget) => {
    console.log("🔍 Rendering widget:", {
      type: widget.type,
      id: widget.id,
      is_active: widget.is_active,
    });

    if (!widget.is_active) {
      console.log("❌ Widget is inactive, not rendering");
      return null;
    }

    switch (widget.type) {
      case "media":
        return <MediaWidget widget={widget} />;
      case "banner":
        return <BannerWidget widget={widget} banners={[]} menuId={menuId} />;
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
      case "simple-calendar":
        return <SimpleCalendarWidget widget={widget} />;
      case "programs":
        return <ProgramsWidget programs={[]} widget={widget} />;
      case "container":
        // 컨테이너 안의 위젯들 찾기
        const containerWidgets = widgets
          .filter((w) => w.parent_id === widget.id && w.is_active)
          .sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));

        return (
          <ContainerWidget
            widget={widget}
            containerSettings={widget.settings}
            widgets={containerWidgets}
          >
            {containerWidgets.map((containerWidget) => (
              <div
                key={containerWidget.id}
                className="relative h-full overflow-hidden"
              >
                {renderWidgetContent(containerWidget)}
              </div>
            ))}
          </ContainerWidget>
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

  const renderWidget = (widget: IWidget, layoutStructure?: LayoutStructure) => {
    const widgetContent = renderWidgetContent(widget);

    // 1-col 레이아웃에서만 전체폭 배경 적용 (기본)
    const canUseFullWidth = layoutStructure === "1-col";

    if (canUseFullWidth) {
      return (
        <div
          className="w-full"
          style={{
            backgroundColor: widget.settings?.background_color || "transparent",
            ...(widget.height ? { height: `${widget.height}px` } : {}),
          }}
        >
          <div className="container mx-auto px-4 py-0 lg:py-6">
            <div className="w-full max-w-6xl mx-auto">{widgetContent}</div>
          </div>
        </div>
      );
    }

    return widgetContent;
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

    (widgets || [])
      .filter((w) => w.is_active)
      .forEach((widget) => {
        // 컨테이너 안에 속한 위젯들은 제외 (parent_id가 있는 위젯들)
        if (widget.parent_id) {
          return;
        }

        switch (widget.column_position) {
          case 0: // Left Sidebar
            left.push(widget);
            break;
          case 2: // Right Sidebar
            right.push(widget);
            break;
          default: // Main Content (1 or null)
            main.push(widget);
            break;
        }
      });

    // 각 열 내부에서 위젯 순서 정렬 (order_in_parent 사용)
    left.sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));
    main.sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));
    right.sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));

    return { left, main, right };
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

  const renderColumn = (
    widgetsToRender: IWidget[],
    layoutStructure: LayoutStructure
  ) => (
    <div className="space-y-6">
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">
            위젯 데이터를 불러올 수 없습니다.
          </p>
          <p className="text-xs text-red-600 mt-1">잠시 후 다시 시도됩니다.</p>
        </div>
      ) : isLoading && (!widgets || widgets.length === 0) ? (
        Array.from({ length: 2 }).map((_, index: any) => (
          <div key={index} className="flex flex-col">
            <div className="relative h-64 w-full flex-1 overflow-hidden">
              {renderWidgetSkeleton()}
            </div>
          </div>
        ))
      ) : (
        widgetsToRender.map((widget: any) => (
          <div
            key={widget.id}
            className="flex flex-col"
            style={widget.height ? { height: `${widget.height}px` } : {}}
          >
            <div className="relative h-full w-full flex-1 overflow-hidden">
              {renderWidget(widget, layoutStructure)}
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
    //             {Array.from({ length: 4 }).map((_, index: any) => (
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
  const { left, main, right } = groupWidgets();

  const mainContent = (
    <div className="grid grid-cols-12 gap-4 w-full">
      {isLoading && (!widgets || widgets.length === 0)
        ? Array.from({ length: 3 }).map((_, index: any) => (
            <div
              key={index}
              className="col-span-12 lg:col-span-4 flex flex-col"
            >
              <div className="relative h-64 w-full flex-1 overflow-hidden">
                {renderWidgetSkeleton()}
              </div>
            </div>
          ))
        : main.map((widget: any) => (
            <div
              key={widget.id}
              className={`${getWidgetWidthClass(widget.width)} flex flex-col`}
              style={widget.height ? { height: `${widget.height}px` } : {}}
            >
              <div
                className={`relative h-full overflow-hidden ${widget.type === "container" ? "" : "w-full flex-1"}`}
              >
                {renderWidget(widget, layoutStructure)}
              </div>
            </div>
          ))}
    </div>
  );

  const leftSidebar = renderColumn(left, layoutStructure);
  const rightSidebar = renderColumn(right, layoutStructure);

  return (
    <>
      <div className="w-full">
        {layoutStructure === "1-col" && (
          <div className="space-y-6">
            {main.map((widget: any) => (
              <div key={widget.id}>{renderWidget(widget, layoutStructure)}</div>
            ))}
          </div>
        )}
        {(layoutStructure === "2-col-left" ||
          layoutStructure === "2-col-right" ||
          layoutStructure === "3-col") && (
          <div className="container mx-auto lg:px-4 py-0 px-0 lg:py-6">
            <div className="grid grid-cols-12 gap-4 w-full">
              {layoutStructure === "2-col-left" && (
                <>
                  <div className="hidden xl:block col-span-12 lg:col-span-3 w-full sticky top-24 self-start">
                    {leftSidebar}
                  </div>
                  <div className="col-span-12 lg:col-span-9">
                    <div className="w-full max-w-6xl xl:max-w-none mx-auto xl:mx-0">
                      {mainContent}
                    </div>
                  </div>
                </>
              )}
              {layoutStructure === "2-col-right" && (
                <>
                  <div className="col-span-12 lg:col-span-9">
                    <div className="w-full max-w-6xl lg:max-w-none mx-auto lg:mx-0">
                      {mainContent}
                    </div>
                  </div>
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
                  <div className="col-span-12 xl:col-span-8">
                    <div className="w-full max-w-6xl xl:max-w-none mx-auto xl:mx-0">
                      {mainContent}
                    </div>
                  </div>
                  <div className="hidden xl:block col-span-2 sticky top-24 self-start">
                    {rightSidebar}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
