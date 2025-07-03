"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { swrGlobalConfig } from "@/config/swr-config";
import PageTransitionManager from "@/components/layout/page-transition-manager";

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
            <Header menuItems={menuItems} />
            <main className="flex-1">{children}</main>
            <Footer menus={footerMenus} settings={footerSettings} />
            <Toaster />
            <ScrollToTop />
            <PageTransitionManager />
          </div>
        </ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  );
}
