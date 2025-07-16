"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Home,
  UserPlus,
  Layout,
  Activity,
  BarChart3,
  Shield,
  ChevronRight,
  LogOut,
  Briefcase,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-user-profile";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function AppSidebar() {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const navItems = [
    { name: "홈페이지 관리", href: "/admin/homepage", icon: Layout },
    {
      name: "교인 관리",
      icon: Users,
      submenu: [
        {
          name: "대시보드",
          href: "/admin/members/dashboard",
          icon: BarChart3,
        },
        { name: "교인 관리", href: "/admin/members", icon: Users },
      ],
    },
    {
      name: "계정 관리",
      icon: UserPlus,
      submenu: [
        {
          name: "대시보드",
          href: "/admin/accounts/dashboard",
          icon: BarChart3,
        },
        { name: "계정 관리", href: "/admin/accounts", icon: Users },
        {
          name: "계정 권한",
          href: "/admin/accounts/permissions",
          icon: Shield,
        },
      ],
    },
    { name: "프로그램 관리", href: "/admin/programs", icon: Briefcase },
    { name: "일정 관리", href: "/admin/events", icon: Calendar },
    { name: "공지사항", href: "/admin/announcements", icon: FileText },
    { name: "기도 요청", href: "/admin/prayers", icon: MessageSquare },
    { name: "활동 로그", href: "/admin/activity-logs", icon: Activity },
    { name: "시스템 설정", href: "/admin/settings", icon: Settings },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Home className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">관리자</span>
                  <span className="truncate text-xs">대시보드</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>관리 메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item: any) => (
                <SidebarMenuItem key={item.name}>
                  {item.submenu ? (
                    <>
                      <SidebarMenuButton 
                        tooltip={item.name}
                        onClick={() => toggleMenu(item.name)}
                      >
                        <item.icon />
                        <span>{item.name}</span>
                        <ChevronRight className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                          openMenus.has(item.name) ? 'rotate-90' : ''
                        }`} />
                      </SidebarMenuButton>
                      {openMenus.has(item.name) && (
                        <SidebarMenuSub>
                          {item.submenu.map((subItem: any) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.href}>
                                  <subItem.icon />
                                  <span>{subItem.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton tooltip={item.name} asChild>
                      <Link href={item.href!}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user);
  const router = useRouter();

  console.log("Admin Layout - 상태:", { loading, profileLoading, user: !!user, profile, userRole: profile?.role });

  // 리다이렉션 효과
  useEffect(() => {
    if (loading || profileLoading) return;
    
    if (!user) {
      console.log("Admin Layout - 사용자 없음, 로그인 페이지로 이동");
      router.push("/login");
      return;
    }
    
    // 프로필 로딩이 완료되었는데도 프로필이 없거나 admin이 아닌 경우만 리다이렉트
    // 약간의 지연을 두어 상태 업데이트를 기다림
    const timer = setTimeout(() => {
      if (!profileLoading && (!profile || profile.role !== "admin")) {
        console.log("관리자 권한 체크 실패:", { profile, profileLoading, role: profile?.role });
        router.push("/");
      }
    }, 100); // 100ms 지연
    
    return () => clearTimeout(timer);
  }, [loading, profileLoading, user, profile, router]);

  // 로딩 중
  if (loading || profileLoading) {
    console.log("Admin Layout - 로딩 중:", { loading, profileLoading });
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우나 권한이 없는 경우
  if (!user || !profile || profile.role !== "admin") {
    return null;
  }

  console.log("관리자 권한 확인됨:", { profile });

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  console.log("관리자 레이아웃 렌더링 시작");

  return (
    <div className="flex flex-col min-h-screen">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <header className="h-16 bg-background border-b flex items-center justify-between mb-4 p-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
              </div>
              <div className="flex items-center gap-2 mr-4">
                {profile && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                      >
                        <Avatar>
                          <AvatarImage
                            src={profile.avatar_url || ""}
                            alt={profile.username}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {profile.username?.charAt(0).toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{profile.username}</p>
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
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </header>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}