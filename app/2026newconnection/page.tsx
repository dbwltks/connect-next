import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 뉴커넥션 콘서트 | Toronto Connect Church",
  description:
    "2026. Sep. 24 (Thu) 7:30 PM, 토론토 커넥트 교회 GYM에서 열리는 뉴커넥션 콘서트에 초대합니다.",
};

const ADDRESS = "45 Davenport Rd, Toronto, ON (M5R 1H2)";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=45+Davenport+Rd+Toronto+ON+M5R+1H2";
const EMBED_MAP_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2885.601550917232!2d-79.3916297232777!3d43.6730595515324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b34a6feddf98d%3A0x7d6c6e75a3de3e0!2s45%20Davenport%20Rd%2C%20Toronto%2C%20ON%20M5R%201H2!5e0!3m2!1sko!2sca!4v1703350000000!5m2!1sko!2sca";

export default function NewConnection2026Page() {
  return (
    <div className="relative h-screen overflow-y-scroll snap-y snap-mandatory">
      {/* 고정 배경: 스크롤해도 그대로 유지됨 (모바일/데스크톱 이미지 분리) */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Images/2026newconnection_back.webp"
          alt=""
          fill
          priority
          className="object-contain sm:hidden"
        />
        <Image
          src="/Images/2026newconnection_deskback.webp"
          alt=""
          fill
          priority
          className="hidden sm:block object-cover"
        />
      </div>

      <main className="relative z-10">
        {/* 1. 메인 */}
        <section className="h-screen snap-start flex flex-col items-center justify-between text-center px-6 pt-28 sm:pt-32 pb-10 text-white overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              빛을 잃어버린지도 몰랐던 당신의 삶을
              <br />
              환히 밝혀 줄 가장 눈부신 선물이 찾아옵니다!
            </p>

            <div className="space-y-2">
              <h1
                className="gothic-a1-thin text-[clamp(3rem,12vw,5rem)] leading-[1.2] tracking-wide"
                style={{
                  textShadow: "0 0 12px rgba(255,255,255,0.6)",
                }}
              >
                뉴커넥션
                <br />
                콘서트
              </h1>

              <p className="text-xl sm:text-2xl font-bold">
                2026. Sep. 24 (Thu) 7:30 pm
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold">
                토론토 커넥트 교회 @ GYM
              </p>
              <p className="text-sm sm:text-base text-white/80 tracking-wide">
                {ADDRESS}
              </p>
            </div>
          </div>

          {/* 말씀 구절 */}
          <div className="max-w-sm mx-auto text-xs sm:text-sm text-white/70 leading-relaxed space-y-1">
            <p>
              너희가 전에는 어둠이더니 이제는 주 안에서 빛이라 빛의 자녀들처럼
              행하라 (엡 5:8)
            </p>
            <p>For you were once darkness, but now you are light in the Lord.</p>
            <p>Live as children of light (Ephesians 5:8)</p>
          </div>
        </section>

        {/* 2. 뉴커넥션 소개 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center text-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              About New Connection
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
              뉴커넥션이란?
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              뉴커넥션은 아직 교회가 낯선 분들, 새로운 만남을 기다리는 분들을
              위해 커넥트 교회가 준비한 초청 콘서트입니다.
              <br />
              <br />
              음악과 이야기를 통해 잠시 삶을 멈추고, 우리를 향한 빛 되신 분을
              만나는 시간이 되기를 바랍니다.
              <br />
              <br />
              혼자여도 괜찮아요. 편안한 마음으로 오세요.
            </p>
          </div>
        </section>

        {/* 3. 찾아오는 길 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
                Directions
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold">찾아오는 길</h2>
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

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 space-y-4 text-sm sm:text-base">
              <div>
                <p className="font-semibold">토론토 커넥트 교회 @ GYM</p>
                <p className="text-white/75">{ADDRESS}</p>
              </div>
              <div className="pt-3 border-t border-white/15">
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                  Directions
                </p>
                <p className="text-white/80">
                  블로어-영(Bloor-Yonge) 전철역 또는 베이(Bay) 전철역에서 한
                  블럭 북쪽으로 오셔서 Davenport Rd를 만나 45번지를 찾으면
                  됩니다.
                </p>
              </div>
              <div className="pt-3 border-t border-white/15">
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                  Parking
                </p>
                <p className="text-white/80">40 Scollard St, Toronto, ON M5R 3S1</p>
                <p className="text-white/80 mt-1">
                  아파트 지하 주차장 입구 판넬의 녹색 버튼을 누르시면 됩니다.
                  주차장 입구는 건물 뒤 Scollard Street에 있습니다.
                </p>
              </div>
            </div>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center rounded-full bg-white text-[#1c2438] font-semibold py-3 hover:bg-white/90 transition-colors"
            >
              지도에서 길찾기
            </a>
          </div>
        </section>

        {/* 4. 이전 뉴커넥션 영상 */}
        <section className="h-screen snap-start flex flex-col items-center justify-center text-center px-6 py-24 text-white overflow-y-auto">
          <div className="max-w-md mx-auto w-full space-y-6">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/60 uppercase">
              Last Year
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">지난 뉴커넥션</h2>
            <p className="text-sm sm:text-base text-white/80">
              작년 뉴커넥션의 순간들을 영상으로 만나보세요.
            </p>

            {/* TODO: 실제 유튜브 영상 ID로 교체 필요 */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center text-white/50 text-sm">
              영상 준비 중입니다
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
