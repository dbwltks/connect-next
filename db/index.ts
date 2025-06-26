import { createClient } from "@/utils/supabase/client";

// Supabase 클라이언트 인스턴스 (싱글톤 패턴)
let _supabase: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (typeof window !== "undefined") {
    // 클라이언트 사이드에서만 생성
    if (!_supabase) {
      _supabase = createClient();
    }
    return _supabase;
  }
  // 서버 사이드에서는 매번 새로 생성
  return createClient();
})();

// Supabase 인증 헬퍼 함수
export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const getUser = async () => {
  const session = await getSession();
  if (!session) return null;
  return session.user;
};
