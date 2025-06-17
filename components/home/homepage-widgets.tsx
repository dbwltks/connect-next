"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// 위젯 컴포넌트 가져오기
import { MediaWidget } from "@/components/widgets/media-widget";
import { BoardWidget } from "@/components/widgets/board-widget";
import { GalleryWidget } from "@/components/widgets/gallery-widget";
import { BannerWidget } from "@/components/widgets/banner-widget";
import LocationWidget from "@/components/widgets/location-widget";
import { IWidget } from "@/types/index";
export type Widget = IWidget;

interface HomepageWidgetsProps {
  widgets: Widget[];
  menuItems?: any[];
  pages?: any[];
  boardPosts?: { [key: string]: any[] };
}

export default function HomepageWidgets({
  widgets = [],
  menuItems = [],
  pages = [],
  boardPosts = {},
}: HomepageWidgetsProps) {
  const renderWidget = (widget: Widget) => {
    if (!widget.is_active) return null;
    const sourceId = widget.settings?.source_id;
    const initialPage = pages.find((item) => item.id === sourceId);
    const initialPagePosts =
      initialPage && initialPage.page_type === "board"
        ? boardPosts[initialPage.id] || []
        : [];
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

  const sortAndGroupWidgets = () => {
    const activeWidgets = widgets.filter((widget) => widget.is_active);
    return activeWidgets.sort((a, b) => {
      if (a.column_position !== b.column_position) {
        return a.column_position - b.column_position;
      }
      return a.order - b.order;
    });
  };

  const sortedWidgets = sortAndGroupWidgets();

  return (
    <div className="sm:container px-4 mx-auto py-2">
      <div className="grid grid-cols-12 gap-4 space-y-6">
        {sortedWidgets.map((widget) => {
          let colSpan;
          switch (widget.width) {
            case 3:
              colSpan = "col-span-12 sm:col-span-6 md:col-span-3";
              break;
            case 4:
              colSpan = "col-span-12 sm:col-span-6 md:col-span-4";
              break;
            case 6:
              colSpan = "col-span-12 md:col-span-6";
              break;
            case 8:
              colSpan = "col-span-12 md:col-span-8";
              break;
            case 9:
              colSpan = "col-span-12 md:col-span-9";
              break;
            case 12:
              colSpan = "col-span-12";
              break;
            default:
              colSpan = "col-span-12";
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
