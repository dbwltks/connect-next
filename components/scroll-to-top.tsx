"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 브라우저의 스크롤 복원 기능 비활성화
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // 페이지 경로가 변경될 때마다 맨 위로 스크롤
    // 약간의 지연을 두어 페이지 렌더링 후 스크롤
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // 즉시 이동 (부드러운 스크롤 대신)
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}