"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const backgroundImages = [
  "https://images.unsplash.com/photo-1552592570-8e98dd7d2ccf?q=80&w=2000",
  "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2000",
];

export function Theme2026() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="theme-2026"
      className="relative overflow-hidden py-24 md:py-32 bg-slate-900"
    >
      {/* 배경 사진 - 크로스페이드 + 천천히 확대되는 애니메이션 */}
      {backgroundImages.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          className={`object-cover animate-kenburns transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/55" />

      {/* 추상 그래픽 배경 (비활성화 - 필요시 재사용)
      <div
        className="absolute inset-0 opacity-60 dark:opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />
      <div className="absolute -top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      */}

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-8 sm:w-12 bg-white/30" />
          <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/60">
            2026 Theme
          </span>
          <div className="h-[1px] w-8 sm:w-12 bg-white/30" />
        </div>

        <p
          className="text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.4] text-white"
          style={{ fontFamily: "'Nanum Brush Script', cursive" }}
        >
          믿음의 역사, 사랑의 수고, 소망의 인내
        </p>

        <p className="mt-6 text-xs sm:text-sm text-white/50 tracking-[0.15em] uppercase italic">
          The work of faith, the labor of love, and the patience of hope
        </p>
      </div>
    </section>
  );
}
