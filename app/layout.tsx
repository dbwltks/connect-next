import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { metadata } from "./metadata";
import ClientLayout from "./client-layout";
import { createClient } from "@/utils/supabase/server";

const notoSansKr = Noto_Sans_KR({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

function buildMenuTree(items: any[]) {
  const rootItems = items.filter((item) => item.parent_id === null);
  return rootItems.map((item) => ({
    ...item,
    submenu: findChildren(item.id, items),
  }));
}
function findChildren(parentId: string, items: any[]): any[] {
  const children = items.filter((item) => item.parent_id === parentId);
  return children.map((child) => ({
    ...child,
    submenu: findChildren(child.id, items),
  }));
}

export { metadata };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // 헤더/푸터 데이터 동시 패칭
  const [menuRes, userRes, footerSettingsRes] =
    await Promise.all([
      supabase
        .from("cms_menus")
        .select("*")
        .eq("is_active", true)
        .order("order_num", { ascending: true }),
      supabase.auth.getUser(),
      supabase.from("cms_footer").select("*").limit(1).single(),
    ]);

  const menuItemsRaw = menuRes.data || [];
  const menuItems = buildMenuTree(menuItemsRaw);
  const user = userRes.data?.user || null;
  const footerSettings = footerSettingsRes.data || null;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* <link rel="manifest" href="/manifest.json" /> 삭제 */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`bg-background text-foreground ${notoSansKr.className}`}>
        <ClientLayout
          menuItems={menuItems}
          user={user}
          footerMenus={menuItemsRaw}
          footerSettings={footerSettings}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
