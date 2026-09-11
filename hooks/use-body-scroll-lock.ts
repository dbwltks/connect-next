import { useEffect } from "react";

/** 모바일 메뉴/모달 열릴 때 배경 스크롤 잠금 (iOS 포함) */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const original = {
      position: style.position,
      top: style.top,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = original.position;
      style.top = original.top;
      style.width = original.width;
      style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
