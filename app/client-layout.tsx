"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";
import { swrGlobalConfig } from "@/config/swr-config";

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
  const isAdminPage = pathname?.startsWith('/admin');

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
            {!isAdminPage && <Header initialMenus={headerMenus} />}
            <main className="flex-1">{children}</main>
            {!isAdminPage && <Footer menus={footerMenus} settings={footerSettings} />}
            <Toaster />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </SWRConfig>
    </AuthProvider>
  );
}
