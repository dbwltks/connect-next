"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function MainPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // 캐나다(토론토) 시간으로 2026년 1월 8일 오후 11시
    const endDate = new Date('2026-01-08T23:00:00-05:00'); // EST 시간대
    const now = new Date();

    // 만료 날짜가 지났으면 팝업을 표시하지 않음
    if (now > endDate) {
      return;
    }

    // 팝업이 이미 닫혔는지 확인 (localStorage 사용)
    const isClosed = localStorage.getItem("main-popup-closed");
    const expiry = localStorage.getItem("main-popup-expiry");

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
      localStorage.setItem("main-popup-closed", "true");
      localStorage.setItem("main-popup-expiry", tomorrow.getTime().toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md mx-auto flex flex-col items-center gap-3 sm:gap-4">
        {/* 팝업 컨텐츠 */}
        <div className="relative bg-white dark:bg-gray-900 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-3xl overflow-hidden w-full p-8 sm:p-12">
          {/* 닫기 버튼 */}
          <button
            onClick={() => closePopup(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-10 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow-sm"
          >
            <X size={20} />
          </button>

          <div className="text-center space-y-6">
            {/* 제목 */}
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
              이번 주는 쉬어가요!
            </h2>

            {/* 내용 */}
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="text-base sm:text-lg">
                <span className="font-semibold text-black dark:text-white">BCIN</span>과{" "}
                <span className="font-semibold text-black dark:text-white">목요예배</span>가
                <br />
                이번 주는 쉬어갑니다.
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                충분한 휴식을 취하시고
                <br />
                다음 주에 더 힘차게 만나요! 🙌
              </p>
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
