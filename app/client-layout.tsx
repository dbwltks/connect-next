"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { swrGlobalConfig } from "@/config/swr-config";

export default function ClientLayout({
  children,
  menuItems,
  user,
  footerMenus,
  footerSettings,
  widgets,
}: {
  children: React.ReactNode;
  menuItems: any[];
  user: any;
  footerMenus: any[];
  footerSettings: any;
  widgets: any[];
}) {
  // SWR fallback 데이터 - 서버에서 미리 가져온 데이터를 캐시에 저장
  const swrConfigWithFallback = {
    ...swrGlobalConfig,
    fallback: {
      // 위젯 데이터를 전역 캐시에 저장
      'widgets': widgets,
      'menu_items': menuItems,
      'footer_menus': footerMenus,
      'footer_settings': footerSettings,
    }
  };

  return (
    <AuthProvider>
      <SWRConfig value={swrConfigWithFallback}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Header menuItems={menuItems} />
            <main className="flex-1">{children}</main>
            <Footer menus={footerMenus} settings={footerSettings} />
            <Toaster />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  );
}
