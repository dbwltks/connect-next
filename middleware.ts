import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 세션 새로고침 시도
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 세션이 있으면 자동으로 refresh
  if (session) {
    await supabase.auth.refreshSession();
  }

  // 요청 URL에서 경로 추출
  const path = req.nextUrl.pathname;
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
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 마이페이지 보호 로직은 페이지 레이아웃으로 이동
  // 사용자 경험 개선을 위해 클라이언트 사이드에서 처리

  // 관리자 페이지는 임시로 보호 제외
  console.log("Middleware - Allowing access to path:", path);
  return res;
}

// 모든 페이지에서 미들웨어 실행
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
