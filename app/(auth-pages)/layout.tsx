"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // user가 undefined인 경우는 초기 로딩 중이므로 리다이렉션하지 않음
    // user가 null인 경우(비로그인)에만 리다이렉션
    if (user === null) {
      console.log("AuthPagesLayout - No user, redirecting to login");
      router.push("/login");
    }
  }, [user, router]);

  // 초기 로딩 중(user가 undefined)에는 로딩 화면 표시
  if (user === undefined) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;
  }

  // 비로그인 상태(user가 null)인 경우 아무것도 표시하지 않음
  if (user === null) {
    return null;
  }

  return <Suspense fallback={null}>{children}</Suspense>;
}
