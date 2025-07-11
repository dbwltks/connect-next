"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user } = useAuth();

  // 로딩 중일 때는 로딩 인디케이터 표시
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // 로그인되지 않은 사용자는 로그인 페이지로 리디렉션
  if (user === null) {
    router.replace('/login');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
