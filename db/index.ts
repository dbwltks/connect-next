// @deprecated - 이 파일은 더 이상 사용하지 않습니다. 대신 다음을 사용하세요:
// 클라이언트 컴포넌트: import { createClient } from "@/utils/supabase/client"
// 서버 컴포넌트: import { createClient } from "@/utils/supabase/server"

import { createClient } from "@/utils/supabase/client";

// 하위 호환성을 위해 잠시 유지
export const supabase = createClient();

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
