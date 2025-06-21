"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// 위젯 컴포넌트 가져오기
import { MediaWidget } from "@/components/widgets/media-widget";
import { BoardWidget } from "@/components/widgets/board-widget";
import { GalleryWidget } from "@/components/widgets/gallery-widget";
import { BannerWidget } from "@/components/widgets/banner-widget";
import LocationWidget from "@/components/widgets/location-widget";
import { IWidget } from "@/types/index";

type LayoutStructure = "1-col" | "2-col-left" | "2-col-right" | "3-col";

interface HomepageWidgetsProps {
  widgets: IWidget[];
}

export default function HomepageWidgets({ widgets }: HomepageWidgetsProps) {
  const renderWidget = (widget: IWidget) => {
    if (!widget.is_active) return null;

    switch (widget.type) {
      case "media":
        return <MediaWidget widget={widget} />;
      case "banner":
        return <BannerWidget widget={widget} />;
      case "gallery":
        return <GalleryWidget widget={widget} />;
      case "board":
        return <BoardWidget widget={widget} />;
      case "location":
        return (
          <LocationWidget id={`location-widget-${widget.id}`} widget={widget} />
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

  const layoutStructure = getLayoutStructure(widgets);

  const groupWidgets = () => {
    const left: IWidget[] = [];
    const main: IWidget[] = [];
    const right: IWidget[] = [];

    widgets
      .filter((w) => w.is_active)
      .forEach((widget) => {
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

    // 각 열 내부에서 위젯 순서 정렬
    left.sort((a, b) => a.order - b.order);
    main.sort((a, b) => a.order - b.order);
    right.sort((a, b) => a.order - b.order);

    return { left, main, right };
  };

  const { left, main, right } = groupWidgets();

  const renderColumn = (widgetsToRender: IWidget[]) => (
    <div className="space-y-6">
      {widgetsToRender.map((widget) => (
        <div
          key={widget.id}
          className="flex flex-col"
          style={widget.height ? { height: `${widget.height}px` } : {}}
        >
          <div className="relative h-full w-full flex-1 overflow-hidden rounded-xl border border-gray-100">
            {renderWidget(widget)}
          </div>
        </div>
      ))}
    </div>
  );

  const mainContent = renderColumn(main);
  const leftSidebar = renderColumn(left);
  const rightSidebar = renderColumn(right);

  return (
    <div className="2xl:container mx-auto sm:px-8 md:px-12 lg:px-16 py-8 2xl:px-0">
      <div className="grid grid-cols-12 gap-6">
        {layoutStructure === "1-col" && (
          <div className="col-span-12">{mainContent}</div>
        )}
        {layoutStructure === "2-col-left" && (
          <>
            <div className="hidden lg:block col-span-12 lg:col-span-3 w-full sticky top-24 self-start">
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
            <div className="hidden 2xl:block col-span-12 2xl:col-span-2 sticky top-24 self-start">
              {leftSidebar}
            </div>
            <div className="col-span-12 2xl:col-span-8">{mainContent}</div>
            <div className="hidden 2xl:block col-span-12 2xl:col-span-2 sticky top-24 self-start">
              {rightSidebar}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
