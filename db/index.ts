import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 함수 내보내기
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgmxfgxkqmzjvydhrglg.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbXhmZ3hrcW16anZ5ZGhyZ2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MjMwMjgsImV4cCI6MjA1OTA5OTAyOH0.HRU7T-4RwUzd4pT8OLAUKiyoyZrTSr8CHo4YeBcQoRg';
  
  console.log('Supabase 클라이언트 생성:', { supabaseUrl, hasKey: !!supabaseAnonKey });
  
  return supabaseCreateClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// 기본 Supabase 클라이언트 인스턴스 (클라이언트 사이드에서 사용 가능)
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
