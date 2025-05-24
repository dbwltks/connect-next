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
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Menu, X, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/db";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  sessionExpires?: string;
}

const styles = `
@keyframes slideDown {
  from {
    transform: translateY(-12rem);
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
    transform: translateY(-12rem);
    opacity: 0;
  }
}

.animate-slideDown {
  animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slideUp {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.menu-content {
  transform-origin: 0 -12rem;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-content.slide-down {
  transform: translateY(0);
  opacity: 1;
}

.menu-content.slide-up {
  transform: translateY(-12rem);
  opacity: 0;
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

export default function Header() {
  const { user, loading } = useAuth();

  console.log("Header Auth State:", { user, loading });

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="w-full flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <HeaderClient user={user} />
      </div>
    </header>
  );
}

function HeaderClient({ user }: { user: User | null }) {
  const { handleLogout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuAnimOpen, setMenuAnimOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  console.log("HeaderClient user:", user);

  // 모바일 메뉴 토글
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    console.log("메뉴 토글 상태:", !isMenuOpen);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      setShowMenu(true);
      setMenuAnimOpen(false);
      requestAnimationFrame(() => setMenuAnimOpen(true));
    } else {
      setMenuAnimOpen(false);
      const timeout = setTimeout(() => setShowMenu(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isMenuOpen]);

  // 모바일 서브메뉴 아코디언 상태
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  // 메뉴 항목 상태 관리
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  // 메뉴 항목 불러오기
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setIsMenuLoading(true);
        const { data, error } = await supabase
          .from("cms_menus")
          .select("*")
          .eq("is_active", true)
          .order("order_num", { ascending: true });

        if (error) {
          console.error("헤더 메뉴 DB 불러오기 오류:", error);
          setMenuItems([
            {
              title: "교회 소개",
              href: "/about",
              submenu: [
                { title: "교회 비전", href: "/about/vision" },
                { title: "담임 목사", href: "/about/pastor" },
                { title: "교회 연혁", href: "/about/history" },
                { title: "예배 안내", href: "/about/worship" },
                { title: "오시는 길", href: "/about/location" },
              ],
            },
            { title: "예배와 말씀", href: "/sermons" },
            { title: "교회 소식", href: "/news" },
            { title: "소그룹", href: "/groups" },
            { title: "기도 요청", href: "/prayer" },
          ]);
        } else if (data && data.length > 0) {
          const formattedMenu = buildMenuTree(data);
          setMenuItems(formattedMenu);
        }
      } catch (error) {
        console.error("메뉴 항목을 불러오는 중 오류 발생:", error);
      } finally {
        setIsMenuLoading(false);
      }
    }

    fetchMenuItems();
  }, []);

  // 평면 구조의 메뉴 항목을 계층 구조로 변환하는 함수
  function buildMenuTree(items: any[]) {
    const rootItems = items.filter((item) => item.parent_id === null);
    return rootItems.map((item) => ({
      title: item.title,
      href: item.url,
      external: item.open_in_new_tab,
      submenu: findChildren(item.id, items),
    }));
  }

  function findChildren(parentId: string, items: any[]): any[] {
    const children = items.filter((item) => item.parent_id === parentId);
    return children.map((child) => ({
      title: child.title,
      href: child.url,
      external: child.open_in_new_tab,
      submenu: findChildren(child.id, items),
    }));
  }

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <>
      {/* 데스크톱 헤더 - md 이상에서 표시 */}
      <div className="hidden md:flex items-center">
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
      </div>

      {/* 모바일 헤더 - md 미만에서 표시 */}
      <div className="flex justify-between items-center w-full md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle Menu"
          onClick={toggleMenu}
          className={isMenuOpen ? "hamburger-open" : ""}
        >
          <div className="flex flex-col items-center justify-center w-5 h-5">
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </div>
        </Button>

        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center">
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

        <div className="flex items-center justify-center">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 데스크톱 메뉴 */}
      <nav className="hidden flex-1 items-center justify-center md:flex">
        <MainMenu items={menuItems} />
      </nav>

      {/* 데스크톱 우측 메뉴 */}
      <div className="hidden md:flex items-center gap-2">
        <ThemeSwitcher />
        {user ? (
          <UserMenu user={user} onLogout={handleLogout} />
        ) : (
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </Link>
        )}
      </div>

      {/* 모바일 메뉴 Portal */}
      {mounted && showMenu && typeof document !== "undefined" && document.body
        ? createPortal(
            <MobileMenu
              isOpen={isMenuOpen}
              menuAnimOpen={menuAnimOpen}
              items={menuItems}
              user={user}
              onLogout={handleLogout}
              onToggle={toggleMenu}
              openSubmenus={openSubmenus}
              setOpenSubmenus={setOpenSubmenus}
            />,
            document.body
          )
        : null}
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
            <AvatarImage src="" alt={user.username} />
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
          {item.submenu && item.submenu.length > 0 ? (
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
              <div className="absolute left-0 top-full z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 hidden group-hover:block">
                <div className="w-48 py-1">
                  {item.submenu.map((subItem: any, subIndex: number) => (
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

// 모바일 메뉴 컴포넌트
function MobileMenu({
  isOpen,
  menuAnimOpen,
  items,
  user,
  onLogout,
  onToggle,
  openSubmenus,
  setOpenSubmenus,
}: {
  isOpen: boolean;
  menuAnimOpen: boolean;
  items: any[];
  user: any;
  onLogout: () => void;
  onToggle: () => void;
  openSubmenus: { [key: string]: boolean };
  setOpenSubmenus: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[9998] md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
        aria-label="오버레이"
      />
      <div className="fixed left-0 right-0 top-[calc(4rem)] md:hidden pointer-events-none w-full">
        <div
          className={`bg-background shadow-xl pointer-events-auto mx-auto rounded-b-2xl ${
            menuAnimOpen ? "animate-slideDown" : "animate-slideUp"
          } w-full px-8 pt-0`}
        >
          <ul
            className={`space-y-4 menu-content ${menuAnimOpen ? "slide-down" : "slide-up"}`}
          >
            {items.map((item, idx) => (
              <li key={item.title + idx}>
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center w-full font-bold text-xl pt-4 pb-2 text-left focus:outline-none"
                    onClick={(e) => {
                      if (item.submenu) {
                        e.preventDefault();
                        setOpenSubmenus((prev) => ({
                          ...prev,
                          [item.title]: !prev[item.title],
                        }));
                      } else {
                        onToggle();
                      }
                    }}
                  >
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.submenu && (
                      <ChevronDown
                        className={`w-6 h-6 ml-2 transition-transform duration-200 ${
                          openSubmenus[item.title]
                            ? "rotate-180 text-primary"
                            : ""
                        }`}
                      />
                    )}
                  </button>
                </div>
                {item.submenu && (
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      openSubmenus[item.title]
                        ? "max-h-60 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="pl-4">
                      {item.submenu.map((subItem: any, subIdx: number) => (
                        <li key={subItem.title + subIdx}>
                          <Link
                            href={subItem.href}
                            className="block text-base py-2 text-gray-700 dark:text-gray-300 hover:font-semibold"
                            onClick={onToggle}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-12 border-t pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">테마</span>
              <ThemeSwitcher />
            </div>
            {!user && (
              <Link
                href="/sign-in"
                onClick={onToggle}
                className="block text-base font-medium pb-6"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
