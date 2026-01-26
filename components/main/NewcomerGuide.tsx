"use client";

import { Church, UserPlus, BookOpen, Users } from "lucide-react";

export function NewcomerGuide() {
  const handleScrollToWelcome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const welcomeSection = document.getElementById("welcome");

    if (welcomeSection) {
      welcomeSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const steps = [
    {
      number: "01",
      icon: Church,
      title: "교회 방문",
      description: "예배와 모임은 누구에게나 열려 있습니다",
    },
    {
      number: "02",
      icon: UserPlus,
      title: "새가족 등록",
      description: "따뜻한 환영과 함께 시작하세요",
    },
    {
      number: "03",
      icon: BookOpen,
      title: "교육 (4주)",
      description: "신앙의 기초를 함께 배워갑니다",
    },
    {
      number: "04",
      icon: Users,
      title: "공동체(셀) 배정",
      description: "함께 성장하는 가족을 만나세요",
    },
  ];

  return (
    <section id="newcomer-guide" className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto sm:px-6 px-0">
        <div className="text-center mb-16">
          <span className="text-sm uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
            Welcome
          </span>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium leading-[1.1] mt-6 mb-4 tracking-tight text-black dark:text-white">
            처음 방문하셨나요?
          </h2>
          <p className="text-sm sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            환영합니다! 커넥트 교회는 언제나 열려 있습니다.
            <br />
            새가족으로 등록하시고 따뜻한 공동체를 경험해보세요.
          </p>
        </div>

        {/* Progress Bar Steps */}
        <div className="py-6">
          {/* Progress Bar Container */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-5 md:top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {/* Steps */}
            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4 relative">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === steps.length - 1;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center relative"
                  >
                    {/* Progress Node */}
                    <div className="relative z-10 mb-3 md:mb-6">
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-lg">
                        <Icon
                          className="w-5 h-5 md:w-7 md:h-7 text-white dark:text-black"
                          strokeWidth={2}
                        />
                      </div>
                      {/* Step Number Badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 md:w-7 md:h-7 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] md:text-sm font-bold text-white dark:text-black">
                          {step.number}
                        </span>
                      </div>
                    </div>

                    {/* Progress Line */}
                    {!isLast && (
                      <div className="absolute top-5 md:top-6 left-[50%] w-full h-0.5 bg-black dark:bg-white z-0"></div>
                    )}

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-xs md:text-base lg:text-lg font-semibold text-black dark:text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="hidden md:block text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-16 text-center">
          <a href="#welcome" onClick={handleScrollToWelcome}>
            <button className="px-12 font-medium py-5 border-2 rounded-2xl border-black dark:border-white text-black dark:text-white text-sm uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
              새가족 등록하기
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
