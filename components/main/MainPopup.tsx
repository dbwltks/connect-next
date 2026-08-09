"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function MainPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 캐나다(토론토) 시간으로 2026년 8월 24일 0시부터 팝업 노출 종료
    const endDate = new Date('2026-08-24T00:00:00-04:00'); // EDT 시간대
    const now = new Date();

    // 만료 날짜가 지났으면 팝업을 표시하지 않음
    if (now > endDate) {
      return;
    }

    // 팝업이 이미 닫혔는지 확인 (localStorage 사용)
    const isClosed = localStorage.getItem("main-popup-closed-0813");
    const expiry = localStorage.getItem("main-popup-expiry-0813");

    const nowTime = now.getTime();

    if (!isClosed || (expiry && nowTime > parseInt(expiry))) {
      // 약간의 지연 후 팝업 표시
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePopup = (dontShowAgain = false) => {
    setIsOpen(false);
    if (dontShowAgain) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem("main-popup-closed-0813", "true");
      localStorage.setItem("main-popup-expiry-0813", tomorrow.getTime().toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md mx-auto flex flex-col items-center gap-3 sm:gap-4">
        {/* 팝업 컨텐츠 */}
        <div className="relative bg-white dark:bg-gray-900 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-3xl overflow-hidden w-full">
          {/* 닫기 버튼 */}
          <button
            onClick={() => closePopup(false)}
            className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors z-10 bg-black/30 backdrop-blur-sm rounded-full p-1 shadow-sm"
          >
            <X size={20} />
          </button>

          {/* 배경 이미지 + 8월 소식 */}
          <div className="relative w-full aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=1200"
              alt="8월 소식"
              fill
              className="object-cover"
              priority
            />
            {/* 가독성을 위한 그라데이션 스크림 (하단만 살짝) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 sm:p-7 text-white">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-amber-200/90">
                8월 소식
              </span>

              <div className="space-y-1.5">
                <p className="text-lg sm:text-xl font-bold leading-snug">
                  8.13 (목) 목요집회 없음
                </p>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  선교팀이 선교지에서 드리는 예배축제를
                  <br />
                  실시간으로 송출합니다
                </p>
              </div>

              <div className="h-px bg-white/20" />

              <div className="space-y-1.5">
                <p className="text-lg sm:text-xl font-bold leading-snug">
                  8.23 (주일) 야외예배 &amp; 세례식
                </p>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  자연 속에서 함께 드리는 예배와
                  <br />
                  세례식으로 여러분을 초대합니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘 하루 보지 않기 버튼 */}
        <button
          onClick={() => closePopup(true)}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-colors rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
        >
          오늘 하루 보지 않기
        </button>
      </div>

      {/* 배경 클릭 시 닫기 */}
      <div
        className="absolute inset-0 -z-10"
        onClick={() => closePopup(false)}
      ></div>
    </div>
  );
}
