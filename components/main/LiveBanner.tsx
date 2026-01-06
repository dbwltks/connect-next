"use client";

import { useState, useEffect } from "react";
import { Radio, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LiveBannerProps {
  channelId?: string; // YouTube 채널 ID
  liveUrl?: string;
  message?: string;
}

// 다음 예배 시간 계산 함수
function getNextService() {
  const now = new Date();
  const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 예배 시간 정의 (목요일 19:15, 일요일 15:00)
  const services = [
    { day: 0, hour: 15, minute: 0, name: "주일 예배" }, // 일요일
    { day: 4, hour: 19, minute: 15, name: "목요 기도회" }, // 목요일
  ];

  for (const service of services) {
    if (
      currentDay < service.day ||
      (currentDay === service.day &&
        (currentHour < service.hour ||
          (currentHour === service.hour && currentMinute < service.minute)))
    ) {
      return service;
    }
  }

  // 모든 예배가 지났으면 다음 주 일요일 예배
  return services[0];
}

export function LiveBanner({
  channelId = "UCkQX1tChV7lrewriPhf58gg", // YouTube 채널 ID
  liveUrl = "https://www.youtube.com/@TorontoConnectChurch/streams",
  message = "지금 온라인 예배가 진행 중입니다",
}: LiveBannerProps) {
  const [isLive, setIsLive] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);
  const [actualLiveUrl, setActualLiveUrl] = useState(liveUrl);
  const [nextService, setNextService] = useState<{
    name: string;
    hour: number;
    minute: number;
  } | null>(null);

  // 다음 예배 시간 계산
  useEffect(() => {
    const updateNextService = () => {
      setNextService(getNextService());
    };

    updateNextService();

    // 1분마다 다음 예배 시간 업데이트
    const interval = setInterval(updateNextService, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // YouTube API로 라이브 스트리밍 체크
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // YouTube Data API v3 사용 (NEXT_PUBLIC_GOOGLE_API_KEY 사용)
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!apiKey) {
          console.warn("YouTube API key not found");
          return;
        }

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
        );

        const data = await response.json();

        if (data.items && data.items.length > 0) {
          // 라이브 스트리밍 중
          setIsLive(true);
          const videoId = data.items[0].id.videoId;
          setActualLiveUrl(`https://www.youtube.com/watch?v=${videoId}`);
        } else {
          setIsLive(false);
        }
      } catch (error) {
        console.error("Error checking live status:", error);
        setIsLive(false);
      }
    };

    checkLiveStatus();

    // 5분마다 상태 체크
    const interval = setInterval(checkLiveStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [channelId]);

  // 펄스 애니메이션
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setPulseAnimation(false);
      setTimeout(() => setPulseAnimation(true), 100);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="relative w-full py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-y border-gray-700/50">
      <div className="max-w-7xl mx-auto sm:px-6 px-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Live/Offline 아이콘 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  isLive ? "text-red-500" : "text-gray-400"
                }`}
              />
              {isLive && pulseAnimation && (
                <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping" />
              )}
            </div>
            <span
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
                isLive
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-gray-700/50 text-gray-400"
              }`}
            >
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>

          {/* 메시지 */}
          <p
            className={`text-xs sm:text-sm md:text-base font-semibold text-center flex-1 transition-colors ${
              isLive ? "text-white" : "text-gray-400"
            }`}
          >
            {isLive
              ? message
              : nextService
                ? `다음 예배는 ${nextService.name} ${String(nextService.hour).padStart(2, "0")}:${String(nextService.minute).padStart(2, "0")}입니다`
                : "다음 온라인 예배를 기다려주세요"}
          </p>

          {/* 참여하기 버튼 - 라이브일 때만 */}
          {isLive && (
            <>
              <Link
                href={actualLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 px-5 md:px-7 py-2 md:py-2.5 rounded-full font-semibold text-sm md:text-base transition-all hover:scale-105 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
              >
                <span>참여하기</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              {/* 모바일 참여하기 버튼 */}
              <Link
                href={actualLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:hidden flex items-center gap-1.5 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md shadow-red-500/30"
              >
                <span>참여</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
