import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");
  const origin = request.nextUrl.origin;
  const redirectTo = searchParams.get("redirect_to")?.toString();

  if (code) {
    // OAuth 또는 Magic Link 플로우
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
    }
  } else if (token_hash && type) {
    // 이메일 확인 플로우
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      console.error("OTP verification error:", error);
      return NextResponse.redirect(`${origin}/login?error=verification_error`);
    }
  }

  // 리디렉션 처리 (성공 플래그 추가)
  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}${redirectTo.includes('?') ? '&' : '?'}oauth_success=true`);
  }

  if (next !== "/") {
    return NextResponse.redirect(`${origin}${next}${next.includes('?') ? '&' : '?'}oauth_success=true`);
  }

  // 기본 리디렉션
  return NextResponse.redirect(`${origin}/?oauth_success=true`);
}
