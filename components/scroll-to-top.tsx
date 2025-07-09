"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";
import GlassContainer from "@/components/ui/glass-container";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // 모바일 화면 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px 이하를 모바일로 간주
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 스크롤 위치와 방향에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const toggleVisibility = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤이 300px 이상 내려갔을 때만 버튼 표시 가능
      if (currentScrollY > 300) {
        setIsVisible(true);
        
        // 모바일에서만 스크롤 방향 체크
        if (isMobile) {
          // 스크롤 방향 확인
          if (currentScrollY > lastScrollY.current) {
            // 아래로 스크롤 중
            setIsScrollingDown(true);
          } else {
            // 위로 스크롤 중
            setIsScrollingDown(false);
          }
        }
      } else {
        setIsVisible(false);
        setIsScrollingDown(false);
      }

      lastScrollY.current = currentScrollY;

      // 비활성 타이머 재설정
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      // 3초 후 버튼 숨기기 (스크롤이 멈춘 후)
      inactivityTimer.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener("scroll", toggleVisibility);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isMobile]);

  // 맨 위로 스크롤 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 부드러운 스크롤 효과
    });
  };

  // 버튼 표시 여부 결정
  const shouldShowButton = isVisible && (!isMobile || !isScrollingDown);

  return (
    <>
      <div 
        className={`fixed bottom-32 right-4 sm:bottom-14 sm:right-4 z-10 transition-all duration-300 ${
          shouldShowButton 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <GlassContainer
          size="small"
          onClick={scrollToTop}
          aria-label="맨 위로 스크롤"
          role="button"
          className="cursor-pointer"
        >
          <ChevronUp className="h-8 w-8" />
        </GlassContainer>
      </div>
    </>
  );
}
