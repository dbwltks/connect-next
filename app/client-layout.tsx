"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/toaster";
import ScrollToTop from "@/components/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { swrGlobalConfig } from "@/config/swr-config";
// import ServiceWorkerRegister from "@/components/service-worker-register";
// import FCMProvider from "@/components/fcm-provider";

export default function ClientLayout({
  children,
  user,
  headerMenus,
  footerMenus,
  footerSettings,
  widgets,
}: {
  children: React.ReactNode;
  user: any;
  headerMenus: any[];
  footerMenus: any[];
  footerSettings: any;
  widgets: any[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdminPage = pathname?.startsWith('/admin');
  const isHomePage = pathname === '/';
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password');

  // OAuth 성공 토스트 처리
  useEffect(() => {
    if (searchParams.get('oauth_success') === 'true') {
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });

      // URL에서 oauth_success 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete('oauth_success');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  return (
    <AuthProvider>
      <SWRConfig value={swrGlobalConfig}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            {/* 홈페이지, 관리자 페이지, 로그인/회원가입 페이지가 아닐 때만 헤더 표시 */}
            {!isAdminPage && !isHomePage && !isAuthPage && <Header initialMenus={headerMenus} />}
            <main className="flex-1">{children}</main>
            {/* 관리자 페이지와 로그인/회원가입 페이지가 아닐 때만 푸터 표시 */}
            {!isAdminPage && !isAuthPage && <Footer menus={footerMenus} settings={footerSettings} />}
            <Toaster />
            <ScrollToTop />
            {/* <ServiceWorkerRegister /> */}
            {/* <FCMProvider /> */}
          </div>
        </ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  );
}
