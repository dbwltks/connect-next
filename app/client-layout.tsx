"use client";

import { ThemeProvider } from "next-themes";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/scroll-to-top";
import { AuthProvider } from "@/contexts/auth-context";

export default function ClientLayout({
  children,
  menuItems,
  user,
  footerMenus,
  footerSettings,
}: {
  children: React.ReactNode;
  menuItems: any[];
  user: any;
  footerMenus: any[];
  footerSettings: any;
}) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <div className="min-h-screen flex flex-col">
          <Header menuItems={menuItems} user={user} />
          <main className="flex-1">{children}</main>
          <Footer menus={footerMenus} settings={footerSettings} />
          <Toaster />
          <ScrollToTop />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
