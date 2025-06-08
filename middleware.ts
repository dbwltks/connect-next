import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
  try {
    // 응답 객체 생성
    const res = NextResponse.next();

    // Supabase 클라이언트 생성
    const supabase = createMiddlewareClient({ req: request, res });

    // 요청 URL에서 경로 추출
    const path = request.nextUrl.pathname;
    console.log("Middleware - Path:", path);
    
    // 세션 가져오기
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    
    // 세션 정보 로깅
    console.log("Middleware - User exists:", !!user);
    
    // 쿠키 확인
    const cookies = request.cookies;
    const supabaseCookie = cookies.get('sb-access-token') || cookies.get('sb-refresh-token');
    console.log("Middleware - Supabase cookie exists:", !!supabaseCookie);
    
    // 사용자 정보 로깅
    if (user) {
      console.log("Middleware - User ID:", user.id);
      console.log("Middleware - User Email:", user.email);
    } else {
      console.log("Middleware - No user found in session");
    }

    // 로그인된 사용자의 auth 페이지 접근 방지
    if (user && (path.includes("/login") || path.includes("/register"))) {
      console.log("Middleware - Logged in user accessing auth route, redirecting to home");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 마이페이지 경로 처리
    if (path.startsWith("/mypage")) {
      // 사용자 정보가 없을 경우에만 리디렉션
      if (!user) {
        console.log("Middleware - Unauthenticated user accessing mypage, redirecting to login");
        return NextResponse.redirect(new URL("/login", request.url));
      }
      
      // 사용자 정보가 있으면 접근 허용
      console.log("Middleware - Authenticated user accessing mypage, allowing access");
      return res;
    }

    // 관리자 페이지는 임시로 보호 제외
    console.log("Middleware - Allowing access to path:", path);
    return res;
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
    '/mypage/:path*',
    '/login',
    '/register'
  ],
};
