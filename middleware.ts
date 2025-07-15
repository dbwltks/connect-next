import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음으로 시작하는 경로를 제외한 모든 요청 경로와 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일) 
     * - favicon.ico (파비콘 파일)
     * - mypage (마이페이지는 클라이언트에서 처리)
     * 필요한 경우 더 많은 경로를 포함하도록 이 패턴을 수정하세요.
     */
    '/((?!_next/static|_next/image|favicon.ico|mypage|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
