"use client";

import {
  BookOpen,
  Book,
  Church,
  DollarSign,
  Info,
  Heart,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TypeAnimation } from "react-type-animation";

export function QuickLinks() {
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [showPrayerPopup, setShowPrayerPopup] = useState(false);
  const [copied, setCopied] = useState(false);

  // 이메일 복사 핸들러
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("tconnectchurch@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  // Smooth scroll 핸들러
  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // # 으로 시작하는 anchor link인 경우 smooth scroll
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  const links = [
    {
      title: "주보",
      icon: BookOpen,
      href: "/connecting/weekly-bulletin", // 온라인 주보 페이지
      type: "link" as const,
    },
    {
      title: "BCIN",
      icon: Book,
      href: "/sermons/bcin", // BCIN 페이지
      type: "link" as const,
    },
    {
      title: "예배안내",
      icon: Church,
      href: "#service-times", // 세션 이동
      type: "link" as const,
    },
    {
      title: "온라인 헌금",
      icon: DollarSign,
      type: "popup" as const,
      action: () => setShowDonationPopup(true),
    },
    {
      title: "교회소개",
      icon: Info,
      href: "/connect/about", // 교회소개 페이지
      type: "link" as const,
    },
    {
      title: "중보기도 요청",
      icon: Heart,
      type: "popup" as const,
      action: () => setShowPrayerPopup(true),
    },
  ];

  return (
    <>
      <section id="quick-links" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <span className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
              Quick Links
            </span>
            <h2 className="text-[clamp(2rem,5vw,2.5rem)] font-medium leading-[1.1] mt-6 mb-4 tracking-tight text-black dark:text-white">
              하나님 사랑, 이웃 사랑
            </h2>
            <p className="text-xs sm:text-xl text-gray-600 dark:text-gray-400">
              <span>Connect with </span>
              <TypeAnimation
                sequence={[
                  "God",
                  2000,
                  "You and Me",
                  2000,
                  "People and the World",
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                className="text-black dark:text-white font-medium"
              />
            </p>
          </div>

          {/* 바로가기 그리드 */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {links.map((link, index) => {
              const Icon = link.icon;

              if (link.type === "popup") {
                return (
                  <button
                    key={index}
                    onClick={link.action}
                    className="group flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-800 hover:bg-black dark:hover:bg-white transition-all duration-300 rounded-lg"
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 mb-4 flex items-center justify-center text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors">
                      <Icon className="w-full h-full" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs sm:text-base font-medium text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors text-center">
                      {link.title}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  href={link.href!}
                  onClick={(e) => handleLinkClick(e, link.href!)}
                  className="group flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-800 hover:bg-black dark:hover:bg-white transition-all duration-300 rounded-lg"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-4 flex items-center justify-center text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors">
                    <Icon className="w-full h-full" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs sm:text-base font-medium text-black dark:text-white group-hover:text-white dark:group-hover:text-black transition-colors text-center">
                    {link.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 온라인 헌금 팝업 */}
      {showDonationPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDonationPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">
              온라인 헌금
            </h3>

            {/* E-Transfer 정보 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-black dark:text-white mb-2">
                E-Transfer
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                캐나다 은행 계좌에서 E-Transfer로 헌금하실 수 있습니다.
              </p>
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      이메일
                    </p>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          복사완료
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          복사하기
                        </>
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-sm font-semibold text-black dark:text-white break-all">
                    tconnectchurch@gmail.com
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    수신자명
                  </p>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    TORONTO CONNECT CHURCH
                  </p>
                </div>
              </div>
            </div>

            {/* 헌금 종류 안내 */}
            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-black dark:text-white mb-3">
                헌금 종류
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                E-Transfer 메시지란에 아래 중 해당하는 헌금 종류를 영어로
                적어주세요:
              </p>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-black dark:text-white">
                    주일헌금
                  </span>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    Sunday Offering
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-black dark:text-white">
                    감사헌금
                  </span>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    Thanksgiving Offering
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-black dark:text-white">
                    십일조
                  </span>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    Tithe
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-black dark:text-white">
                    지정헌금
                  </span>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    Designated Offering
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                헌금해 주셔서 감사합니다. 하나님의 축복이 함께 하시길
                기도합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 중보기도 요청 팝업 */}
      {showPrayerPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowPrayerPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
              중보기도 요청
            </h3>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  이름
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  기도 제목
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="기도 제목을 입력하세요"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
              >
                기도 요청 보내기
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
