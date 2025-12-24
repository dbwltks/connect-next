"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselImage {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

interface ImageCarouselProps {
  images?: CarouselImage[];
}

export function ImageCarousel({ images = [] }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 기본 이미지 (images가 없을 때)
  const defaultImages: CarouselImage[] = [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2000",
      title: "주일 예배",
      description: "매주 일요일 오후 3시",
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=2000",
      title: "찬양 예배",
      description: "하나님을 향한 찬양",
    },
    {
      id: "3",
      imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000",
      title: "말씀 나눔",
      description: "성경을 통한 교제",
    },
    {
      id: "4",
      imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=2000",
      title: "교회 공동체",
      description: "함께하는 신앙생활",
    },
  ];

  const displayImages = images.length > 0 ? images : defaultImages;

  // 자동 슬라이드
  useEffect(() => {
    if (!isAutoPlaying || displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  if (displayImages.length === 0) return null;

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-black overflow-hidden">
      {/* 이미지 슬라이드 */}
      <div className="relative w-full h-full">
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.imageUrl}
              alt={image.title || `Slide ${index + 1}`}
              fill
              className="object-cover object-center"
              priority={index === 0}
            />

            {/* 텍스트 오버레이 */}
            {(image.title || image.description) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-4xl px-6">
                  {image.title && (
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-4 tracking-tight">
                      {image.title}
                    </h2>
                  )}
                  {image.description && (
                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light">
                      {image.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 이전/다음 버튼 */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* 인디케이터 */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex
                  ? "w-8 sm:w-12 h-1.5 sm:h-2 bg-white"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/75"
              } rounded-full`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
