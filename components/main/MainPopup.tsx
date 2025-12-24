"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function MainPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // 팝업이 이미 닫혔는지 확인 (localStorage 사용)
    const isClosed = localStorage.getItem("main-popup-closed");
    const expiry = localStorage.getItem("main-popup-expiry");

    const now = new Date().getTime();

    if (!isClosed || (expiry && now > parseInt(expiry))) {
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
      <div className="relative w-auto max-w-[80vw] max-h-[80vh] flex flex-col items-center gap-4">
        {/* 팝업 이미지 */}
        <div className="relative bg-white shadow-2xl animate-in fade-in zoom-in duration-300 rounded-3xl overflow-hidden">
          {/* 닫기 버튼 */}
          <button
            onClick={() => closePopup(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 bg-white/80 rounded-full p-1 shadow-sm"
          >
            <X size={20} />
          </button>

          <img
            src="/Images/2025연합예배.jpeg"
            alt="Main Announcement"
            className="w-auto h-auto max-w-full max-h-[70vh] object-contain block"
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* 오늘 하루 보지 않기 버튼 - 이미지 밖으로 분리 */}
        {imageLoaded && (
          <button
            onClick={() => closePopup(true)}
            className="self-start px-6 py-3 bg-white/90 backdrop-blur-md text-gray-700 text-sm font-medium hover:bg-white transition-colors rounded-full shadow-lg border border-gray-200"
          >
            오늘 하루 보지 않기
          </button>
        )}
      </div>

      {/* 배경 클릭 시 닫기 */}
      <div
        className="absolute inset-0 -z-10"
        onClick={() => closePopup(false)}
      ></div>
    </div>
  );
}
