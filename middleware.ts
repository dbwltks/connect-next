import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // 응답 객체 생성
    const res = NextResponse.next();

    // Supabase 클라이언트 생성
    const supabase = createMiddlewareClient({ req: request, res });

    // 세션 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("Middleware - Current Path:", request.nextUrl.pathname);
    console.log("Middleware - Session Details:", {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    const currentPath = request.nextUrl.pathname;

    // protected 경로 체크
    if (currentPath.startsWith("/protected")) {
      console.log("Middleware - Accessing protected route");
      if (!session) {
        console.log("Middleware - No session, redirecting to login");
        const redirectUrl = new URL("/(auth-pages)/sign-in", request.url);
        redirectUrl.searchParams.set("redirect", currentPath);
        return NextResponse.redirect(redirectUrl);
      }
      console.log("Middleware - Session exists, allowing access");
    }

    // 이미 로그인된 상태에서 auth 페이지 접근 시
    if (session && currentPath.startsWith("/(auth-pages)")) {
      console.log(
        "Middleware - Logged in user accessing auth route, redirecting to home"
      );
      return NextResponse.redirect(new URL("/protected/mypage", request.url));
    }

    return res;
  } catch (error) {
    console.error("Middleware Error:", error);
    // 에러 발생 시에도 세션 체크를 위해 응답 반환
    return NextResponse.next();
  }
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ["/protected/:path*", "/(auth-pages)/:path*"],
};
