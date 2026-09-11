"use client";

import { Menu, X, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  submenu?: MenuItem[];
}

interface NavbarProps {
  menuItems?: MenuItem[];
}

// 메뉴 설명 자동 생성 함수 (기존 헤더와 동일)
function generateMenuDescription(title: string): string {
  const descriptions: { [key: string]: string } = {
    교회소개: "커넥트 교회를 소개합니다",
    인사말: "담임목사님의 인사말",
    "섬기는 사람들": "교역자와 사역진 소개",
    "예배 및 위치안내": "예배 시간과 교회 위치 안내",
    "예배와 말씀": "주일예배와 말씀 영상",
    "목회 컬럼 / 말씀 묵상": "목회자의 컬럼과 말씀 묵상",
    "BIBLE CONNECT IN": "성경 말씀과 연결되는 시간",
    "찬양과 간증": "찬양과 성도들의 간증",
    교회소식: "교회의 최신 소식과 공지",
    "온라인 주보": "주일 온라인 주보",
    "사진과 커넥트": "교회 활동 사진 갤러리",
    "미디어와 커넥트": "교회 미디어 콘텐츠",
    일정표: "교회 주요 일정 안내",
    "국내 선교": "국내 선교 사역과 활동",
    "국외 선교": "해외 선교 사역과 선교사",
    "협력 단체": "함께하는 협력 단체들",
    뉴커넥션: "2026 뉴커넥션 콘서트",
  };

  return descriptions[title] || "";
}

const NEW_CONNECTION_URL = "/2026newconnection";

function isNewConnectionItem(item: MenuItem) {
  return item.url === NEW_CONNECTION_URL;
}

function NewConnectionLabel({
  isSolidHeader,
  className,
}: {
  isSolidHeader: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "nav-nc-label",
        isSolidHeader ? "nav-nc-label-on-light" : "nav-nc-label-on-dark",
        className,
      )}
    >
      뉴커넥션
    </span>
  );
}

// 고정 메뉴 데이터
const FIXED_MENU_ITEMS: MenuItem[] = [
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
  {
    id: "5",
    title: "뉴커넥션",
    url: "/2026newconnection",
  },
];

export function Navbar({ menuItems = [] }: NavbarProps) {
  // CMS 메뉴 대신 고정 메뉴 사용
  const displayMenuItems = FIXED_MENU_ITEMS;
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile(user);
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openMobileMenu = () => {
    setIsOpen(true);
  };

  const closeMobileMenu = () => {
    if (!isOpen) return;
    if (!isMenuExpanded) {
      setIsOpen(false);
      return;
    }
    setIsMenuExpanded(false);
    window.setTimeout(() => {
      setIsOpen(false);
      setOpenMobileMenus([]);
    }, 320);
  };

  useEffect(() => {
    if (!isOpen) {
      setIsMenuExpanded(false);
      return;
    }

    let innerFrame = 0;
    const frame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setIsMenuExpanded(true));
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(innerFrame);
    };
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMenuExpanded]);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) return;
      const currentScrollPos = window.scrollY;

      // Update scroll background effect
      setIsScrolled(currentScrollPos > 50);

      // Update navbar visibility based on scroll direction
      // Show navbar when scrolling up or at top, hide when scrolling down
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);

      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos, isOpen]);

  const toggleMobileMenu = (menuId: string) => {
    setOpenMobileMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const isSolidHeader = isScrolled || isOpen;

  return (
    <>
      {isOpen &&
        isClient &&
        createPortal(
          <button
            type="button"
            aria-label="메뉴 닫기"
            className={cn(
              "lg:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-md touch-none transition-opacity duration-300 ease-out",
              isMenuExpanded ? "opacity-100" : "opacity-0",
            )}
            onClick={closeMobileMenu}
          />,
          document.body,
        )}

      <nav
        className={cn(
          "fixed top-0 w-full z-[70] sm:p-6 transition-transform duration-500",
          isOpen ? "p-4 lg:p-6 pointer-events-none lg:pointer-events-auto" : "p-4",
          visible || isOpen ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "mx-auto transition-[background-color,box-shadow,border-radius] duration-300 ease-out",
            isOpen
              ? "pointer-events-auto w-full overflow-hidden rounded-[3rem] bg-white/95 backdrop-blur-xl shadow-2xl lg:max-w-7xl lg:rounded-full lg:px-8"
              : isScrolled
                ? "max-w-7xl rounded-full bg-white/95 px-8 shadow-xl backdrop-blur-xl"
                : "max-w-7xl bg-transparent px-4",
          )}
        >
          <div
            className={cn(
              "flex justify-between items-center h-20",
              isOpen && "px-8 lg:px-0",
            )}
          >
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <div className="relative h-16 w-32 overflow-hidden flex items-center">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                width={128}
                height={64}
                className={cn(
                  "object-contain transition-[filter] duration-300",
                  !isSolidHeader && "brightness-0 invert",
                )}
                priority
                style={{ width: "auto", height: "64px" }}
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                {displayMenuItems.map((item) => (
                  <NavigationMenuItem key={item.id} value={`menu-${item.id}`}>
                    {item.submenu && item.submenu.length > 0 ? (
                      <>
                        <NavigationMenuTrigger
                          className={cn(
                            "text-sm font-medium !bg-transparent",
                            isSolidHeader ? "text-black" : "text-gray-300",
                          )}
                        >
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
                                  <div className="font-medium">
                                    {child.title}
                                  </div>
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
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "!bg-transparent text-sm",
                            isNewConnectionItem(item)
                              ? "font-semibold"
                              : "font-medium",
                            isSolidHeader ? "text-black" : "text-gray-300",
                          )}
                        >
                          {isNewConnectionItem(item) ? (
                            <>
                              <NewConnectionLabel
                                isSolidHeader={isSolidHeader}
                              />
                              <span
                                className={cn(
                                  "ml-1.5 text-xs font-normal",
                                  isSolidHeader
                                    ? "text-muted-foreground"
                                    : "text-gray-400",
                                )}
                              >
                                9/24
                              </span>
                            </>
                          ) : (
                            item.title
                          )}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {!isClient ? (
              <Button variant="ghost" size="icon" className="opacity-0">
                <span className="sr-only">로그인</span>
              </Button>
            ) : profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full p-0"
                    disabled={isLoggingOut}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={profile?.avatar_url}
                        alt={profile?.username || "User"}
                      />
                      <AvatarFallback
                        className={cn(
                          isSolidHeader
                            ? "bg-black text-white"
                            : "bg-white text-black",
                        )}
                      >
                        {profile?.username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {profile?.role === "admin" ? "관리자" : "일반 회원"}
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
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>관리자 페이지</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      setIsLoggingOut(true);
                      try {
                        await signOut();
                        window.location.href = "/";
                      } finally {
                        setIsLoggingOut(false);
                      }
                    }}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-red-500 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="https://www.light-code.dev/connect-church/login">
                <button
                  className={cn(
                    "px-8 py-3 rounded-full text-sm uppercase tracking-widest transition-all",
                    isSolidHeader
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-white text-black hover:bg-gray-200",
                  )}
                >
                  Login
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => (isOpen ? closeMobileMenu() : openMobileMenu())}
          >
            {isOpen ? (
              <X
                className={cn(
                  "w-6 h-6",
                  isSolidHeader ? "text-black" : "text-gray-300",
                )}
              />
            ) : (
              <Menu
                className={cn(
                  "w-6 h-6",
                  isSolidHeader ? "text-black" : "text-gray-300",
                )}
              />
            )}
          </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div
              className={cn(
                "lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isMenuExpanded
                  ? "grid-rows-[1fr] opacity-100"
                  : "pointer-events-none grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain px-8 pb-8 space-y-8 text-center">
              {displayMenuItems.map((item) => (
                <div key={item.id}>
                  {item.submenu && item.submenu.length > 0 ? (
                    <div>
                      <button
                        onClick={() => toggleMobileMenu(item.id)}
                        className="relative w-full flex items-center justify-center text-black text-lg font-medium hover:opacity-60 transition-opacity py-1"
                      >
                        <span>{item.title}</span>
                        <ChevronDown
                          className={cn(
                            "absolute right-0 w-5 h-5 transition-transform duration-200",
                            openMobileMenus.includes(item.id) && "rotate-180",
                          )}
                        />
                      </button>
                      {openMobileMenus.includes(item.id) && (
                        <div className="mt-2 space-y-2">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={subItem.url}
                              className="block text-gray-600 text-base hover:text-black transition-colors py-1"
                              onClick={closeMobileMenu}
                            >
                              {subItem.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.url}
                      className={cn(
                        "block text-black text-lg hover:opacity-60 py-1",
                        isNewConnectionItem(item)
                          ? "font-semibold"
                          : "font-medium",
                      )}
                      onClick={closeMobileMenu}
                    >
                      {isNewConnectionItem(item) ? (
                        <>
                          <NewConnectionLabel isSolidHeader />
                          <span className="ml-2 text-base font-normal text-gray-500">
                            9/24
                          </span>
                        </>
                      ) : (
                        item.title
                      )}
                    </Link>
                  )}
                </div>
              ))}

              {/* User Menu in Mobile */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                {profile ? (
                  <>
                    <div className="flex flex-col items-center gap-2 mb-4">
                      <Avatar>
                        <AvatarImage
                          src={profile?.avatar_url}
                          alt={profile?.username || "User"}
                        />
                        <AvatarFallback className="bg-black text-white">
                          {profile?.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-black">
                          {profile.username}
                        </p>
                        <p className="text-xs text-gray-600">
                          {profile?.role === "admin" ? "관리자" : "일반 회원"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/mypage"
                      className="block text-black text-base py-2 hover:opacity-60"
                    onClick={closeMobileMenu}
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/settings"
                    className="block text-black text-base py-2 hover:opacity-60"
                    onClick={closeMobileMenu}
                  >
                    설정
                  </Link>
                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block text-black text-base py-2 hover:opacity-60"
                      onClick={closeMobileMenu}
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      setIsLoggingOut(true);
                      closeMobileMenu();
                        try {
                          await signOut();
                          window.location.href = "/";
                        } finally {
                          setIsLoggingOut(false);
                        }
                      }}
                      disabled={isLoggingOut}
                      className="w-full text-red-500 text-base py-2 hover:opacity-60 disabled:opacity-50"
                    >
                      {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                    </button>
                  </>
                ) : (
                  <Link href="https://www.light-code.dev/connect-church/login">
                    <button
                      className="mx-auto block bg-black text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-gray-800"
                      onClick={closeMobileMenu}
                    >
                      Login
                    </button>
                  </Link>
                )}
              </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
