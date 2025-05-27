import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { metadata } from "./metadata";
import ClientLayout from "./client-layout";

const notoSansKr = Noto_Sans_KR({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* <link rel="manifest" href="/manifest.json" /> 삭제 */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`bg-background text-foreground ${notoSansKr.className}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
