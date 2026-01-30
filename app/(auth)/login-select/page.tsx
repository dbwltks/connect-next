"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function LoginSelectPage() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/30 px-4 sm:px-6">
      {/* 로고 */}
      <div className="flex justify-center mb-4">
        <Link href="/" className="flex items-center">
          <div className="relative h-20 w-40">
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
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          로그인
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
          이용하실 서비스를 선택해주세요
        </p>
      </div>

      {/* 로그인 방식 선택 카드 */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-3 sm:gap-6 w-full max-w-[600px] md:max-w-[900px]">
        {/* 홈페이지 로그인 */}
        <Link
          href="/login"
          className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
        >
          <div className="p-4 sm:p-8">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  홈페이지 로그인
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Website Login
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center group-hover:bg-blue-500 dark:group-hover:bg-blue-500 transition-colors">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
              </div>
            </div>

            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-6">
              커넥트 교회 홈페이지 전용 계정으로 로그인합니다
            </p>

            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 mr-2 sm:mr-3"></div>
                게시글 작성 및 댓글
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3"></div>
                교회 소식 참여
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-3"></div>
                커뮤니티 활동
              </div>
            </div>
          </div>
        </Link>

        {/* 플랫폼 로그인 */}
        <a
          href="https://www.light-code.dev/connect-church/login"
          className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500"
        >
          <div className="p-4 sm:p-8">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  플랫폼 로그인
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Platform Login
                </p>
              </div>
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center group-hover:bg-purple-500 dark:group-hover:bg-purple-500 transition-colors">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400 group-hover:text-white dark:group-hover:text-white transition-colors" />
              </div>
            </div>

            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-6">
              커넥트 플랫폼 통합 계정으로 로그인합니다
            </p>

            <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500 mr-2 sm:mr-3"></div>
                플랫폼 관리 기능
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-3"></div>
                확장된 도구 및 서비스
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-3"></div>
                통합 운영 시스템
              </div>
            </div>
          </div>
        </a>
      </div>

      {/* 추가 안내 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
