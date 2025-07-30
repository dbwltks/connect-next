"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [showButton, setShowButton] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 페이지 변경 시 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // 스크롤 방향에 따른 버튼 제어
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 기존 타이머 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 상단 근처(300px 이내)에서는 숨김
      if (currentScrollY < 300) {
        setShowButton(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // 스크롤 방향 감지
      if (currentScrollY > lastScrollY) {
        // 아래로 스크롤 → 즉시 숨김
        setShowButton(false);
      } else {
        // 위로 스크롤 → 즉시 표시
        setShowButton(true);
      }

      // 스크롤 정지 후 3초 뒤 숨김 타이머 설정
      scrollTimeoutRef.current = setTimeout(() => {
        if (currentScrollY >= 300) {
          setShowButton(false);
        }
      }, 3000);

      setLastScrollY(currentScrollY);
    };

    // 스크롤 이벤트 등록
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 초기값 설정
    setLastScrollY(window.scrollY);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [lastScrollY]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 300px 이하에서는 렌더링하지 않음
  if (typeof window !== 'undefined' && window.scrollY < 300 && !showButton) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-32 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all duration-500 ease-in-out ${
        showButton
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
      aria-label="맨 위로 가기"
    >
      <ChevronUp className="h-5 w-5 text-gray-700" />
    </button>
  );
}