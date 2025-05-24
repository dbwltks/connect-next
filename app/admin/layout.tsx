"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Home,
  ChevronRight,
  UserPlus,
  Layout,
} from "lucide-react";
import AdminHeader from "@/components/layout/admin-header";
import HideHeader from "@/components/layout/hide-header";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사용자 정보 가져오기
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // 관리자가 아니면 홈으로 리디렉션
        if (userData.role !== "admin") {
          router.push("/");
        }
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
        router.push("/");
      }
    } else {
      // 로그인하지 않은 경우 로그인 페이지로 리디렉션
      router.push("/sign-in");
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 관리자가 아니면 렌더링하지 않음
  if (!user || user.role !== "admin") {
    return null;
  }

  const navItems = [
    { name: "홈페이지 관리", href: "/admin/homepage", icon: Layout },
    { name: "교인 관리", href: "/admin/members", icon: Users },
    { name: "계정 관리", href: "/admin/accounts", icon: UserPlus },
    { name: "일정 관리", href: "/admin/events", icon: Calendar },
    { name: "공지사항", href: "/admin/announcements", icon: FileText },
    { name: "기도 요청", href: "/admin/prayers", icon: MessageSquare },
    { name: "시스템 설정", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* 기존 헤더와 푸터를 숨김 */}
      <HideHeader />

      {/* 관리자 전용 헤더 */}
      <AdminHeader />

      <div className="flex flex-1">
        {/* 사이드바 - fixed 포지션 적용 */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:h-full md:top-16">
          <div className="flex flex-col flex-grow overflow-y-auto bg-white dark:bg-gray-800 border-r h-full">
            <div className="flex flex-col flex-grow px-4">
              <nav className="flex-1 space-y-1">
                <Link
                  href="/admin"
                  className="flex items-center border-b px-4 py-4 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Home className="h-5 w-5 mr-3" />
                  대시보드
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 - 사이드바 너비만큼 왼쪽 여백 추가 */}
        <div className="flex flex-col flex-1 md:ml-64">
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
