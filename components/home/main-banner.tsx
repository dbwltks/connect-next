"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/db";
import Link from "next/link";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  hasButton: boolean;
  buttonText?: string;
  buttonUrl?: string;
  isActive: boolean;
  fullWidth?: boolean;
  html_content?: string;
  use_html?: boolean;
  image_height?: string; // 'original' | '400px' | '20vh' 등
  overlay_opacity?: string; // 오버레이 투명도(0~1)
};

export default function MainBanner({ menuId }: { menuId?: string | null }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveBanners() {
      try {
        // Supabase에서 활성화된 배너 가져오기
        let query = supabase
          .from("cms_banners")
          .select("*")
          .eq("is_active", true);
          
        // 메뉴 ID가 있으면 해당 메뉴의 배너만 가져오기
        if (menuId) {
          query = query.eq("menu_id", menuId);
        } else {
          // 메뉴 ID가 없으면 전체 사이트 배너(menu_id가 null인 배너)만 가져오기
          query = query.is("menu_id", null);
        }
        
        const { data, error } = await query.order("order_num", { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          // 배너가 없으면 빈 배열로 설정 (아무것도 표시하지 않음)
          setBanners([]);
        } else {
          setBanners(
            data.map((b: any) => ({
              id: b.id,
              title: b.title,
              subtitle: b.subtitle || "",
              imageUrl: b.image_url,
              hasButton: b.has_button || false,
              buttonText: b.button_text || "",
              buttonUrl: b.button_url || "",
              isActive: b.is_active,
              fullWidth: b.full_width || false,
              html_content: b.html_content || "",
              use_html: b.use_html || false,
              image_height: b.image_height || 'original',
              overlay_opacity: b.overlay_opacity || '0.4',
            }))
          );
        }
      } catch (error) {
        console.error("배너 로딩 오류:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveBanners();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full h-[50vh] bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-400">배너 로딩 중...</div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  // 배너 렌더링 함수
  const HEADER_HEIGHT = 64; // px, 헤더 높이와 맞춰야 함
  
  // 화면 전체 높이 계산 (헤더 높이 고려)
  const getFullscreenHeight = () => {
    return `calc(100vh - ${HEADER_HEIGHT}px)`;
  };
  const renderBanner = (banner: Banner) => {
    const isFull = banner.fullWidth;
    // 화면 전체 높이로 설정된 경우
    if (banner.image_height === 'fullscreen') {
      return (
        <div
          key={banner.id}
          className={`relative ${isFull ? 'w-full' : 'max-w-4xl mx-auto'} bg-cover bg-center`}
          style={{ 
            backgroundImage: `url(${banner.imageUrl})`, 
            width: '100%', 
            height: getFullscreenHeight() 
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black" 
              style={{ opacity: banner.overlay_opacity ? Number(banner.overlay_opacity) : 0.4, pointerEvents: 'none' }}
            ></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              {banner.use_html
                ? (banner.html_content && banner.html_content.trim() !== '' ? (
                    <div dangerouslySetInnerHTML={{ __html: banner.html_content }} />
                  ) : null)
                : (
                    <>
                      {banner.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{banner.title}</h2>}
                      {banner.subtitle && <p className="text-lg md:text-xl text-center mb-4">{banner.subtitle}</p>}
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
    }
    
    // 원본(또는 미설정)일 때: <img> 태그로 원본 비율/크기 그대로
    if (!banner.image_height || banner.image_height === 'original') {
      return (
        <div
          key={banner.id}
          className={`relative ${isFull ? 'w-full' : 'max-w-4xl mx-auto'} flex justify-center items-center`}
          style={{ minHeight: '320px' }}
        >
          {banner.imageUrl && (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          )}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-black" 
              style={{ opacity: banner.overlay_opacity ? Number(banner.overlay_opacity) : 0.4, pointerEvents: 'none' }}
            ></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
              {banner.use_html
                ? (banner.html_content && banner.html_content.trim() !== '' ? (
                    <div dangerouslySetInnerHTML={{ __html: banner.html_content }} />
                  ) : null)
                : (
                    <>
                      {banner.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{banner.title}</h2>}
                      {banner.subtitle && <p className="text-lg md:text-xl text-center mb-4">{banner.subtitle}</p>}
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
    }

    // 직접입력(고정 높이)일 때: 배경이미지+height
    return (
      <div
        key={banner.id}
        className={`relative ${isFull ? 'w-full' : 'max-w-4xl mx-auto'} bg-cover bg-center`}
        style={{ backgroundImage: `url(${banner.imageUrl})`, width: '100%', height: banner.image_height }}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-black" 
            style={{ opacity: banner.overlay_opacity ? Number(banner.overlay_opacity) : 0.4, pointerEvents: 'none' }}
          ></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            {banner.use_html
              ? (banner.html_content && banner.html_content.trim() !== '' ? (
                  <div dangerouslySetInnerHTML={{ __html: banner.html_content }} />
                ) : null)
              : (
                  <>
                    {banner.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">{banner.title}</h2>}
                    {banner.subtitle && <p className="text-lg md:text-xl text-center mb-4">{banner.subtitle}</p>}
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
          style={{ width: '100%', height: '100%' }}
        >
          {banners.map(banner => (
            <SwiperSlide key={banner.id}>{renderBanner(banner)}</SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </div>
  );
}
