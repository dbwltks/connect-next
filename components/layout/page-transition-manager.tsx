"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useRouterCache } from '@/hooks/use-router-cache';

export default function PageTransitionManager() {
  const pathname = usePathname();
  const { invalidateCache } = useRouterCache();
  const previousPathnameRef = useRef<string>("");

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    
    // 첫 로딩이거나 이전 경로와 같으면 캐시 무효화하지 않음
    if (!previousPathname || previousPathname === pathname) {
      previousPathnameRef.current = pathname;
      return;
    }

    // 경로가 실제로 변경된 경우에만 캐시 무효화
    // 서버에서 초기 데이터를 받을 시간을 주기 위해 1초 지연
    const timer = setTimeout(() => {
      // 이전 경로와 현재 경로가 다른 페이지 타입인지 확인
      const previousIsBoard = previousPathname.includes('/board') || previousPathname.includes('/notice');
      const currentIsBoard = pathname.includes('/board') || pathname.includes('/notice');
      
      if (previousIsBoard !== currentIsBoard) {
        // 페이지 타입이 바뀐 경우에만 전체 캐시 무효화
        invalidateCache(/^(widgets|boardData)/);
      } else {
        // 같은 타입 내에서 이동하는 경우 해당 타입만 무효화
        if (currentIsBoard) {
          invalidateCache(/^boardData/);
        } else {
          invalidateCache(/^widgets/);
        }
      }
    }, 1000);

    previousPathnameRef.current = pathname;
    return () => clearTimeout(timer);
  }, [pathname, invalidateCache]);

  return null; // 렌더링하지 않음
}