"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme } from "next-themes";
import { api } from "@/lib/api";
import useSWR from "swr";
import { headerMenuSWRConfig } from "@/config/swr-config";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  sessionExpires?: string;
}

const styles = `
/* 메뉴가 헤더 아래에서 내려오고 올라가도록 수정 */
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.animate-slideDown {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slideUp {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fadeIn {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background-color: hsl(var(--foreground));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
  position: relative;
}

.hamburger-line:first-child {
  margin-bottom: 6px;
}

.hamburger-open .hamburger-line:first-child {
  transform: translateY(4px) rotate(45deg);
}

.hamburger-open .hamburger-line:last-child {
  transform: translateY(-4px) rotate(-45deg);
}
`;

// 모바일 메뉴 열릴 때 body 스크롤 잠금
function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isLocked]);
}

// 하드코딩된 메뉴 아이템
const HARDCODED_MENU_ITEMS = [
  {
    id: "1",
    title: "교회소개",
    url: "/connect/about",
    submenu: [
      { id: "1-1", title: "교회소개", url: "/connect/about" },
      { id: "1-2", title: "인사말", url: "/connect/greeting" },
      { id: "1-3", title: "섬기는 사람들", url: "/connect/people" },
      { id: "1-4", title: "예배 및 위치안내", url: "/connect/church-info" },
    ],
  },
  {
    id: "2",
    title: "하나님과 커넥트",
    url: "/sermons/all-sermons",
    submenu: [
      { id: "2-1", title: "예배와 말씀", url: "/sermons/all-sermons" },
      { id: "2-2", title: "목회 컬럼 / 말씀 묵상", url: "/sermons/pastoral-column" },
      { id: "2-3", title: "BIBLE CONNECT IN", url: "/sermons/bcin" },
      { id: "2-4", title: "찬양과 간증", url: "/sermons/praise" },
    ],
  },
  {
    id: "3",
    title: "성도와 커넥트",
    url: "/connecting/info-board",
    submenu: [
      { id: "3-1", title: "교회소식", url: "/connecting/info-board" },
      { id: "3-2", title: "온라인 주보", url: "/connecting/weekly-bulletin" },
      { id: "3-3", title: "사진과 커넥트", url: "/connecting/in-pictures" },
      { id: "3-4", title: "미디어와 커넥트", url: "/connecting/media" },
      { id: "3-5", title: "일정표", url: "/connecting/calendar" },
    ],
  },
  {
    id: "4",
    title: "세상과 커넥트",
    url: "/mission/domestic-mission",
    submenu: [
      { id: "4-1", title: "국내 선교", url: "/mission/domestic-mission" },
      { id: "4-2", title: "국외 선교", url: "/mission/overseas-mission" },
      { id: "4-3", title: "협력 단체", url: "/mission/cooperating-group" },
    ],
  },
];

export default function Header({
  initialMenus = [],
}: {
  initialMenus?: any[];
}) {
  // auth-context에서 사용자 정보 가져오기
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user);

  // 하드코딩된 메뉴 사용
  const menuItems = HARDCODED_MENU_ITEMS;
  const menuError = null;
  const menuLoading = false;

  // 로딩 중 체크 (메뉴는 즉시 표시, 사용자 UI만 로딩 상태 반영)
  const isAuthLoading = loading;
  const isProfileLoading = profileLoading;

  // 개발 환경에서 로딩 상태 로깅
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Header Loading States:", {
        authLoading: isAuthLoading,
        profileLoading: isProfileLoading,
        menuLoading: menuLoading,
        hasInitialMenus: initialMenus.length > 0,
        hasMenuItems: menuItems?.length > 0,
        menuError: menuError,
      });
    }
  }, [
    isAuthLoading,
    isProfileLoading,
    menuLoading,
    initialMenus.length,
    menuItems?.length,
    menuError,
  ]);

  // 스크롤 동작을 위한 상태 관리
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // 모바일 화면 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // 768px 이하를 모바일로 간주
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 스크롤 위치와 방향에 따라 헤더 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 맨 위에 있는지 확인
      setIsAtTop(currentScrollY < 10);

      // 모바일에서만 스크롤 방향 체크
      if (isMobile) {
        // 맨 위에서는 항상 헤더 표시
        if (currentScrollY < 10) {
          setIsVisible(true);
          setIsScrollingDown(false);
        } else {
          // 스크롤 방향 확인
          if (currentScrollY > lastScrollY.current) {
            // 아래로 스크롤 중
            setIsScrollingDown(true);
            setIsVisible(false);
          } else {
            // 위로 스크롤 중
            setIsScrollingDown(false);
            setIsVisible(true);
          }
        }
      } else {
        // 데스크톱에서는 항상 표시
        setIsVisible(true);
        setIsScrollingDown(false);
      }

      lastScrollY.current = currentScrollY;

      // 비활성 타이머 재설정 (모바일에서만)
      if (isMobile && !isAtTop) {
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }

        // 3초 후 헤더 숨기기 (스크롤이 멈춘 후)
        inactivityTimer.current = setTimeout(() => {
          if (window.scrollY > 10) {
            setIsVisible(false);
          }
        }, 3000);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isMobile, isAtTop]);

  // 모바일에서 fixed 헤더일 때 body padding 조정
  useEffect(() => {
    if (isMobile) {
      document.body.style.paddingTop = "4rem"; // 64px (h-16)
    } else {
      document.body.style.paddingTop = "0";
    }

    return () => {
      document.body.style.paddingTop = "0";
    };
  }, [isMobile]);

  // 헤더 표시 여부 결정
  const shouldShowHeader = !isMobile || isVisible;

  return (
    <header
      className={`${
        isMobile ? "fixed" : "sticky"
      } top-0 z-[10] w-full border-b border-gray-200 dark:border-gray-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        shouldShowHeader
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="xl:container px-4 xl:px-0 flex h-16 items-center">
        <HeaderClient
          user={user}
          profile={profile}
          menuItems={menuItems || []}
          isAuthLoading={isAuthLoading}
          isProfileLoading={isProfileLoading}
          isAtTop={isAtTop}
        />
      </div>
    </header>
  );
}

function HeaderClient({
  user,
  profile,
  menuItems,
  isAuthLoading,
  isProfileLoading,
  isAtTop,
}: {
  user: any;
  profile: any;
  menuItems: any[];
  isAuthLoading?: boolean;
  isProfileLoading?: boolean;
  isAtTop?: boolean;
}) {
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useBodyScrollLock(isMenuOpen);

  // 메뉴 아이템 설명 자동 생성 함수
  function generateMenuDescription(title: string): string {
    const descriptions: { [key: string]: string } = {
      // 교회소개
      교회소개: "커넥트 교회를 소개합니다",
      인사말: "담임목사님의 인사말",
      "섬기는 사람들": "교역자와 사역진 소개",
      "예배 및 위치안내": "예배 시간과 교회 위치 안내",
      
      // 하나님과 커넥트
      "예배와 말씀": "주일예배와 말씀 영상",
      "목회 컬럼 / 말씀 묵상": "목회자의 컬럼과 말씀 묵상",
      "BIBLE CONNECT IN": "성경 말씀과 연결되는 시간",
      "찬양과 간증": "찬양과 성도들의 간증",
      
      // 성도와 커넥트
      교회소식: "교회의 최신 소식과 공지",
      "온라인 주보": "주일 온라인 주보",
      "사진과 커넥트": "교회 활동 사진 갤러리",
      "미디어와 커넥트": "교회 미디어 콘텐츠",
      일정표: "교회 주요 일정 안내",
      
      // 세상과 커넥트
      "국내 선교": "국내 선교 사역과 활동",
      "국외 선교": "해외 선교 사역과 선교사",
      "협력 단체": "함께하는 협력 단체들",
    };

    return descriptions[title] || "";
  }

  // NavigationMenu를 사용하여 호버 기능과 인디케이터 제공
  function renderNavigationMenu(items: any[]) {
    return (
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          {items.map((item: any) => (
            <NavigationMenuItem key={item.id}>
              {item.submenu && item.submenu.length > 0 ? (
                <>
                  <NavigationMenuTrigger className="text-sm font-medium xl:text-base !bg-transparent">
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="flex flex-col w-[300px] gap-1">
                      {item.submenu.map((child: any) => (
                        <NavigationMenuLink key={child.id} asChild>
                          <Link
                            href={child.url || "#"}
                            className="block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="font-medium">{child.title}</div>
                            <p className="text-xs leading-snug text-muted-foreground mt-1">
                              {child.description ||
                                generateMenuDescription(child.title)}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink asChild>
                  <Link
                    href={item.url || "#"}
                    className={`${navigationMenuTriggerStyle()} !bg-transparent`}
                  >
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  useEffect(() => {
    if (!document.getElementById("hamburger-eq-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "hamburger-eq-styles";
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById("header-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "header-styles";
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }

    return () => {
      const styleSheet = document.getElementById("header-styles");
      if (styleSheet && document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // 하이드레이션 오류를 피하기 위한 클라이언트 사이드 코드 실행 상태 관리
  const [isClient, setIsClient] = useState(false);

  // 콤포넌트가 마운트된 후 클라이언트 상태로 설정
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {/* 데스크톱 헤더 - md 이상에서 표시 */}
      <div className="hidden lg:flex items-center ">
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
                style={{ width: 128, height: "auto" }}
              />
            </div>
          </Link>
        </div>
      </div>

      {/* 모바일 헤더 - md 미만에서 표시 */}
      <div className="flex items-center w-full h-16 lg:hidden">
        {/* 좌측 햄버거 메뉴 - 고정 너비/높이, 중앙 정렬 */}
        <div className="w-[56px] h-16 flex justify-center items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle Menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            <span className="relative w-6 h-6 flex items-center justify-center">
              <span
                className={`absolute left-0 w-6 h-0.5 rounded bg-gray-800 dark:bg-gray-100 transition-all duration-400
                  ${isMenuOpen ? "top-3 rotate-45" : "top-2"}`}
              />
              <span
                className={`absolute left-0 w-6 h-0.5 rounded bg-gray-800 dark:bg-gray-100 transition-all duration-400
                  ${isMenuOpen ? "top-3 -rotate-45" : "top-4"}`}
              />
            </span>
          </Button>
        </div>

        {/* 중앙 로고 - flex-1로 남은 공간 차지 */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <div className="relative h-12 overflow-hidden flex items-center justify-center">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                width={96}
                height={96}
                className="object-contain"
                priority
                style={{ width: 96, height: "auto" }}
              />
            </div>
          </Link>
        </div>

        {/* 우측 로그인/사용자 메뉴 - 고정 너비 적용 */}
        <div className="w-[56px] flex justify-center">
          {!isClient || isAuthLoading ? (
            // 서버에서는 일관된 불투명 버튼을 렌더링
            <Button variant="ghost" size="icon" className="opacity-0">
              <span className="sr-only">로그인</span>
            </Button>
          ) : profile ? (
            // 클라이언트에서 사용자 정보가 있으면 UserMenu 렌더링
            <UserMenu
              user={profile}
              onLogout={async () => {
                setIsLoggingOut(true);
                try {
                  await signOut();
                  window.location.href = "/";
                } finally {
                  setIsLoggingOut(false);
                }
              }}
              isLoggingOut={isLoggingOut}
            />
          ) : (
            // 클라이언트에서 사용자 정보가 없으면 로그인 버튼 렌더링
            <Link href="https://www.light-code.dev/connect-church/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 데스크톱 메뉴 */}
      <nav className="hidden flex-1 items-center justify-center lg:flex overflow-visible">
        {renderNavigationMenu(menuItems)}
      </nav>

      {/* 데스크톱 우측 메뉴 */}
      <div className="hidden lg:flex items-center gap-2">
        <ThemeSwitcher />
        {/* SSR과 CSR 불일치 문제를 해결하기 위해 클라이언트 상태 확인 후 렌더링 */}
        {!isClient || isAuthLoading ? (
          // 서버에서는 일관된 불투명 버튼을 렌더링하거나 로딩 중
          <Button variant="ghost" size="icon" className="opacity-0">
            <span className="sr-only">로그인</span>
          </Button>
        ) : profile ? (
          // 클라이언트에서 사용자 정보가 있으면 UserMenu 렌더링
          <UserMenu
            user={profile}
            onLogout={async () => {
              setIsLoggingOut(true);
              try {
                await signOut();
                window.location.href = "/";
              } finally {
                setIsLoggingOut(false);
              }
            }}
            isLoggingOut={isLoggingOut}
          />
        ) : (
          // 클라이언트에서 사용자 정보가 없으면 로그인 버튼 렌더링
          <Link href="https://www.light-code.dev/connect-church/login">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </Link>
        )}
      </div>

      {/* 모바일 메뉴 (Portal로 렌더링하여 DOM 트리와 분리) */}
      {isClient &&
        createPortal(
          <div
            className={`fixed top-[4rem] left-0 right-0 bottom-0 z-[8] bg-background px-8 pt-4
            h-auto min-h-0 max-h-full overflow-y-auto transition-all duration-700
            ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}
          `}
            style={{ willChange: "opacity, max-height, transform" }}
          >
            <ul className="space-y-4">
              {menuItems.map((item: any, idx: number) => (
                <li key={item.id + idx}>
                  <div className="flex items-center justify-between">
                    {item.submenu && item.submenu.length > 0 ? (
                      <button
                        className="flex items-center w-full text-xl pt-4 pb-2 text-left focus:outline-none"
                        onClick={() => {
                          setOpenSubmenus((prev) => ({
                            ...prev,
                            [item.title]: !prev[item.title],
                          }));
                        }}
                      >
                        <span className="flex-1 text-left">{item.title}</span>
                        <ChevronDown
                          className={`w-6 h-6 ml-2 transition-transform duration-200 ${
                            openSubmenus[item.title]
                              ? "rotate-180 text-primary"
                              : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.url}
                        className="flex items-center w-full text-xl pt-4 pb-2 text-left focus:outline-none"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="flex-1 text-left">{item.title}</span>
                      </Link>
                    )}
                  </div>
                  {item.submenu && item.submenu.length > 0 && (
                    <div
                      className={`overflow-hidden transition-all duration-700 ${
                        openSubmenus[item.title]
                          ? "max-h-60 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <ul className="pl-4">
                        {item.submenu.map((child: any, subIdx: number) => (
                          <li key={child.id + subIdx}>
                            <Link
                              href={child.url}
                              className="block text-base py-2 text-gray-700 dark:text-gray-300 hover:font-semibold"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8 space-y-6 pb-8">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">테마</span>
                <div className="relative z-[150]">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {theme === "light" ? (
                          <Sun size={16} className="text-muted-foreground" />
                        ) : theme === "dark" ? (
                          <Moon size={16} className="text-muted-foreground" />
                        ) : (
                          <Laptop size={16} className="text-muted-foreground" />
                        )}
                        <span className="text-sm">테마 변경</span>
                        <ChevronDown
                          size={16}
                          className="text-muted-foreground"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] bg-background shadow-xl rounded-lg z-[208]"
                    >
                      <DropdownMenuRadioGroup
                        value={theme}
                        onValueChange={setTheme}
                      >
                        <DropdownMenuRadioItem
                          value="light"
                          className="flex gap-2 py-3"
                        >
                          <Sun size={16} className="text-muted-foreground" />
                          <span>라이트</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="dark"
                          className="flex gap-2 py-3"
                        >
                          <Moon size={16} className="text-muted-foreground" />
                          <span>다크</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="system"
                          className="flex gap-2 py-3"
                        >
                          <Laptop size={16} className="text-muted-foreground" />
                          <span>시스템</span>
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {profile ? (
                <>
                  <Link
                    href="/mypage"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium pb-2"
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-base font-medium pb-2"
                  >
                    설정
                  </Link>
                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-base font-medium pb-2"
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setIsLoggingOut(true);
                      setIsMenuOpen(false);
                      try {
                        await signOut();
                        window.location.href = "/";
                      } finally {
                        setIsLoggingOut(false);
                      }
                    }}
                    disabled={isLoggingOut}
                    className="block text-base font-medium text-red-500 dark:text-red-400 pb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                  </button>
                </>
              ) : (
                <Link
                  href="https://www.light-code.dev/connect-church/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-base font-medium pb-6"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* 오버레이: 메뉴가 완전히 열렸을 때만 렌더링 */}
      {isClient &&
        isMenuOpen &&
        createPortal(
          <div
            className="fixed top-[4rem] left-0 right-0 bottom-0 bg-black/50 z-[7] opacity-100 transition-opacity duration-700"
            onClick={() => setIsMenuOpen(false)}
          />,
          document.body
        )}
    </>
  );
}

// 사용자 메뉴 컴포넌트
function UserMenu({
  user,
  onLogout,
  isLoggingOut,
}: {
  user: any;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
          disabled={isLoggingOut}
        >
          <Avatar>
            <AvatarImage
              src={user?.avatar_url}
              alt={user?.username || "User"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">
              {user?.role === "admin" ? "관리자" : "일반 회원"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/mypage" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>마이페이지</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>설정</span>
          </Link>
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-4 w-4"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 2.5 2.5 0 0 0 1.98 3A2.5 2.5 0 0 0 12 16.5a2.5 2.5 0 0 0 3.64-2.2 2.5 2.5 0 0 0 1.98-3A2.5 2.5 0 0 0 16.3 7.02a2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5Z" />
                <path d="M12 12v-1.5" />
              </svg>
              <span>관리자 페이지</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-500 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 메인 메뉴 컴포넌트
function MainMenu({ items }: { items: any[] }) {
  return (
    <ul className="flex space-x-1">
      {items.map((item, index: any) => (
        <li
          key={`${item.href}-${item.title}-${index}`}
          className="relative group"
        >
          {item.children.length > 0 ? (
            <div className="relative group">
              <Button
                variant="ghost"
                className="h-10 flex items-center gap-1 group-hover:bg-accent"
                asChild
              >
                <Link href={item.href} className="flex items-center gap-1">
                  {item.title}
                  <ChevronDown className="h-4 w-4" />
                </Link>
              </Button>
              <div className="absolute left-0 top-full z-[250] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 hidden group-hover:block">
                <div className="w-48 py-1">
                  {item.children.map((subItem: any, subIndex: number) => (
                    <Link
                      key={`${subItem.href}-${subItem.title}-${subIndex}`}
                      href={subItem.href}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground block w-full text-left"
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Button variant="ghost" asChild className="h-10">
              <Link href={item.href}>{item.title}</Link>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
