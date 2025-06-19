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

  // 헤더/푸터/위젯 데이터 동시 패칭
  const [menuRes, userRes, footerSettingsRes, widgetsRes] = await Promise.all([
    supabase
      .from("cms_menus")
      .select("*")
      .eq("is_active", true)
      .order("order_num", { ascending: true }),
    supabase.auth.getUser(),
    supabase.from("cms_footer").select("*").limit(1).single(),
    supabase
      .from("cms_layout")
      .select("*")
      .eq("is_active", true)
      .order("order", { ascending: true }),
  ]);

  const menuItemsRaw = menuRes.data || [];
  const menuItems = buildMenuTree(menuItemsRaw);
  const user = userRes.data?.user || null;
  const footerSettings = footerSettingsRes.data || null;
  const widgets = widgetsRes.data || [];

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* <link rel="manifest" href="/manifest.json" /> 삭제 */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`bg-background text-foreground ${notoSansKr.className}`}>
        {/* glassmorphism SVG filter */}
        <svg style={{ display: "none" }}>
          <defs>
            <filter
              id="lg-dist"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015 0.015"
                numOctaves="3"
                seed="92"
                result="noise"
                stitchTiles="stitch"
              />
              <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurred"
                scale="20"
                xChannelSelector="R"
                yChannelSelector="G"
                colorInterpolationFilters="sRGB"
              />
            </filter>
            <filter
              id="lg-dist-small"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015 0.015"
                numOctaves="3"
                seed="92"
                result="noise"
                stitchTiles="stitch"
              />
              <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurred"
                scale="28"
                xChannelSelector="R"
                yChannelSelector="G"
                colorInterpolationFilters="sRGB"
              />
            </filter>
          </defs>
        </svg>
        <ClientLayout
          menuItems={menuItems}
          user={user}
          footerMenus={menuItemsRaw}
          footerSettings={footerSettings}
          widgets={widgets}
        >
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
