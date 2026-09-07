"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Music2 } from "lucide-react";

const ADDRESS = "45 Davenport Rd, Toronto, ON (M5R 1H2)";
const EMBED_MAP_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2885.601550917232!2d-79.3916297232777!3d43.6730595515324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34a6feddf98d%3A0x7d6c6e75a3de3e0!2s45%20Davenport%20Rd%2C%20Toronto%2C%20ON%20M5R%201H2!5e0!3m2!1sko!2sca!4v1703350000000!5m2!1sko!2sca";

const content = {
  ko: {
    intro: (
      <>
        빛을 잃어버린지도 몰랐던 당신의 삶을
        <br />
        환히 밝혀 줄 가장 눈부신 선물이 찾아옵니다!
      </>
    ),
    titleLine1: "뉴커넥션",
    titleLine2: "콘서트",
    date: "2026. Sep. 24 (Thu) 7:30 pm",
    venue: "토론토 커넥트 교회 @ GYM",
    verse: (
      <p>
        너희가 전에는 어둠이더니 이제는 주 안에서 빛이라 빛의 자녀들처럼
        행하라 (엡 5:8)
      </p>
    ),
    aboutLabel: "About New Connection",
    aboutTitle: "뉴커넥션이란?",
    aboutBody: (
      <>
        뉴커넥션은 아직 교회가 낯선 분들, 새로운 만남을 기다리는 분들을
        위해 커넥트 교회가 준비한 초청 콘서트입니다.
        <br />
        <br />
        음악과 이야기를 통해 잠시 삶을 멈추고, 우리를 향한 빛 되신 분을
        만나는 시간이 되기를 바랍니다.
        <br />
        <br />
        혼자여도 괜찮아요. 편안한 마음으로 오세요.
      </>
    ),
    programLabel: "Program",
    programTitle: "공연 순서",
    programBody: "공연 프로그램은 추후 공개됩니다.",
    programTeaser: ["축하공연", "메시지", "친교"],
    directionsLabel: "Directions",
    directionsTitle: "찾아오는 길",
    venueLine: "토론토 커넥트 교회 @ GYM",
    directionsText:
      "블로어-영(Bloor-Yonge) 전철역 또는 베이(Bay) 전철역에서 한 블럭 북쪽으로 오셔서 Davenport Rd를 만나 45번지를 찾으면 됩니다.",
    parkingTitle: "Parking",
    parkingAddress: "40 Scollard St, Toronto, ON M5R 3S1",
    parkingText:
      "아파트 지하 주차장 입구 판넬의 녹색 버튼을 누르시면 됩니다. 주차장 입구는 건물 뒤 Scollard Street에 있습니다.",
    lastYearLabel: "Last Year",
    lastYearTitle: "지난 뉴커넥션",
    lastYearBody: "작년 뉴커넥션의 순간들을 영상으로 만나보세요.",
    videoPlaceholder: "영상 준비 중입니다",
  },
  en: {
    intro: (
      <>
        A life that didn&apos;t even know its light was gone
        <br />
        is about to be lit up by the most dazzling gift!
      </>
    ),
    titleLine1: "New Connection",
    titleLine2: "Concert",
    date: "2026. Sep. 24 (Thu) 7:30 pm",
    venue: "Toronto Connect Church @ GYM",
    verse: (
      <p>
        For you were once darkness, but now you are light in the Lord. Live
        as children of light (Ephesians 5:8)
      </p>
    ),
    aboutLabel: "About New Connection",
    aboutTitle: "What is New Connection?",
    aboutBody: (
      <>
        New Connection is an invitation concert prepared by Connect Church
        for anyone new to church, or waiting for a new kind of connection.
        <br />
        <br />
        Through music and stories, we hope it&apos;ll be a moment to pause
        and meet the One who is Light for us.
        <br />
        <br />
        It&apos;s okay to come alone. Just come as you are.
      </>
    ),
    programLabel: "Program",
    programTitle: "Program",
    programBody: "The program will be announced soon.",
    programTeaser: ["Performance", "Message", "Fellowship"],
    directionsLabel: "Directions",
    directionsTitle: "How to Get Here",
    venueLine: "Toronto Connect Church @ GYM",
    directionsText:
      "From Bloor-Yonge or Bay subway station, walk one block north to Davenport Rd and look for number 45.",
    parkingTitle: "Parking",
    parkingAddress: "40 Scollard St, Toronto, ON M5R 3S1",
    parkingText:
      "Press the green button at the underground parking entrance panel. The entrance is on Scollard Street, behind the building.",
    lastYearLabel: "Last Year",
    lastYearTitle: "Last Year's New Connection",
    lastYearBody: "Relive the moments from last year's New Connection.",
    videoPlaceholder: "Video coming soon",
  },
} as const;

export function NewConnectionContent() {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [infoTab, setInfoTab] = useState<"directions" | "parking">(
    "directions"
  );
  const t = content[lang];

  return (
    <div className="relative h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* 언어 전환 */}
      <button
        onClick={() => setLang(lang === "ko" ? "en" : "ko")}
        className="fixed top-6 right-6 z-20 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 tracking-wide hover:bg-black/55 transition-colors"
      >
        {lang === "ko" ? "ENG" : "KOR"}
      </button>

      {/* 고정 배경: 스크롤해도 그대로 유지됨 (모바일/데스크톱 이미지 분리) */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Images/2026newconnection_back.png"
          alt=""
          fill
          priority
          className="object-cover sm:hidden"
        />
        <Image
          src="/Images/2026newconnection_deskback.png"
          alt=""
          fill
          priority
          className="hidden sm:block object-cover"
        />
      </div>

      <main className="relative z-10">
        {/* 1. 메인 */}
        <section className="relative h-screen snap-start flex flex-col items-center justify-between text-center px-4 pt-28 sm:pt-28 pb-10 text-white overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {t.intro}
              </p>

              <h1
                className={
                  lang === "ko"
                    ? "plex-kr-thin text-[clamp(3.25rem,13vw,5.5rem)] leading-[1.25] tracking-[0.05em]"
                    : "plex-kr-thin text-[clamp(2.5rem,11vw,4.25rem)] leading-[1.25] tracking-[0.05em]"
                }
                style={{
                  textShadow:
                    "0 0 6px rgba(255,255,255,0.9), 0 0 18px rgba(255,255,255,0.7), 0 0 36px rgba(255,255,255,0.4)",
                }}
              >
                <span className="whitespace-nowrap">{t.titleLine1}</span>
                <br />
                {t.titleLine2}
              </h1>

              <p className="text-xl sm:text-2xl font-bold">{t.date}</p>
            </div>

            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold">{t.venue}</p>
              <p className="text-sm sm:text-base text-white/80 tracking-wide">
                {ADDRESS}
              </p>
            </div>
          </div>

          {/* 말씀 구절 + 스크롤 인디케이터 */}
          <div className="max-w-md mx-auto w-full flex flex-col items-center">
            <div className="text-xs sm:text-sm text-white/70 leading-relaxed space-y-1">
              {t.verse}
            </div>
            <ChevronDown className="mt-4 w-7 h-7 text-white/80 animate-bounce drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]" />
          </div>
        </section>

        {/* 2. 뉴커넥션 소개 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center text-center px-4 py-24 text-white overflow-y-auto">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              {t.aboutLabel}
            </span>
            <h2
              className={
                lang === "ko"
                  ? "text-3xl sm:text-4xl font-bold leading-snug"
                  : "text-2xl sm:text-4xl font-bold leading-snug"
              }
            >
              {t.aboutTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-6">
              {t.aboutBody}
            </p>
          </div>
        </section>

        {/* 3. 공연 순서 (프로그램) */}
        <section className="h-screen snap-start flex flex-col items-center justify-center text-center px-4 py-24 text-white overflow-y-auto">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              {t.programLabel}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
              {t.programTitle}
            </h2>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 sm:p-8 space-y-5">
              <p className="text-sm sm:text-base text-white/70">
                {t.programBody}
              </p>
              <Music2 className="w-7 h-7 mx-auto text-white/70" />
              <div className="flex flex-wrap justify-center gap-3">
                {t.programTeaser.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/25 px-5 py-2 text-xs sm:text-sm text-white/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. 찾아오는 길 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
                {t.directionsLabel}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                {t.directionsTitle}
              </h2>
            </div>

            <div className="rounded-2xl overflow-hidden h-[220px] bg-white/10">
              <iframe
                src={EMBED_MAP_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 space-y-4 text-sm sm:text-base">
              <div>
                <p className="font-semibold">{t.venueLine}</p>
                <p className="text-white/75">{ADDRESS}</p>
              </div>

              {/* 모바일 전용 탭 (Directions / Parking 중 하나씩) */}
              <div className="flex gap-2 sm:hidden">
                <button
                  onClick={() => setInfoTab("directions")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                    infoTab === "directions"
                      ? "bg-white text-[#1c2438]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {t.directionsLabel}
                </button>
                <button
                  onClick={() => setInfoTab("parking")}
                  className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                    infoTab === "parking"
                      ? "bg-white text-[#1c2438]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {t.parkingTitle}
                </button>
              </div>

              {/* 모바일: 아코디언처럼 아래로 펼쳐짐 (위쪽 요소는 안 움직임) */}
              <div className="sm:hidden border-t border-white/15">
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    infoTab === "directions" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-white/80 pt-3">{t.directionsText}</p>
                  </div>
                </div>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    infoTab === "parking" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-white/80 pt-3">{t.parkingAddress}</p>
                    <p className="text-white/80 mt-1">{t.parkingText}</p>
                  </div>
                </div>
              </div>

              {/* 데스크톱: 항상 둘 다 표시 */}
              <div className="hidden sm:block pt-3 border-t border-white/15">
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                  {t.directionsLabel}
                </p>
                <p className="text-white/80">{t.directionsText}</p>
              </div>
              <div className="hidden sm:block pt-3 border-t border-white/15">
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                  {t.parkingTitle}
                </p>
                <p className="text-white/80">{t.parkingAddress}</p>
                <p className="text-white/80 mt-1">{t.parkingText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 이전 뉴커넥션 영상 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center text-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl w-full mx-auto space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              {t.lastYearLabel}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">
              {t.lastYearTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/80">
              {t.lastYearBody}
            </p>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-white/10">
              <iframe
                src="https://www.youtube.com/embed/1bTac_K3464"
                title={t.lastYearTitle}
                className="w-full h-full"
                style={{ border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
