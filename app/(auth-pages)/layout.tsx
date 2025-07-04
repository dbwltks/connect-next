import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // 서버에서 사용자 인증 확인
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  // 비로그인 사용자는 로그인 페이지로 리다이렉션
  if (error || !user) {
    redirect("/login");
  }

  return <>{children}</>;
}
