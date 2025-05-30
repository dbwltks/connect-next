"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import type { Banner } from "./main-banner";

interface BannerSliderProps {
  banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
  const HEADER_HEIGHT = 64; // px, 헤더 높이와 맞춰야 함

  // 화면 전체 높이 계산 (헤더 높이 고려)
  const getFullscreenHeight = () => {
    return `calc(100vh - ${HEADER_HEIGHT}px)`;
  };

  const renderBanner = (banner: Banner) => {
    const isFull = banner.fullWidth;
    // 화면 전체 높이로 설정된 경우
    if (banner.image_height === "fullscreen") {
      return (
        <div
          key={banner.id}
          className={`relative ${isFull ? "w-full" : "max-w-4xl mx-auto"} bg-cover bg-center`}
          style={{
            backgroundImage: `url(${banner.imageUrl})`,
            width: "100%",
            height: getFullscreenHeight(),
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black"
              style={{
                opacity: banner.overlay_opacity
                  ? Number(banner.overlay_opacity)
                  : 0.4,
                pointerEvents: "none",
              }}
            ></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              {banner.use_html ? (
                banner.html_content && banner.html_content.trim() !== "" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: banner.html_content }}
                  />
                ) : null
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
                  {banner.hasButton &&
                    banner.buttonText &&
                    banner.buttonUrl && (
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
        </div>
      );
    }

    // 원본(또는 미설정)일 때: <img> 태그로 원본 비율/크기 그대로
    if (!banner.image_height || banner.image_height === "original") {
      return (
        <div
          key={banner.id}
          className={`relative ${isFull ? "w-full" : "max-w-4xl mx-auto"} flex justify-center items-center`}
          style={{
            width: "100%",
            height: "400px", // 기본 고정 높이
            overflow: "hidden",
          }}
        >
          {banner.imageUrl && (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          )}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black"
              style={{
                opacity: banner.overlay_opacity
                  ? Number(banner.overlay_opacity)
                  : 0.4,
                pointerEvents: "none",
              }}
            ></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              {banner.use_html ? (
                banner.html_content && banner.html_content.trim() !== "" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: banner.html_content }}
                  />
                ) : null
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
                  {banner.hasButton &&
                    banner.buttonText &&
                    banner.buttonUrl && (
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
        </div>
      );
    }

    // 직접입력(고정 높이)일 때: 배경이미지+height
    return (
      <div
        key={banner.id}
        className={`relative ${isFull ? "w-full" : "max-w-4xl mx-auto"} bg-cover bg-center`}
        style={{
          backgroundImage: `url(${banner.imageUrl})`,
          width: "100%",
          height: banner.image_height, // DB에서 받아온 높이
        }}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-black"
            style={{
              opacity: banner.overlay_opacity
                ? Number(banner.overlay_opacity)
                : 0.4,
              pointerEvents: "none",
            }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            {banner.use_html ? (
              banner.html_content && banner.html_content.trim() !== "" ? (
                <div
                  dangerouslySetInnerHTML={{ __html: banner.html_content }}
                />
              ) : null
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
          navigation
          modules={[Autoplay, Navigation, Pagination]}
          style={{ width: "100%", height: "100%" }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>{renderBanner(banner)}</SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </div>
  );
}
