"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// 위젯 컴포넌트 가져오기
import { MediaWidget } from "@/components/widgets/media-widget";
import { BoardWidget } from "@/components/widgets/board-widget";
import { GalleryWidget } from "@/components/widgets/gallery-widget";
import { BannerWidget } from "@/components/widgets/banner-widget";

// 위젯 타입 정의
import { IWidget } from "@/types/index";
export type Widget = IWidget;

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
            isPreview={false}
          />
        );

      case "banner":
        return (
          <BannerWidget
            widget={widget as any}
            page={initialPage}
            isPreview={false}
          />
        );

      case "gallery":
        return (
          <GalleryWidget
            widget={widget as any}
            page={initialPage}
            posts={initialPagePosts}
            isPreview={false}
          />
        );

      case "board":
        return (
          <BoardWidget
            widget={widget as any}
            page={initialPage}
            posts={initialPagePosts}
            isPreview={false}
          />
        );

      case "menu":
        const menuItem = menuItems.find((item) => item.id === sourceId);
        return (
          <div className="h-full">
            <div>
              <CardTitle>{widget.title}</CardTitle>
            </div>
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
          </div>
        );

      case "page":
        // 위에서 이미 변수가 선언되었으므로 참조하여 사용
        const currentPage = pages.find((item) => item.id === sourceId);
        const currentPagePosts =
          currentPage && currentPage.page_type === "board"
            ? boardPosts[currentPage.id] || []
            : [];

        // 디스플레이 옵션 가져오기
        const displayOptions = widget.display_options || {};

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

        // 디버깅 로그 제거

        // 게시판 형식의 페이지인 경우
        if (currentPage?.page_type === "board") {
          return (
            <div className="h-full overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{widget.title || currentPage.title}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                {currentPagePosts.length > 0 ? (
                  layoutType === "list" ? (
                    // 리스트형 레이아웃
                    <div className="divide-y">
                      {currentPagePosts
                        .slice(0, itemCount)
                        .map((post, index) => (
                          <div
                            key={post.id}
                            className="py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm truncate">
                                <Link
                                  href={`${currentPage ? currentPage.slug : ""}/${post.id}`}
                                  className="hover:text-blue-600"
                                >
                                  {post.title}
                                </Link>
                              </h4>
                              {/* 디버깅 로그 제거 */}

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
                      {currentPagePosts
                        .slice(0, itemCount)
                        .map((post, index) => (
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
                                  href={`${currentPage ? currentPage.slug : ""}/${post.id}`}
                                  className="hover:text-blue-600"
                                >
                                  {post.title}
                                </Link>
                              </h4>
                              {showDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    post.created_at
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    // 카드형 레이아웃
                    <div className="space-y-3">
                      {currentPagePosts
                        .slice(0, itemCount)
                        .map((post, index) => (
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
                                  href={`${currentPage ? currentPage.slug : ""}/${post.id}`}
                                  className="hover:text-blue-600"
                                >
                                  {post.title}
                                </Link>
                              </h4>
                              {showDate && (
                                <div className="text-xs text-gray-500 mt-1 mb-2">
                                  {new Date(
                                    post.created_at
                                  ).toLocaleDateString()}
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
                    href={
                      currentPage && currentPage.slug ? currentPage.slug : "/"
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    더보기
                  </Link>
                </div>
              </CardContent>
            </div>
          );
        }

        // 일반 페이지인 경우
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{widget.title || currentPage?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-3">
                {currentPage?.description || "페이지 내용이 표시됩니다."}
              </p>
              <div className="mt-3">
                <Link
                  href={currentPage?.slug || "/"}
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

  // 디버깅 로그 제거

  return (
    <div className="sm:container px-2 mx-auto py-2">
      <div className="grid grid-cols-12 gap-4">
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
