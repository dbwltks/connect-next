"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { Banner } from "@/types/index";
import React from "react";

interface BannerBlockProps {
  banners: Banner[];
  mode?: "preview" | "live";
}

export default function BannerBlock({ banners, mode = "live" }: BannerBlockProps) {
  const HEADER_HEIGHT = 64; // px, 헤더 높이와 맞춰야 함

  // 화면 전체 높이 계산 (헤더 높이 고려)
  const getFullscreenHeight = () => {
    return `calc(100vh - ${HEADER_HEIGHT}px)`;
  };

  // 미리보기 모드일 때 고정 높이 사용
  const getBannerHeight = (banner: Banner) => {
    if (mode === "preview") {
      return "100%"; // 미리보기일 때는 부모 컨테이너에 맞춰서 표시
    }
    
    const isFullscreen = banner.image_height === "fullscreen";
    return isFullscreen ? getFullscreenHeight() : banner.image_height || "320px";
  };

  console.log('배너 데이터:', banners); // 디버깅용 로그

  if (!banners || banners.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 bg-gray-100 rounded-lg">
        표시할 배너가 없습니다
      </div>
    );
  }

  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      slidesPerView={1}
      navigation={mode === "live"}
      pagination={{ clickable: true }}
      autoplay={mode === "live" ? { delay: 4000, disableOnInteraction: false } : false}
      loop={banners.length > 1}
      className="w-full h-full"
      style={{ borderRadius: "0.75rem", overflow: "hidden" }}
    >
      {banners.map((banner) => {
        const isFull = banner.fullWidth;
        return (
          <SwiperSlide key={banner.id} className="h-full">
            <div
              className={`relative ${isFull ? "w-full" : "max-w-4xl mx-auto"} h-full`}
            >
              {/* 이미지 */}
              <img 
                src={banner.imageUrl} 
                alt={banner.title} 
                className="w-full h-full object-cover"
                style={{ height: getBannerHeight(banner) }}
              />
              
              {/* 오버레이 */}
              <div className="absolute inset-0">
                <div
                  className="absolute inset-0 bg-black"
                  style={{
                    opacity: banner.overlay_opacity ? Number(banner.overlay_opacity) : 0.4,
                  }}
                />
              </div>
              {/* 텍스트/버튼 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
                <div className="text-white text-2xl font-bold mb-2 drop-shadow-lg text-center">
                  {banner.title}
                </div>
                {banner.subtitle && (
                  <div className="text-white text-lg mb-4 drop-shadow text-center">
                    {banner.subtitle}
                  </div>
                )}
                {banner.buttonText && banner.buttonUrl && (
                  <a
                    href={banner.buttonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-base"
                    tabIndex={mode === "live" ? 0 : -1}
                    aria-disabled={mode !== "live"}
                  >
                    {banner.buttonText}
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
