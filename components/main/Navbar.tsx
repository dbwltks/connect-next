"use client";

import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
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
  };

  return descriptions[title] || "";
}

export function Navbar({ menuItems = [] }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMobileMenus, setOpenMobileMenus] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = (menuId: string) => {
    setOpenMobileMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-500 px-6 pt-6">
      <div
        className={`max-w-[1400px] mx-auto transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-xl rounded-full px-8"
            : "bg-transparent px-4"
        }`}
      >
        <div className="flex justify-between items-center h-20">
          {/* 로고 */}
          <Link href="/" className="flex items-center">
            <div className="relative h-12 w-24 overflow-hidden flex items-center">
              <Image
                src="/connect_logo.png"
                alt="커넥트 교회 로고"
                width={96}
                height={48}
                className="object-contain"
                priority
                style={{ width: "auto", height: "48px" }}
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                {menuItems.map((item) => (
                  <NavigationMenuItem key={item.id}>
                    {item.submenu && item.submenu.length > 0 ? (
                      <>
                        <NavigationMenuTrigger
                          className={`text-sm font-medium !bg-transparent ${
                            isScrolled ? "text-black" : "text-gray-300"
                          }`}
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
                          className={`${navigationMenuTriggerStyle()} !bg-transparent text-sm font-medium ${
                            isScrolled ? "text-black" : "text-gray-300"
                          }`}
                        >
                          {item.title}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <Link href="#contact">
              <button
                className={`px-8 py-3 rounded-full text-sm uppercase tracking-widest transition-all ${
                  isScrolled
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-300 text-black hover:bg-gray-200"
                }`}
              >
                Visit
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X
                className={`w-6 h-6 ${isScrolled ? "text-black" : "text-gray-300"}`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${isScrolled ? "text-black" : "text-gray-300"}`}
              />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden mt-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl mx-6 overflow-hidden">
          <div className="px-8 py-8 space-y-4">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.submenu && item.submenu.length > 0 ? (
                  <div>
                    <button
                      onClick={() => toggleMobileMenu(item.id)}
                      className="w-full flex items-center justify-between text-black text-lg font-medium hover:opacity-60 transition-opacity"
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          openMobileMenus.includes(item.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openMobileMenus.includes(item.id) && (
                      <div className="pl-4 mt-2 space-y-2">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.id}
                            href={subItem.url}
                            className="block text-gray-600 text-base hover:text-black transition-colors py-1"
                            onClick={() => setIsOpen(false)}
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
                    className="block text-black text-lg font-medium hover:opacity-60"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
            <Link href="#contact">
              <button
                className="w-full bg-black text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-gray-800 mt-4"
                onClick={() => setIsOpen(false)}
              >
                Visit
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
