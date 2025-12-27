"use client";

import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { TypeAnimation } from "react-type-animation";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  hasButton: boolean;
  buttonText?: string;
  buttonUrl?: string;
}

interface HeroProps {
  banners?: Banner[];
}

// 유튜브 링크 판별 및 ID 추출 함수
function isYoutubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
}

function extractYoutubeId(url: string): string | null {
  const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function Hero({ banners }: HeroProps) {
  // 첫 번째 배너 사용, 없으면 기본 컨텐츠
  const banner = banners?.[0];
  const defaultImage = "https://images.unsplash.com/photo-1647842392232-6db2a139b494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwYXJjaGl0ZWN0dXJlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYzMTg5MjE0fDA&ixlib=rb-4.1.0&q=80&w=1080";

  // 유튜브 비디오인지 확인
  const isYoutube = banner?.imageUrl && isYoutubeUrl(banner.imageUrl);
  const youtubeId = isYoutube ? extractYoutubeId(banner.imageUrl) : null;

  return (
    <section id="home" className="relative h-screen flex items-center overflow-hidden bg-black">
      {/* Background Video or Image */}
      <div className="absolute inset-0 z-0">
        {isYoutube && youtubeId ? (
          <>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&modestbranding=1&iv_load_policy=3&fs=0`}
              title="YouTube video player"
              allow="autoplay; encrypted-media"
              className="pointer-events-none"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100vw",
                height: "56.25vw",
                minWidth: "177.77vh",
                minHeight: "100vh",
                border: 0,
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <Image
            src={banner?.imageUrl || defaultImage}
            alt={banner?.title || "Hero"}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full">
        <div className="max-w-4xl">
          {/* <div className="mb-8 flex items-center gap-4">
            <div className="h-[1px] w-16 bg-white"></div>
            <span className="text-white/60 text-sm uppercase tracking-[0.3em]">Welcome to your</span>
          </div> */}
          <h1 className="text-[clamp(3rem,8vw,7rem)] leading-[1.1] text-white mb-8 tracking-tight font-light sekuya-regular">
            {banner?.title || (
              <>
                Toronto<br />
                <span className="flex items-baseline gap-2 flex-wrap">
                  <span>Connect</span>
                  {/* gravitas-one-regular  sekuya-regular*/}
                  {/* <span className="text-[0.32em] sm:text-[0.32em] text-[0.25em] text-white/70 font-normal">with</span> */}
                  {/* <TypeAnimation
                    sequence={[
                      "God",
                      2000,
                      "You and Me",
                      2000,
                      "People and the World",
                      2000,
                    ]}
                    wrapper="span"
                    speed={50}
                    className="sm:text-[0.3em] text-[0.2em] text-white/70 font-normal type-animation-cursor font-sans"
                    repeat={Infinity}
                  /> */}
                </span>
                Church
              </>
            )}
          </h1>
          <p className="text-[0.75em] sm:text-xl text-white/80 mb-12 max-w-xl leading-relaxed font-light">
            {banner?.subtitle || "Love your God, Love your Neighbor"}
          </p>
          {banner?.hasButton && banner.buttonText && (
            <div className="flex flex-wrap gap-4">
              <a href={banner.buttonUrl || "#"}>
                <button className="px-10 py-5 bg-white text-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all">
                  {banner.buttonText}
                </button>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 right-12 z-10">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
