"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import GlassContainer from "@/components/ui/glass-container";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const toggleVisibility = () => {
      // 스크롤이 300px 이상 내려갔을 때 버튼 표시
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // 맨 위로 스크롤 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // 부드러운 스크롤 효과
    });
  };

  return (
    <>
      {isVisible && (
        <div className="fixed bottom-16 right-4 sm:bottom-14 sm:right-4 z-10">
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
      )}
    </>
  );
}
