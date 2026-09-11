"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

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
        매년 9월 개강시즌에 열리는 NEW CONNECTION은 하나의 주제로 다양한
        공연과 이야기를 통해 복음을 전하는 커넥트교회의 개강콘서트입니다.
        <br />
        <br />
        올해 함께 나눌 말씀은,
        <br />
        &ldquo;너희가 전에는 어두움이더니 이제는 주 안에서 빛이라 빛의
        자녀들처럼 행하라&rdquo; (엡 5:8)
        <br />
        <br />
        밴드, 댄스, 듀엣, 스킷, 찬양과 메시지로 어둠 가운데 우리를 찾아오신
        빛, 예수 그리스도의 이야기를 나눕니다.
        <br />
        <br />
        교회가 낯선 분도 편안하게 오세요.
        <br />
        2026 NEW CONNECTION에서 만나요!
      </>
    ),
    aboutOutro: (
      <>
        지치고 힘든 세상을 홀로 버텨내며 마음 한구석이 뻥 뚫려버린 당신에게.
        <br />
        세상이 줄 수 없는 따뜻한 위로와 용기가 필요한가요?
        <br />
        상처 입고 길을 잃은 그대여, 잃어버렸던 빛을 되찾고 다시 뜨겁게
        살아갈 용기를 얻게 될 뉴커넥션 콘서트에 당신을 초대합니다.
      </>
    ),
    programLabel: "Program",
    programTitle: "공연 순서",
    programGroups: [
      [
        "BAND - '촛불하나 + 빛으로 비추시네'",
        "DANCE - 'UP UP UP'",
        "DUET SONG - '너 하나만'",
      ],
      [
        "SKIT DRAMA - '마음의 버스'",
        "MESSAGE - 김지연 목사님 (커넥트 교회 담임)",
        "A PHONE CALL FROM GOD",
      ],
      [
        "DANCE - 'NO LONGER SLAVES'",
        "CHOIR - '나를 세상의 빛으로 + LIVING HOPE'",
        "DANCE - 'CHURCH MUSIC'",
      ],
    ],
    programOutro: (
      <>
        어둠 속에 갇혀 혼자 숨죽여 울던 그대에게.
        <br />
        더 이상 참지 않아도, 억지로 버티지 않아도 됩니다.
        <br />
        당신의 지친 마음을 가장 따뜻한 빛으로 가득 채워줄 시간.
        <br />
        뉴커넥션 콘서트로 당신을 초대합니다!
      </>
    ),
    directionsLabel: "Directions",
    directionsTitle: "찾아오는 길",
    venueLine: "토론토 커넥트 교회 @ GYM",
    directionsText:
      "블로어-영(Bloor-Yonge) 전철역 또는 베이(Bay) 전철역에서 한 블럭 북쪽으로 오셔서 Davenport Rd를 만나 45번지를 찾으면 됩니다.",
    parkingTitle: "Parking",
    parkingAddress: "40 Scollard St, Toronto, ON M5R 3S1",
    parkingText:
      "아파트 지하 주차장 입구 판넬의 녹색 버튼을 누르시면 됩니다. 주차장 입구는 건물 뒤 Scollard Street에 있습니다.",
    parkingNote:
      "주차장에 들어오시면 파란색 번호가 표시된 자리에만 주차 가능하고, 최대 10대 정도만 가능해요. 자리가 한정적이니 가능한 일찍 와주시고, 가능하면 도보를 이용해 주세요. 자리가 다 차면 주변에 알아서 주차 부탁드립니다.",
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
        Held every September at the start of the new semester, NEW
        CONNECTION is Connect Church&apos;s welcome-season concert, sharing
        the gospel each year through a different theme.
        <br />
        <br />
        This year&apos;s verse:
        <br />
        &ldquo;For you were once darkness, but now you are light in the
        Lord. Live as children of light.&rdquo; (Eph 5:8)
        <br />
        <br />
        Through band, dance, duet, skit, worship, and message, we share
        the story of the Light who came to find us in the darkness — Jesus
        Christ.
        <br />
        <br />
        Church feels unfamiliar? Come anyway. See you at 2026 NEW
        CONNECTION!
      </>
    ),
    aboutOutro: (
      <>
        To you, who&apos;s been carrying a tired, heavy world alone, with a
        hollow ache in your heart.
        <br />
        Do you need a warmth and courage the world can&apos;t give?
        <br />
        To you who&apos;s been hurt and lost your way — we invite you to
        New Connection, where you&apos;ll find the light you lost, and the
        courage to live fully again.
      </>
    ),
    programLabel: "Program",
    programTitle: "Program",
    programGroups: [
      [
        "BAND - 'Chotbul Hana + Bicheuro Bichusine'",
        "DANCE - 'UP UP UP'",
        "DUET SONG - 'Neo Hanaman'",
      ],
      [
        "SKIT DRAMA - 'Maeumui Beoseu'",
        "MESSAGE - Pastor Jiyeon Kim (Senior Pastor, Connect Church)",
        "A PHONE CALL FROM GOD",
      ],
      [
        "DANCE - 'NO LONGER SLAVES'",
        "CHOIR - 'Nareul Sesangui Bicheuro + LIVING HOPE'",
        "DANCE - 'CHURCH MUSIC'",
      ],
    ],
    programOutro: (
      <>
        To the one who wept quietly, alone in the dark.
        <br />
        You don&apos;t have to hold it in, or keep pushing through anymore.
        <br />
        It&apos;s time to fill your weary heart with the warmest light.
        <br />
        We invite you to the New Connection Concert!
      </>
    ),
    directionsLabel: "Directions",
    directionsTitle: "How to Get Here",
    venueLine: "Toronto Connect Church @ GYM",
    directionsText:
      "From Bloor-Yonge or Bay subway station, walk one block north to Davenport Rd and look for number 45.",
    parkingTitle: "Parking",
    parkingAddress: "40 Scollard St, Toronto, ON M5R 3S1",
    parkingText:
      "Press the green button at the underground parking entrance panel. The entrance is on Scollard Street, behind the building.",
    parkingNote:
      "Once inside, you may only park in spots marked with a blue number — space is limited to about 10 cars. Please arrive early, and walking is recommended if possible. If the lot is full, please find parking nearby on your own.",
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
  const [showParkingPhoto, setShowParkingPhoto] = useState(false);
  const t = content[lang];

  return (
    <div className="relative h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* 헤더 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pb-4 pt-[max(1.75rem,env(safe-area-inset-top,0px)+0.75rem)] sm:px-6 sm:pb-6 sm:pt-10 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center transition-opacity hover:opacity-75"
        >
          <Image
            src="/connect_logo.png"
            alt="Toronto Connect Church"
            width={112}
            height={48}
            className="h-8 w-auto object-contain brightness-0 invert"
            priority
          />
        </Link>

        <button
          onClick={() => setLang(lang === "ko" ? "en" : "ko")}
          className="pointer-events-auto rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 tracking-wide hover:bg-black/55 transition-colors"
        >
          {lang === "ko" ? "ENG" : "KOR"}
        </button>
      </nav>

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
        <section className="relative h-[100dvh] snap-start flex flex-col items-center justify-between text-center px-4 pt-[6.5rem] sm:pt-24 pb-10 text-white overflow-y-auto">
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
        <section className="h-[100dvh] snap-start flex flex-col items-center justify-between text-center px-3 sm:px-6 pt-20 sm:pt-24 pb-10 text-white overflow-y-auto">
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

          {/* TO. 문구 */}
          <div className="max-w-md mx-auto w-full flex flex-col items-center">
            <div className="text-xs sm:text-sm text-white/70 leading-relaxed space-y-1">
              <p className="text-white/50 tracking-[0.2em] uppercase mb-1">To.</p>
              <p>{t.aboutOutro}</p>
            </div>
          </div>
        </section>

        {/* 3. 공연 순서 (프로그램) */}
        <section className="h-[100dvh] snap-start flex flex-col items-center justify-between text-center px-3 sm:px-6 pt-20 sm:pt-24 pb-10 text-white overflow-y-auto">
          <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto w-full space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              {t.programLabel}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
              {t.programTitle}
            </h2>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 sm:p-8 space-y-4 text-left">
              {t.programGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {groupIndex > 0 && (
                    <div className="border-t border-white/15 my-4" />
                  )}
                  <ol className="space-y-2">
                    {group.map((item, itemIndex) => {
                      const num = groupIndex * 3 + itemIndex + 1;
                      return (
                        <li
                          key={item}
                          className="flex gap-3 text-sm sm:text-base text-white/85"
                        >
                          <span className="text-white/50 tabular-nums">
                            {String(num).padStart(2, "0")}
                          </span>
                          <span>{item}</span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          {/* TO. 문구 */}
          <div className="max-w-md mx-auto w-full flex flex-col items-center">
            <div className="text-xs sm:text-sm text-white/70 leading-relaxed space-y-1">
              <p className="text-white/50 tracking-[0.2em] uppercase mb-1">To.</p>
              <p>{t.programOutro}</p>
            </div>
          </div>
        </section>

        {/* 4. 찾아오는 길 */}
        <section className="h-[100dvh] snap-start flex flex-col items-center justify-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
                {t.directionsLabel}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">
                {t.directionsTitle}
              </h2>
            </div>

            <div className="relative rounded-2xl overflow-hidden h-[220px] bg-white/10">
              {/* 데스크톱: 항상 지도 */}
              <div className="hidden sm:block w-full h-full">
                <iframe
                  src={EMBED_MAP_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {/* 모바일: 탭에 따라 지도 / 주차 사진 전환 */}
              <div className="sm:hidden w-full h-full">
                {infoTab === "directions" ? (
                  <iframe
                    src={EMBED_MAP_URL}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <button
                    onClick={() => setShowParkingPhoto(true)}
                    className="relative w-full h-full bg-black/40"
                  >
                    <Image
                      src="/Images/parking_c.webp"
                      alt="파란색 번호가 표시된 주차 자리"
                      fill
                      className="object-contain"
                    />
                    <span className="absolute bottom-1.5 right-2 text-[10px] text-white/70 bg-black/40 rounded-full px-2 py-0.5">
                      확대해서 보기
                    </span>
                  </button>
                )}
              </div>
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
                    <p className="text-white/80 mt-2">{t.parkingNote}</p>
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
                <p className="text-white/80 mt-2">{t.parkingNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 이전 뉴커넥션 영상 */}
        <section className="h-[100dvh] snap-start flex flex-col items-center justify-center text-center px-6 py-24 text-white overflow-y-auto">
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

      {/* 주차 사진 확대 보기 */}
      {showParkingPhoto && (
        <div
          className="fixed inset-0 z-30 bg-black/85 flex items-center justify-center p-6"
          onClick={() => setShowParkingPhoto(false)}
        >
          <button
            onClick={() => setShowParkingPhoto(false)}
            className="absolute top-6 right-6 text-white/90 hover:text-white bg-black/40 rounded-full p-2"
          >
            <X size={20} />
          </button>
          <div className="relative w-full max-w-md aspect-[3/4]">
            <Image
              src="/Images/parking_c.webp"
              alt="파란색 번호가 표시된 주차 자리"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
