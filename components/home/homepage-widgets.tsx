"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// 위젯 타입 정의
export type Widget = {
  id: string;
  type: string;
  title: string;
  content?: string;
  settings?: any;
  column_position: number;
  order: number;
  width: number; // 1-12 (12 column grid system)
  height?: number; // 위젯 높이 (px 단위)
  display_options?: {
    item_count?: number; // 표시할 아이템 개수
    show_thumbnail?: boolean; // 썸네일 표시 여부
    show_date?: boolean; // 날짜 표시 여부
    show_excerpt?: boolean; // 요약 표시 여부
    layout_type?: "list" | "grid" | "card"; // 레이아웃 타입
  };
  is_active: boolean;
};

// 위젯 너비에 따른 클래스 반환
const getWidthClass = (width: number) => {
  switch (width) {
    case 3:
      return "w-full md:w-1/4";
    case 4:
      return "w-full md:w-1/3";
    case 6:
      return "w-full md:w-1/2";
    case 8:
      return "w-full md:w-2/3";
    case 9:
      return "w-full md:w-3/4";
    case 12:
      return "w-full";
    default:
      return "w-full";
  }
};

interface HomepageWidgetsProps {
  widgets: Widget[];
  menuItems?: any[];
  pages?: any[];
  boardPosts?: { [key: string]: any[] };
}

export default function HomepageWidgets({
  widgets,
  menuItems = [],
  pages = [],
  boardPosts = {},
}: HomepageWidgetsProps) {
  // 위젯 타입에 따른 렌더링
  const renderWidget = (widget: Widget) => {
    if (!widget.is_active) return null;

    const sourceId = widget.settings?.source_id;

    switch (widget.type) {
      case "menu":
        const menuItem = menuItems.find((item) => item.id === sourceId);
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded overflow-hidden">
                <div className="bg-gray-50 p-3">
                  <ul className="space-y-2">
                    {menuItems
                      .filter((item) => item.parent_id === sourceId)
                      .slice(0, 5)
                      .map((subItem) => (
                        <li key={subItem.id}>
                          <Link
                            href={subItem.url || "#"}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "page":
        const page = pages.find((item) => item.id === sourceId);
        const pagePosts =
          page && page.page_type === "board" ? boardPosts[page.id] || [] : [];

        // 디스플레이 옵션 가져오기
        const displayOptions = widget.display_options || {};

        // 디버깅을 위한 로그 추가
        console.log(
          `Widget ${widget.id} display options:`,
          JSON.stringify(displayOptions)
        );

        // 설정된 값이 있는 경우에만 해당 값 사용, 없으면 기본값 사용
        const itemCount =
          displayOptions.item_count !== undefined
            ? displayOptions.item_count
            : 5;
        const layoutType = displayOptions.layout_type || "list";

        // 불리언 값을 문자열로 변환 후 비교
        const showThumbnail =
          String(displayOptions.show_thumbnail) === "true" ||
          displayOptions.show_thumbnail === true;
        const showDate =
          String(displayOptions.show_date) === "true" ||
          displayOptions.show_date === true;
        const showExcerpt =
          String(displayOptions.show_excerpt) === "true" ||
          displayOptions.show_excerpt === true;

        console.log(
          `Widget ${widget.id} settings - showDate: ${showDate}, showDate type: ${typeof displayOptions.show_date}, itemCount: ${itemCount}, layoutType: ${layoutType}`
        );

        // 게시판 형식의 페이지인 경우
        if (page?.page_type === "board") {
          return (
            <Card className="h-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{widget.title || page.title}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                {pagePosts.length > 0 ? (
                  layoutType === "list" ? (
                    // 리스트형 레이아웃
                    <div className="divide-y">
                      {pagePosts.slice(0, itemCount).map((post, index) => (
                        <div
                          key={post.id}
                          className="py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm truncate">
                              <Link
                                href={`${page.slug || "/"}/${post.id}`}
                                className="hover:text-blue-600"
                              >
                                {post.title}
                              </Link>
                            </h4>
                            {/* 디버깅을 위한 콘솔 로그 - 렌더링에 영향을 주지 않도록 null을 반환 */}
                            {(() => {
                              console.log(`Post ${post.id}:`, {
                                showDate,
                                created_at: post.created_at,
                                date: post.created_at
                                  ? new Date(
                                      post.created_at
                                    ).toLocaleDateString()
                                  : "No date",
                              });
                              return null;
                            })()}

                            {/* 날짜 표시 - 무조건 표시하도록 수정 */}
                            {showDate && (
                              <span className="text-xs text-gray-500 ml-2">
                                {post.created_at
                                  ? new Date(
                                      post.created_at
                                    ).toLocaleDateString()
                                  : new Date().toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {showExcerpt && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {post.content
                                ?.replace(/<[^>]*>/g, "")
                                .substring(0, 100) || ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : layoutType === "grid" ? (
                    // 그리드형 레이아웃
                    <div className="grid grid-cols-2 gap-3">
                      {pagePosts.slice(0, itemCount).map((post, index) => (
                        <div
                          key={post.id}
                          className="border rounded overflow-hidden hover:shadow-sm transition-shadow"
                        >
                          {showThumbnail && (
                            <div className="h-24 bg-gray-100 flex items-center justify-center">
                              <div className="text-gray-400 text-xs">
                                이미지
                              </div>
                            </div>
                          )}
                          <div className="p-2">
                            <h4 className="font-medium text-sm line-clamp-1">
                              <Link
                                href={`${page.slug || "/"}/${post.id}`}
                                className="hover:text-blue-600"
                              >
                                {post.title}
                              </Link>
                            </h4>
                            {showDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(post.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 카드형 레이아웃
                    <div className="space-y-3">
                      {pagePosts.slice(0, itemCount).map((post, index) => (
                        <div
                          key={post.id}
                          className="border rounded-md overflow-hidden hover:shadow-sm transition-shadow"
                        >
                          {showThumbnail && (
                            <div className="h-32 bg-gray-100 flex items-center justify-center">
                              <div className="text-gray-400 text-sm">
                                썸네일 이미지
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <h4 className="font-medium text-base">
                              <Link
                                href={`${page.slug || "/"}/${post.id}`}
                                className="hover:text-blue-600"
                              >
                                {post.title}
                              </Link>
                            </h4>
                            {showDate && (
                              <div className="text-xs text-gray-500 mt-1 mb-2">
                                {new Date(post.created_at).toLocaleDateString()}
                              </div>
                            )}
                            {showExcerpt && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {post.content
                                  ?.replace(/<[^>]*>/g, "")
                                  .substring(0, 120) || ""}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    등록된 게시물이 없습니다.
                  </div>
                )}

                <div className="mt-3 text-center">
                  <Link
                    href={page.slug || "/"}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    더보기
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        }

        // 일반 페이지인 경우
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{widget.title || page?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-3">
                {page?.description || "페이지 내용이 표시됩니다."}
              </p>
              <div className="mt-3">
                <Link
                  href={page?.slug || "/"}
                  className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  자세히 보기
                </Link>
              </div>
            </CardContent>
          </Card>
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

  // 디버깅 로그
  console.log(
    "Sorted widgets:",
    sortedWidgets.map((w) => ({
      id: w.id,
      title: w.title,
      order: w.order,
      column: w.column_position,
      width: w.width,
    }))
  );

  return (
    <div className="container mx-auto py-4">
      <div className="grid grid-cols-12 gap-4">
        {sortedWidgets.map((widget) => {
          // 위젯 너비에 따라 그리드 컬럼 수 결정
          let colSpan;
          switch (widget.width) {
            case 3:
              colSpan = "col-span-3";
              break; // 25%
            case 4:
              colSpan = "col-span-4";
              break; // 33%
            case 6:
              colSpan = "col-span-6";
              break; // 50%
            case 8:
              colSpan = "col-span-8";
              break; // 66%
            case 9:
              colSpan = "col-span-9";
              break; // 75%
            case 12:
              colSpan = "col-span-12";
              break; // 100%
            default:
              colSpan = "col-span-12"; // 기본값
          }

          return (
            <div
              key={widget.id}
              className={`${colSpan}`}
              style={widget.height ? { height: `${widget.height}px` } : {}}
            >
              <div className="h-full w-full overflow-hidden bg-white rounded-lg shadow">
                {renderWidget(widget)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
