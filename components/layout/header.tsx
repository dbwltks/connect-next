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
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/db";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import useSWR from "swr";

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  sessionExpires?: string;
}

// 메뉴 데이터 fetcher
const fetchMenuItems = async () => {
  const { data, error } = await supabase
    .from("cms_menus")
    .select("*")
    .eq("is_active", true)
    .order("order_num", { ascending: true });

  if (error) throw error;

  // 메뉴 트리 구조 만들기
  const menuItemsRaw = data || [];
  const rootItems = menuItemsRaw.filter((item) => item.parent_id === null);
  
  function findChildren(parentId: string, items: any[]): any[] {
    const children = items.filter((item) => item.parent_id === parentId);
    return children.map((child) => ({
      ...child,
      submenu: findChildren(child.id, items),
    }));
  }

  return rootItems.map((item) => ({
    ...item,
    submenu: findChildren(item.id, menuItemsRaw),
  }));
};

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

export default function Header({ menuItems: initialMenuItems }: { menuItems?: any[] }) {
  const { user } = useAuth();
  
  // SWR로 메뉴 데이터 가져오기
  const { data: menuItems, error, isLoading } = useSWR(
    "header-menu-items",
    fetchMenuItems,
    {
      fallbackData: initialMenuItems, // 서버에서 전달받은 초기 데이터 사용
      refreshInterval: 300000, // 5분마다 갱신
    }
  );

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading && !menuItems) {
    return (
      <header className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="xl:container px-4 xl:px-0 flex h-16 items-center">
          <div className="flex items-center gap-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">메뉴 로딩중...</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="xl:container px-4 xl:px-0 flex h-16 items-center">
        <HeaderClient user={user} menuItems={menuItems || []} />
      </div>
    </header>
  );
}

function HeaderClient({ user, menuItems }: { user: any; menuItems: any[] }) {
  const { handleLogout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  // 모바일 메뉴 열릴 때 body 스크롤 잠금
  useBodyScrollLock(isMenuOpen);

  // 트리 구조 메뉴 렌더링 함수
  function renderMenu(items: any[]) {
    return (
      <ul className="flex gap-4 xl:gap-8 items-center">
        {items.map((item: any, idx: number) => (
          <li key={item.id} className="relative group" style={{ minWidth: 80 }}>
            {item.url ? (
              <Link
                href={item.url}
                className="px-2 py-1 text-sm font-medium xl:text-base text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 block"
              >
                {item.title}
              </Link>
            ) : (
              <span className="px-2 py-1 text-base text-gray-800 dark:text-gray-100 block">
                {item.title}
              </span>
            )}
            {item.submenu && item.submenu.length > 0 && (
              <ul className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white dark:bg-gray-900 shadow-lg rounded-lg py-2 min-w-[180px] border border-gray-100 dark:border-gray-800">
                  {item.submenu.map((child: any, subIdx: number) => (
                    <li key={child.id + subIdx}>
                      {child.url ? (
                        <Link
                          href={child.url}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150"
                        >
                          {child.title}
                        </Link>
                      ) : (
                        <span className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {child.title}
                        </span>
                      )}
                    </li>
                  ))}
                </div>
              </ul>
            )}
          </li>
        ))}
      </ul>
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
      <div className="hidden md:flex items-center ">
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
      <div className="flex items-center w-full h-16 md:hidden">
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
        <div className="w-[70px] flex justify-end">
          {!isClient ? (
            // 서버에서는 일관된 불투명 버튼을 렌더링
            <Button variant="ghost" size="icon" className="opacity-0">
              <span className="sr-only">로그인</span>
            </Button>
          ) : user ? (
            // 클라이언트에서 사용자 정보가 있으면 UserMenu 렌더링
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            // 클라이언트에서 사용자 정보가 없으면 로그인 버튼 렌더링
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 데스크톱 메뉴 */}
      <nav className="hidden flex-1 items-center justify-center md:flex overflow-visible">
        {renderMenu(menuItems)}
      </nav>

      {/* 데스크톱 우측 메뉴 */}
      <div className="hidden md:flex items-center gap-2">
        <ThemeSwitcher />
        {/* SSR과 CSR 불일치 문제를 해결하기 위해 클라이언트 상태 확인 후 렌더링 */}
        {!isClient ? (
          // 서버에서는 일관된 불투명 버튼을 렌더링
          <Button variant="ghost" size="icon" className="opacity-0">
            <span className="sr-only">로그인</span>
          </Button>
        ) : user ? (
          // 클라이언트에서 사용자 정보가 있으면 UserMenu 렌더링
          <UserMenu user={user} onLogout={handleLogout} />
        ) : (
          // 클라이언트에서 사용자 정보가 없으면 로그인 버튼 렌더링
          <Link href="/login">
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

            <div className="mt-12 border-t pt-8 space-y-6 pb-8">
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
              {user ? (
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
                  {user.role?.toLowerCase() === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-base font-medium pb-2"
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block text-base font-medium text-red-500 dark:text-red-400 pb-6"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
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
function UserMenu({ user, onLogout }: { user: any; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
        >
          <Avatar>
            <AvatarImage src={user.avatar_url || ""} alt={user.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">
              {user.role?.toLowerCase() === "admin" ? "관리자" : "일반 회원"}
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
        {user.role?.toLowerCase() === "admin" && (
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
          className="cursor-pointer text-red-500 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 메인 메뉴 컴포넌트
function MainMenu({ items }: { items: any[] }) {
  return (
    <ul className="flex space-x-1">
      {items.map((item, index) => (
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
