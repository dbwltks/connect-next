"use client";

import Link from "next/link";
import { IWidget } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface LoginWidgetProps {
  widget: IWidget;
}

export default function LoginWidget({ widget }: LoginWidgetProps) {
  const { user, signOut } = useAuth();
  
  const displayName = (user as any)?.username || "사용자";

  // user가 undefined면 로딩 상태
  if (user === undefined) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gray-50/70 dark:bg-gray-800/70 border border-gray-200/50 dark:border-gray-700/50">
      {user ? (
        // Logged-in state
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={(user as any).avatar_url}
                alt={displayName}
              />
              <AvatarFallback>
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {widget.display_options?.logged_in_title || "님, 환영합니다!"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700" asChild>
              <Link href="/mypage">마이페이지</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 dark:text-white dark:hover:bg-gray-700"
              onClick={signOut}
            >
              로그아웃
            </Button>
          </div>
        </div>
      ) : (
        // Logged-out state
        <div className="space-y-3 text-center">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {widget.title || "로그인"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
            {widget.display_options?.logged_out_title ||
              "로그인하고 모든 서비스를 이용하세요."}
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <Button size="sm" className="dark:bg-blue-600 dark:hover:bg-blue-700" asChild>
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                로그인
              </Link>
            </Button>
            <Button size="sm" variant="ghost" className="dark:text-white dark:hover:bg-gray-700" asChild>
              <Link href="/register">회원가입</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
