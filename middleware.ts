import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // 응답 객체 생성
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 세션 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 요청 URL에서 경로 추출
    const path = request.nextUrl.pathname;
    console.log("Middleware - Path:", path);
    console.log("Middleware - Session exists:", !!session);

    if (session) {
      console.log("Middleware - User ID:", session.user.id);
    }

    // 로그인된 사용자의 auth 페이지 접근 방지
    if (session && (path.includes("/login") || path.includes("/register"))) {
      console.log(
        "Middleware - Logged in user accessing auth route, redirecting to home"
      );
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 마이페이지 보호 로직은 페이지 레이아웃으로 이동
    // 사용자 경험 개선을 위해 클라이언트 사이드에서 처리

    // 관리자 페이지는 임시로 보호 제외
    console.log("Middleware - Allowing access to path:", path);
    return supabaseResponse;
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.next();
  }
}

// 미들웨어가 실행될 경로 설정 - 관리자 페이지 제외
export const config = {
  matcher: [
    // 관리자 페이지는 임시로 제외
    // '/admin/:path*',
    // '/mypage/:path*',
    "/login",
    // "/register",
  ],
};
