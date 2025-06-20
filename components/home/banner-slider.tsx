"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { Banner } from "./main-banner";
import { useEffect, useRef } from "react"; // useRef 추가
import { ChevronLeft, ChevronRight } from "lucide-react"; // lucide-react 아이콘 임포트

interface BannerSliderProps {
  banners: Banner[];
}

// 유튜브 링크 판별 및 ID 추출 함수 추가
function isYoutubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
}

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const HEADER_HEIGHT = 64; // px, 헤더 높이와 맞춰야 함

  // Swiper 네비게이션 버튼을 위한 ref 생성
  const navigationPrevRef = useRef<HTMLButtonElement>(null);
  const navigationNextRef = useRef<HTMLButtonElement>(null);

  // 커스텀 네비게이션 화살표 및 페이지네이션 스타일 적용
  useEffect(() => {
    // 스와이퍼 네비게이션 화살표와 페이지네이션 스타일 커스터마이징
    const style = document.createElement("style");
    style.innerHTML = `
      /* 페이지네이션 점 스타일 */
      .swiper-pagination-bullet {
        width: 10px;
        height: 10px;
        background-color: rgba(255, 255, 255, 0.5);
        opacity: 1;
        margin: 0 6px;
        transition: all 0.3s ease;
      }
      
      .swiper-pagination-bullet-active {
        background-color: rgba(255, 255, 255, 0.9);
        width: 12px;
        height: 12px;
      }
      
      .swiper-pagination {
        bottom: 20px !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 화면 전체 높이 계산 (헤더 높이 고려)
  const getFullscreenHeight = () => {
    return `calc(100vh - ${HEADER_HEIGHT}px)`;
  };

  const renderBanner = (banner: Banner) => {
    const isFull = banner.fullWidth;
    if (banner.imageUrl) {
      const isYoutube =
        isYoutubeUrl(banner.imageUrl) && extractYoutubeId(banner.imageUrl);
      return (
        <div
          key={banner.id}
          className={`relative`}
          style={{
            position: "relative",
            width: "100vw",
            minWidth: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height:
              banner.image_height === "fullscreen"
                ? getFullscreenHeight()
                : banner.image_height || "400px",
            overflow: "hidden",
            background: isYoutube ? "#000" : undefined,
            backgroundImage: !isYoutube ? `url(${banner.imageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* 유튜브면 iframe을 background처럼 absolute로 깔기 */}
          {isYoutube && (
            <iframe
              src={`https://www.youtube.com/embed/${extractYoutubeId(banner.imageUrl)}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${extractYoutubeId(banner.imageUrl)}&modestbranding=1&iv_load_policy=3&fs=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100vw",
                height: "56.25vw" /* 16:9 aspect ratio */,
                minWidth: "177.77vh" /* 16:9 aspect ratio */,
                minHeight: "100vh",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          )}
          {/* 오버레이 및 텍스트/HTML (이미지/유튜브 동일) */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-white p-4"
            style={{
              zIndex: 2,
              background: `rgba(0,0,0,${banner.overlay_opacity ? Number(banner.overlay_opacity) : 0.4})`,
              pointerEvents: "none",
            }}
          >
            {banner.use_html && banner.html_content ? (
              <div dangerouslySetInnerHTML={{ __html: banner.html_content }} />
            ) : (
              <>
                {banner.title && (
                  <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="text-lg md:text-xl text-center mb-4">
                    {banner.subtitle}
                  </p>
                )}
                {banner.hasButton && banner.buttonText && banner.buttonUrl && (
                  <a
                    href={banner.buttonUrl}
                    className="bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
                  >
                    {banner.buttonText}
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    // 이미지/유튜브 모두 없을 때 안내문구
    return (
      <div
        key={banner.id}
        className={`relative flex items-center justify-center`}
        style={{
          width: "100vw",
          minWidth: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height:
            banner.image_height === "fullscreen"
              ? getFullscreenHeight()
              : banner.image_height || "400px",
          background: "#fff",
        }}
      >
        <span className="text-gray-400">이미지 없음</span>
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      {banners.length === 1 ? (
        renderBanner(banners[0])
      ) : banners.length >= 2 ? (
        <Swiper
          loop
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          // navigation prop에 ref 객체를 전달
          navigation={{
            prevEl: navigationPrevRef.current,
            nextEl: navigationNextRef.current,
          }}
          // onBeforeInit을 사용하여 Swiper 인스턴스가 생성되기 전에 ref가 설정되었는지 확인
          onBeforeInit={(swiper) => {
            if (
              swiper.params.navigation &&
              typeof swiper.params.navigation !== "boolean"
            ) {
              // @ts-ignore
              swiper.params.navigation.prevEl = navigationPrevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = navigationNextRef.current;
            }
          }}
          modules={[Autoplay, Navigation, Pagination]}
          style={{ width: "100%", height: "100%" }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>{renderBanner(banner)}</SwiperSlide>
          ))}

          {/* 커스텀 네비게이션 버튼 추가 */}
          <button
            ref={navigationPrevRef}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            ref={navigationNextRef}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </Swiper>
      ) : null}
    </div>
  );
}
