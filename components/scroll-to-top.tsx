"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  // 페이지 변경 시 맨 위로 스크롤
  useEffect(() => {
    // 브라우저의 스크롤 복원 기능 비활성화
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // 모든 브라우저에서 확실하게 맨 위로 스크롤
    const scrollToTop = () => {
      // document.body와 document.documentElement 모두 처리 (모바일 호환성)
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      // window.scrollTo로도 처리 (iOS Safari 등)
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    };

    // 즉시 실행
    scrollToTop();
    
    // 한 번 더 실행 (페이지 로드 완료 후)
    const timer = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const isMobile = window.innerWidth <= 768;

      // 데스크톱에서는 기본 동작 (300px 이상 스크롤 시 표시)
      if (!isMobile) {
        setIsVisible(currentScrollY > 300);
      } else {
        // 모바일에서는 스크롤 방향에 따라 표시/숨김
        if (currentScrollY > 300) {
          const isScrollingUp = currentScrollY < lastScrollY;
          setScrollingUp(isScrollingUp);
          
          if (isScrollingUp) {
            // 위로 스크롤할 때 표시
            setIsVisible(true);
            // 기존 타이머 제거
            if (hideTimer) {
              clearTimeout(hideTimer);
              setHideTimer(null);
            }
          } else {
            // 아래로 스크롤할 때 숨김
            setIsVisible(false);
          }
        } else {
          setIsVisible(false);
        }
      }

      setLastScrollY(currentScrollY);
    };

    // 모바일에서 스크롤 정지 시 버튼 숨김
    const handleScrollEnd = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile && scrollingUp && isVisible) {
        // 2초 후 버튼 숨김
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 2000);
        setHideTimer(timer);
      }
    };

    let scrollTimer: NodeJS.Timeout;
    const handleScrollWithEnd = () => {
      handleScroll();
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScrollEnd, 150);
    };

    window.addEventListener('scroll', handleScrollWithEnd);
    return () => {
      window.removeEventListener('scroll', handleScrollWithEnd);
      clearTimeout(scrollTimer);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [lastScrollY, scrollingUp, isVisible, hideTimer]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-32 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-500 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="맨 위로 가기"
    >
      <ChevronUp className="w-6 h-6 text-gray-700" />
    </button>
  );
}