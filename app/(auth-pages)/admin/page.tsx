"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MainBanner from "@/components/home/main-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Calendar, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login?redirect=/(auth-pages)/admin");
    } else if (user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null; // 또는 로딩/권한없음 UI
  }

  const stats = [
    {
      title: "교인 관리",
      description: "교인 정보 관리 및 조회",
      icon: Users,
      href: "/admin/members",
      color: "bg-blue-500",
    },
    {
      title: "일정 관리",
      description: "교회 일정 및 행사 관리",
      icon: Calendar,
      href: "/admin/events",
      color: "bg-green-500",
    },
    {
      title: "공지사항",
      description: "교회 공지사항 관리",
      icon: FileText,
      href: "/admin/announcements",
      color: "bg-purple-500",
    },
    {
      title: "기도 요청",
      description: "기도 요청 관리 및 응답",
      icon: MessageSquare,
      href: "/admin/prayers",
      color: "bg-orange-500",
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            교회 관리 시스템에 오신 것을 환영합니다. 아래 메뉴에서 관리할 항목을
            선택하세요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-lg font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-full text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{stat.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
