"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IWidget } from "@/types";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";

// 캐러셀 타입 정의
export const CAROUSEL_TYPES = {
  BASIC: "basic", // 기본 슬라이드형
  GALLERY: "gallery", // 갤러리 카드형
  FULLSCREEN: "fullscreen", // 풀스크린 모드
} as const;

interface CarouselWidgetProps {
  widget: IWidget;
}

interface CarouselItem {
  id: string;
  image_url: string;
  mobile_image_url?: string; // 모바일 전용 이미지 URL
  title?: string;
  description?: string;
  link_url?: string;
}

// 캐러셀 데이터 페처
const fetchCarouselData = async (widget: IWidget): Promise<CarouselItem[]> => {
  const dataSource = widget.settings?.data_source || "sample";

  // 직접 관리하는 이미지들 사용
  if (dataSource === "custom") {
    const desktopImages = widget.settings?.desktop_images || [];
    const mobileImages = widget.settings?.mobile_images || [];

    // 새로운 구조 사용: 데스크톱과 모바일 배열을 합쳐서 반환
    const allItems: CarouselItem[] = [];

    // 데스크톱 이미지들 추가
    desktopImages.forEach((img: any, index: number) => {
      allItems.push({
        id: `desktop-${index}`,
        image_url: img.image_url,
        mobile_image_url: "",
        title: img.title || "",
        description: img.description || "",
        link_url: img.link_url || "#",
      });
    });

    // 모바일 이미지들 추가
    mobileImages.forEach((img: any, index: number) => {
      allItems.push({
        id: `mobile-${index}`,
        image_url: "",
        mobile_image_url: img.image_url,
        title: img.title || "",
        description: img.description || "",
        link_url: img.link_url || "#",
      });
    });

    return allItems;
  }

  // 페이지 콘텐츠 사용
  if (dataSource === "page" && widget.display_options?.page_id) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_posts")
        .select(
          "id, title, content, thumbnail_image, created_at, status, published_at, is_pinned, is_notice"
        )
        .eq("page_id", widget.display_options.page_id)
        .eq("status", "published")
        .not("thumbnail_image", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // 클라이언트에서 published_at 우선 정렬
      const sortedPosts = [...(data || [])].sort((a: any, b: any) => {
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

      return sortedPosts.map((post: any) => ({
        id: post.id,
        image_url:
          post.thumbnail_image ||
          "https://via.placeholder.com/800x400/6B7280/ffffff?text=이미지+없음",
        mobile_image_url: "", // 페이지 데이터소스일 때는 mobile_image_url 빈값
        title: post.title,
        description: post.content
          ? post.content
              .replace(/<[^>]*>/g, "") // HTML 태그 제거
              .replace(/https?:\/\/[^\s]+/g, "") // URL 제거
              .replace(/\s+/g, " ") // 연속된 공백을 하나로
              .trim()
              .substring(0, 100) + "..."
          : "",
        link_url: `#`,
      }));
    } catch (error) {
      console.error("페이지 콘텐츠 로딩 오류:", error);
      return [];
    }
  }

  // 기본 샘플 데이터
  return [
    {
      id: "1",
      image_url:
        "https://via.placeholder.com/800x400/4F46E5/ffffff?text=슬라이드+1",
      mobile_image_url:
        "https://via.placeholder.com/400x300/4F46E5/ffffff?text=모바일+슬라이드+1",
      title: "첫 번째 슬라이드",
      description: "캐러셀의 첫 번째 이미지입니다.",
      link_url: "#",
    },
    {
      id: "2",
      image_url:
        "https://via.placeholder.com/800x400/7C3AED/ffffff?text=슬라이드+2",
      mobile_image_url:
        "https://via.placeholder.com/400x300/7C3AED/ffffff?text=모바일+슬라이드+2",
      title: "두 번째 슬라이드",
      description: "캐러셀의 두 번째 이미지입니다.",
      link_url: "#",
    },
    {
      id: "3",
      image_url:
        "https://via.placeholder.com/800x400/DC2626/ffffff?text=슬라이드+3",
      mobile_image_url:
        "https://via.placeholder.com/400x300/DC2626/ffffff?text=모바일+슬라이드+3",
      title: "세 번째 슬라이드",
      description: "캐러셀의 세 번째 이미지입니다.",
      link_url: "#",
    },
  ];
};

export function CarouselWidget({ widget }: CarouselWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md 브레이크포인트
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const carouselType = widget.settings?.carousel_type || CAROUSEL_TYPES.BASIC;
  const autoPlay = widget.settings?.auto_play ?? true;
  const autoPlayInterval = widget.settings?.auto_play_interval || 3000;
  const showDots = widget.settings?.show_dots ?? true;
  const showArrows = widget.settings?.show_arrows ?? true;
  const showTitle = widget.settings?.show_title ?? true;
  const showCardTitle = widget.settings?.show_card_title ?? true;
  const showCardDescription = widget.settings?.show_card_description ?? true;
  const transparentBackground =
    widget.settings?.transparent_background ?? false;

  // 데이터 변경을 감지하기 위한 해시 생성
  const dataHash = JSON.stringify({
    dataSource: widget.settings?.data_source,
    pageId: widget.display_options?.page_id,
    desktopImagesHash: JSON.stringify(widget.settings?.desktop_images),
    mobileImagesHash: JSON.stringify(widget.settings?.mobile_images),
  });

  const {
    data: allCarouselItems = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    `carousel-${widget.id}-${dataHash}`,
    () => fetchCarouselData(widget)
    // 전역 설정 사용
  );

  // 데스크톱/모바일에 따라 슬라이드 필터링
  const carouselItems = allCarouselItems.filter((item) => {
    // 페이지 데이터소스일 때는 모바일/데스크톱 구분 없이 모든 게시물 표시
    if (widget.settings?.data_source === "page") {
      return item.image_url && item.image_url !== "";
    }
    
    if (isMobile) {
      // 모바일: mobile_image_url이 있는 슬라이드만
      return item.mobile_image_url && item.mobile_image_url !== "";
    } else {
      // 데스크톱: image_url이 있는 슬라이드만
      return item.image_url && item.image_url !== "";
    }
  });

  // 데이터 변경 감지 및 강제 새로고침
  useEffect(() => {
    mutate();
  }, [
    widget.settings?.desktop_images,
    widget.settings?.mobile_images,
    widget.settings?.custom_images,
    mutate,
  ]);

  // 자동 재생 효과
  useEffect(() => {
    if (!autoPlay || carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, carouselItems.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">캐러셀 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    console.error("캐러셀 에러:", error);
    return (
      <div className="w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          캐러셀 데이터를 불러올 수 없습니다: {error.message}
        </div>
      </div>
    );
  }

  if (carouselItems.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          {widget.settings?.data_source === "page" 
            ? "썸네일이 있는 게시물이 없습니다." 
            : `${isMobile ? "모바일" : "데스크톱"} 캐러셀 이미지가 없습니다.`}
          <br />
          <span className="text-xs">
            전체 슬라이드: {allCarouselItems.length}개<br />
            {widget.settings?.data_source === "page" ? (
              <>페이지 게시물 수: {allCarouselItems.length}개</>
            ) : (
              <>
                데스크톱 배열: {widget.settings?.desktop_images?.length || 0}개
                <br />
                모바일 배열: {widget.settings?.mobile_images?.length || 0}개<br />
                기존 배열: {widget.settings?.custom_images?.length || 0}개
              </>
            )}
            <br />
            데이터소스: {widget.settings?.data_source}
          </span>
        </div>
      </div>
    );
  }

  // 기본 슬라이드형
  if (carouselType === CAROUSEL_TYPES.BASIC) {
    // 위젯에 설정된 높이가 있으면 사용, 없으면 기본값
    const widgetHeight = widget.height || 400;
    // 제목이 있으면 제목 높이(약 60px) 제외
    const imageHeightPx =
      showTitle && widget.title ? widgetHeight - 60 : widgetHeight;
    const imageHeightStyle = { height: `${imageHeightPx}px` };

    return (
      <div className="relative w-full bg-white dark:bg-gray-800 rounded-0 sm:rounded-lg overflow-hidden shadow-sm">
        {showTitle && widget.title && (
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{widget.title}</h3>
          </div>
        )}

        <div className="relative overflow-hidden" style={imageHeightStyle}>
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselItems.map((item, index: any) => (
              <div
                key={item.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                <img
                  src={
                    widget.settings?.data_source === "page" 
                      ? item.image_url 
                      : (item.mobile_image_url || item.image_url)
                  }
                  alt={item.title || `슬라이드 ${index + 1}`}
                  className={`w-full h-full object-cover ${
                    item.link_url && item.link_url !== "#"
                      ? "cursor-pointer hover:opacity-90"
                      : "cursor-default"
                  }`}
                  onClick={() =>
                    item.link_url &&
                    item.link_url !== "#" &&
                    window.open(item.link_url, "_blank")
                  }
                />
                {((showCardTitle && item.title) ||
                  (showCardDescription && item.description)) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    {showCardTitle && item.title && (
                      <h4 className="text-white font-semibold mb-1">
                        {item.title}
                      </h4>
                    )}
                    {showCardDescription && item.description && (
                      <p className="text-white/90 text-sm">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 화살표 버튼 - 모바일에서는 숨김 */}
          {showArrows && carouselItems.length > 1 && !isMobile && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
                onClick={goToPrev}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
                onClick={goToNext}
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}

          {/* 도트 인디케이터 - 이미지 위에 오버레이 */}
          {showDots && carouselItems.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {carouselItems.map((_, index: any) => (
                <button
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-2.5 h-2.5 bg-white/90"
                      : "w-2 h-2 bg-white/50"
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 풀스크린 모드 - 화면 전체에 기본 슬라이드형으로 표시
  if (carouselType === CAROUSEL_TYPES.FULLSCREEN) {
    // 제목 유무에 따른 높이 계산 (전체 화면에서 제목 영역 제외)
    const imageHeight =
      showTitle && widget.title ? "h-[calc(100vh-80px)]" : "h-screen";

    return (
      <div className="fixed inset-0 z-50 bg-black">
        {showTitle && widget.title && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
            <h3 className="text-lg font-semibold text-white text-center">
              {widget.title}
            </h3>
          </div>
        )}

        <div className={`relative overflow-hidden ${imageHeight}`}>
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselItems.map((item, index: any) => (
              <div
                key={item.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                <img
                  src={
                    widget.settings?.data_source === "page" 
                      ? item.image_url 
                      : (item.mobile_image_url || item.image_url)
                  }
                  alt={item.title || `슬라이드 ${index + 1}`}
                  className={`w-full h-full object-contain ${
                    item.link_url && item.link_url !== "#"
                      ? "cursor-pointer hover:opacity-90"
                      : "cursor-default"
                  }`}
                  onClick={() =>
                    item.link_url &&
                    item.link_url !== "#" &&
                    window.open(item.link_url, "_blank")
                  }
                />
                {((showCardTitle && item.title) ||
                  (showCardDescription && item.description)) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    {showCardTitle && item.title && (
                      <h4 className="text-white font-semibold mb-2 text-xl">
                        {item.title}
                      </h4>
                    )}
                    {showCardDescription && item.description && (
                      <p className="text-white/90 text-base">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 화살표 버튼 - 모바일에서는 숨김 */}
          {showArrows && carouselItems.length > 1 && !isMobile && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
                onClick={goToPrev}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
                onClick={goToNext}
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}

          {/* 도트 인디케이터 - 이미지 위에 오버레이 */}
          {showDots && carouselItems.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-1.5">
              {carouselItems.map((_, index: any) => (
                <button
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-2.5 h-2.5 bg-white/90"
                      : "w-2 h-2 bg-white/50"
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}

          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white z-10"
            onClick={() => window.history.back()}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // 갤러리 카드형
  if (carouselType === CAROUSEL_TYPES.GALLERY) {
    return (
      <div
        className={`relative w-full rounded-lg overflow-hidden ${
          transparentBackground ? "bg-transparent" : "bg-white dark:bg-gray-800 shadow-sm"
        }`}
      >
        {showTitle && widget.title && (
          <div className={`p-4 ${transparentBackground ? "" : "border-b dark:border-gray-700"}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{widget.title}</h3>
          </div>
        )}

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentIndex * 320}px)` }}
            >
              {carouselItems.map((item, index: any) => (
                <div
                  key={item.id}
                  className={`w-80 flex-shrink-0 rounded-lg overflow-hidden transition-shadow ${
                    transparentBackground
                      ? "bg-transparent"
                      : "bg-white dark:bg-gray-800 shadow-md"
                  } ${
                    item.link_url && item.link_url !== "#"
                      ? "cursor-pointer hover:shadow-lg hover:scale-105"
                      : "cursor-default"
                  }`}
                  onClick={() =>
                    item.link_url &&
                    item.link_url !== "#" &&
                    window.open(item.link_url, "_blank")
                  }
                >
                  <div className="aspect-video relative">
                    <img
                      src={
                        widget.settings?.data_source === "page" 
                          ? item.image_url 
                          : (isMobile && item.mobile_image_url
                              ? item.mobile_image_url
                              : item.image_url)
                      }
                      alt={item.title || `갤러리 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {((showCardTitle && item.title) ||
                    (showCardDescription && item.description)) && (
                    <div
                      className="p-4 text-white"
                      style={{
                        backgroundColor: transparentBackground
                          ? "#2E333E"
                          : "#2E333E",
                      }}
                    >
                      {showCardTitle && item.title && (
                        <h4 className="font-semibold mb-2 line-clamp-1">
                          {item.title}
                        </h4>
                      )}
                      {showCardDescription && item.description && (
                        <p
                          className={`text-sm line-clamp-2 ${
                            transparentBackground
                              ? "text-white/90"
                              : "text-white/90"
                          }`}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 화살표 버튼 - 모바일에서는 숨김 */}
          {showArrows && carouselItems.length > 1 && !isMobile && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none disabled:opacity-50"
                onClick={goToPrev}
                disabled={currentIndex === 0}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-1 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none disabled:opacity-50"
                onClick={goToNext}
                disabled={currentIndex >= carouselItems.length - 1}
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
        </div>

        {/* 도트 인디케이터 */}
        {showDots && carouselItems.length > 1 && (
          <div className="flex justify-center space-x-1.5 py-4">
            {carouselItems.map((_, index: any) => (
              <button
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-2.5 h-2.5 bg-blue-600 dark:bg-blue-500"
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
