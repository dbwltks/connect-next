"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import HideHeader from "@/components/layout/hide-header";

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* <HideHeader /> */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
