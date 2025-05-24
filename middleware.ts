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

    // 보호된 페이지 체크 (admin, mypage)
    if (
      currentPath.startsWith("/(auth-pages)/admin") ||
      currentPath.startsWith("/(auth-pages)/mypage")
    ) {
      console.log("Middleware - Accessing protected route");
      if (!session) {
        console.log("Middleware - No session, redirecting to login");
        const redirectUrl = new URL("/(auth)/login", request.url);
        redirectUrl.searchParams.set("redirect", currentPath);
        return NextResponse.redirect(redirectUrl);
      }
      console.log("Middleware - Session exists, allowing access");
    }

    // 로그인된 사용자의 auth 페이지 접근 방지
    if (
      session &&
      (currentPath.startsWith("/(auth)/login") ||
        currentPath.startsWith("/(auth)/register"))
    ) {
      console.log(
        "Middleware - Logged in user accessing auth route, redirecting to home"
      );
      return NextResponse.redirect(new URL("/", request.url));
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
  matcher: [
    "/(auth-pages)/admin/:path*",
    "/(auth-pages)/mypage/:path*",
    "/(auth)/login",
    "/(auth)/register",
  ],
};
