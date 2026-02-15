"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function LoginSelectPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white px-4 sm:px-6">
      {/* Content */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* 로고 */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <Link href="/" className="flex items-center">
            <div className="relative h-16 w-32 sm:h-20 sm:w-40">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* 제목 */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-4 sm:mb-6">
            로그인
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600">
            이용하실 서비스를 선택해주세요
          </p>
        </div>

        {/* 로그인 방식 선택 카드 */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-[600px] md:max-w-[1000px]">
          {/* 플랫폼 로그인 */}
          <a
            href="https://www.light-code.dev/connect-church/login"
            className="group relative bg-white rounded-2xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-purple-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-6 sm:p-10">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2 sm:mb-3">
                    플랫폼 로그인
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Platform Login
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-500 transition-all duration-300">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </div>

              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8">
                교회 프로그램 신청 및 개인 신앙생활 관리
              </p>

              <div className="space-y-3 sm:space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm sm:text-base text-gray-700">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 mr-3 sm:mr-4"></div>
                  교회 프로그램 신청
                </div>
                <div className="hidden sm:flex items-center text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-4"></div>
                  나의 프로그램 관리
                </div>
                <div className="hidden sm:flex items-center text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-4"></div>
                  기도제목 및 신앙생활
                </div>
              </div>
            </div>
          </a>

          {/* 홈페이지 로그인 */}
          <Link
            href="/login"
            className="group relative bg-white rounded-2xl hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-blue-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative p-6 sm:p-10">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2 sm:mb-3">
                    홈페이지 로그인
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500">
                    Website Login
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-500 transition-all duration-300">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </div>

              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8">
                커넥트 교회 홈페이지 전용 계정으로 로그인합니다
              </p>

              <div className="space-y-3 sm:space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center text-sm sm:text-base text-gray-700">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 mr-3 sm:mr-4"></div>
                  게시글 작성 및 댓글
                </div>
                <div className="hidden sm:flex items-center text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-4"></div>
                  교회 소식 참여
                </div>
                <div className="hidden sm:flex items-center text-base text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-4"></div>
                  커뮤니티 활동
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 추가 안내 */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
