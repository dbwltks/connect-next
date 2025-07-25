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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
    }

    // OAuth 사용자 정보를 users 테이블에 저장/업데이트
    if (data.session && data.user) {
      try {
        const user = data.user;
        const userMetadata = user.user_metadata;
        
        // 사용자 정보가 이미 존재하는지 확인
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, username, avatar_url")
          .eq("id", user.id)
          .single();

        if (!existingUser) {
          // 새 사용자인 경우 users 테이블에 정보 저장
          let baseUsername = userMetadata?.full_name 
            ? userMetadata.full_name.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase()
            : user.email?.split('@')[0] || `user${user.id.slice(0, 8)}`;
          
          // username이 너무 짧으면 user_id를 추가
          if (baseUsername.length < 3) {
            baseUsername = `user${user.id.slice(0, 8)}`;
          }

          // 중복된 username이 있는지 확인하고 고유한 username 생성
          let username = baseUsername;
          let counter = 1;
          
          while (true) {
            const { data: existingUsername } = await supabase
              .from("users")
              .select("username")
              .eq("username", username)
              .single();
              
            if (!existingUsername) break;
            
            username = `${baseUsername}${counter}`;
            counter++;
            
            // 무한 루프 방지
            if (counter > 100) {
              username = `user${user.id.slice(0, 8)}${Date.now()}`;
              break;
            }
          }

          await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            username: username,
            avatar_url: userMetadata?.avatar_url || null,
            role: "user", // 기본 역할
            is_approved: true, // OAuth 사용자는 자동 승인
            last_login: new Date().toISOString(),
          });
        } else {
          // 기존 사용자인 경우 마지막 로그인 시간 업데이트
          await supabase
            .from("users")
            .update({ 
              last_login: new Date().toISOString(),
              avatar_url: userMetadata?.avatar_url || existingUser.avatar_url
            })
            .eq("id", user.id);
        }
      } catch (dbError) {
        console.error("Database update error:", dbError);
        // 데이터베이스 오류가 있어도 로그인은 계속 진행
      }
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
