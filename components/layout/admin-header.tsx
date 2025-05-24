"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  LogOut,
  Home,
  Settings,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Menu,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminHeader() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // localStorage 또는 sessionStorage에서 사용자 정보 가져오기
    function getUser() {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
        }
      }
    }

    getUser();

    // 스토리지 변경 이벤트 리스너 추가
    const handleStorageChange = () => {
      getUser();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const navItems = [
    { name: "교인 관리", href: "/admin/members", icon: Users },
    { name: "계정 관리", href: "/admin/accounts", icon: UserPlus },
    { name: "일정 관리", href: "/admin/events", icon: Calendar },
    { name: "공지사항", href: "/admin/announcements", icon: FileText },
    { name: "기도 요청", href: "/admin/prayers", icon: MessageSquare },
    { name: "시스템 설정", href: "/admin/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-800 shadow-sm">
      {/* 데스크톱 헤더 - md 이상에서 표시 */}
      <div className="container hidden md:flex h-16 items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative h-16 overflow-hidden flex items-center justify-center">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                width={128}
                height={128}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* 상단에 메뉴 제거 */}

        {/* 오른쪽 메뉴 */}
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar>
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">관리자</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>홈페이지</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("user");
                    router.push("/");
                    window.location.reload();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 모바일 헤더 - md 미만에서 표시 */}
      <div className="container flex md:hidden justify-between items-center h-16 w-full">
        {/* 왼쪽 - 사이드바 토글 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle Mobile Menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* 가운데 - 로고 */}
        <div className="flex items-center justify-center">
          <Link href="/admin" className="flex items-center">
            <div className="relative h-12 overflow-hidden flex items-center justify-center">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* 오른쪽 - 아바타 */}
        <div className="flex items-center justify-center">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar>
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.username?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">관리자</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>홈페이지</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("user");
                    router.push("/");
                    window.location.reload();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 w-64 h-full overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Connect Church</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link 
                        href={item.href}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
