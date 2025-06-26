"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IWidget } from "@/types";
import useSWR from "swr";
import { supabase } from "@/db";

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
  title?: string;
  description?: string;
  link_url?: string;
}

// 캐러셀 데이터 페처
const fetchCarouselData = async (widget: IWidget): Promise<CarouselItem[]> => {
  const dataSource = widget.settings?.data_source || "sample";

  // 직접 관리하는 이미지들 사용
  if (dataSource === "custom" && widget.settings?.custom_images) {
    return widget.settings.custom_images.map((img: any, index: number) => ({
      id: `custom-${index}`,
      image_url: img.image_url,
      title: img.title || "",
      description: img.description || "",
      link_url: img.link_url || "#",
    }));
  }

  // 페이지 콘텐츠 사용
  if (dataSource === "page" && widget.display_options?.page_id) {
    try {
      const { data, error } = await supabase
        .from("cms_posts")
        .select("id, title, content, thumbnail_url, created_at")
        .eq("page_id", widget.display_options.page_id)
        .not("thumbnail_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((post) => ({
        id: post.id,
        image_url:
          post.thumbnail_url ||
          "https://via.placeholder.com/800x400/6B7280/ffffff?text=이미지+없음",
        title: post.title,
        description: post.content?.substring(0, 100) + "...",
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
      title: "첫 번째 슬라이드",
      description: "캐러셀의 첫 번째 이미지입니다.",
      link_url: "#",
    },
    {
      id: "2",
      image_url:
        "https://via.placeholder.com/800x400/7C3AED/ffffff?text=슬라이드+2",
      title: "두 번째 슬라이드",
      description: "캐러셀의 두 번째 이미지입니다.",
      link_url: "#",
    },
    {
      id: "3",
      image_url:
        "https://via.placeholder.com/800x400/DC2626/ffffff?text=슬라이드+3",
      title: "세 번째 슬라이드",
      description: "캐러셀의 세 번째 이미지입니다.",
      link_url: "#",
    },
  ];
};

export function CarouselWidget({ widget }: CarouselWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselType = widget.settings?.carousel_type || CAROUSEL_TYPES.BASIC;
  const autoPlay = widget.settings?.auto_play ?? true;
  const autoPlayInterval = widget.settings?.auto_play_interval || 3000;
  const showDots = widget.settings?.show_dots ?? true;
  const showArrows = widget.settings?.show_arrows ?? true;
  const showTitle = widget.settings?.show_title ?? true;
  const transparentBackground =
    widget.settings?.transparent_background ?? false;

  const {
    data: carouselItems = [],
    error,
    isLoading,
  } = useSWR(
    `carousel-${widget.id}-${widget.settings?.data_source}-${widget.display_options?.page_id}-${JSON.stringify(widget.settings?.custom_images)}`,
    () => fetchCarouselData(widget),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

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
      <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-400">캐러셀 로딩 중...</div>
      </div>
    );
  }

  if (error || carouselItems.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">캐러셀 데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  // 기본 슬라이드형
  if (carouselType === CAROUSEL_TYPES.BASIC) {
    // 제목 유무에 따른 높이 계산 (전체 높이에서 제목 영역 제외)
    const imageHeight = showTitle && widget.title ? "h-64" : "h-80";

    return (
      <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-sm">
        {showTitle && widget.title && (
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">{widget.title}</h3>
          </div>
        )}

        <div className={`relative ${imageHeight} overflow-hidden`}>
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselItems.map((item, index) => (
              <div
                key={item.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                <img
                  src={item.image_url}
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
                {(item.title || item.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    {item.title && (
                      <h4 className="text-white font-semibold mb-1">
                        {item.title}
                      </h4>
                    )}
                    {item.description && (
                      <p className="text-white/90 text-sm">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 화살표 버튼 */}
          {showArrows && carouselItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* 도트 인디케이터 - 이미지 위에 오버레이 */}
          {showDots && carouselItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
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

        <div className={`relative ${imageHeight} overflow-hidden`}>
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselItems.map((item, index) => (
              <div
                key={item.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                <img
                  src={item.image_url}
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
                {(item.title || item.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    {item.title && (
                      <h4 className="text-white font-semibold mb-2 text-xl">
                        {item.title}
                      </h4>
                    )}
                    {item.description && (
                      <p className="text-white/90 text-base">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 화살표 버튼 */}
          {showArrows && carouselItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* 도트 인디케이터 - 이미지 위에 오버레이 */}
          {showDots && carouselItems.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
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
          transparentBackground ? "bg-transparent" : "bg-white shadow-sm"
        }`}
      >
        {showTitle && widget.title && (
          <div className={`p-4 ${transparentBackground ? "" : "border-b"}`}>
            <h3 className="text-lg font-semibold">{widget.title}</h3>
          </div>
        )}

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentIndex * 320}px)` }}
            >
              {carouselItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`w-80 flex-shrink-0 rounded-lg overflow-hidden transition-shadow ${
                    transparentBackground
                      ? "bg-transparent"
                      : "bg-white shadow-md"
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
                      src={item.image_url}
                      alt={item.title || `갤러리 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {(item.title || item.description) && (
                    <div
                      className={`p-4 ${
                        transparentBackground
                          ? "bg-black/50 text-white"
                          : "bg-white text-gray-900"
                      }`}
                    >
                      {item.title && (
                        <h4 className="font-semibold mb-2 line-clamp-1">
                          {item.title}
                        </h4>
                      )}
                      {item.description && (
                        <p
                          className={`text-sm line-clamp-2 ${
                            transparentBackground
                              ? "text-white/90"
                              : "text-gray-600"
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

          {/* 화살표 버튼 */}
          {showArrows && carouselItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToPrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
                onClick={goToNext}
                disabled={currentIndex >= carouselItems.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* 도트 인디케이터 */}
        {showDots && carouselItems.length > 1 && (
          <div className="flex justify-center space-x-2 p-4">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-blue-600" : "bg-gray-300"
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
