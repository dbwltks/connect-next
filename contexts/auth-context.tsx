"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/toaster";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: UserProfile | null | undefined;
  handleLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // user: undefined(초기화중), null(비로그인), {...}(로그인)
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const router = useRouter();

  // 사용자 프로필 가져오기 (항상 서버에서 조회)
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        // users 테이블에서 정보 가져오기
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (!userError && userData) {
          // users 테이블의 nickname 사용, 없으면 username
          const displayName = userData.nickname || userData.username;
          
          const profile = {
            id: userData.id,
            username: displayName, // nickname을 표시 이름으로 사용
            email: userData.email,
            role: userData.role || "user",
            avatar_url: userData.avatar_url,
          };
          return profile;
        }
        return null;
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        return null;
      }
    },
    []
  );

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        const profile = await fetchUserProfile(user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("사용자 정보 새로고침 오류:", error);
    }
  }, [fetchUserProfile]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      // Supabase 세션 정리
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Supabase 로그아웃 오류:", error);
        throw error;
      }
      
      // 로컬 상태 정리
      setUser(null);
      
      // 로컬 스토리지 정리 (혹시 남아있는 데이터)
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token");
        sessionStorage.clear();
      }
      
      // 성공 메시지 표시
      toast({
        title: "로그아웃 완료",
        description: "성공적으로 로그아웃되었습니다",
        variant: "default",
      });
      
      // 약간의 지연 후 리다이렉트 (토스트 메시지가 보이도록)
      setTimeout(() => {
        router.push("/login");
        // 페이지 새로고침으로 완전히 초기화
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 1000);
      
    } catch (error: any) {
      console.error("로그아웃 처리 중 오류:", error);
      
      toast({
        title: "로그아웃 실패",
        description: error?.message || "로그아웃 중 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.",
        variant: "destructive",
      });
      
      // 오류 발생 시에도 강제로 로그인 페이지로 이동
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 2000);
    }
  };

  useEffect(() => {
    let mounted = true;
    let sessionRefreshInterval: NodeJS.Timeout;
    const supabase = createClient();

    async function init() {
      // 로그인 상태 확인 - getUser()를 사용하여 안전하게 인증
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;

      if (user?.id) {
        const profile = await fetchUserProfile(user.id);
        if (mounted) setUser(profile);
        
        // 세션 자동 갱신 (토큰 만료 30분 전에 갱신)
        sessionRefreshInterval = setInterval(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.expires_at) {
              const expiresAt = new Date(session.expires_at * 1000);
              const now = new Date();
              const timeUntilExpiry = expiresAt.getTime() - now.getTime();
              
              // 30분 미만 남았으면 갱신
              if (timeUntilExpiry < 30 * 60 * 1000) {
                await supabase.auth.refreshSession();
              }
            }
          } catch (error) {
            console.error("[Auth] 세션 갱신 실패:", error);
          }
        }, 5 * 60 * 1000); // 5분마다 체크
      } else {
        if (mounted) setUser(null);
      }
    }

    init();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        if (mounted) {
          setUser(null);
        }
        // 로그아웃 시 세션 갱신 간격 정리
        if (sessionRefreshInterval) {
          clearInterval(sessionRefreshInterval);
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        // getUser()를 사용하여 안전하게 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const profile = await fetchUserProfile(user.id);
          if (mounted) setUser(profile);
        
          // 로그인 시 세션 갱신 간격 설정
          if (sessionRefreshInterval) {
            clearInterval(sessionRefreshInterval);
          }
          sessionRefreshInterval = setInterval(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.expires_at) {
                const expiresAt = new Date(session.expires_at * 1000);
                const now = new Date();
                const timeUntilExpiry = expiresAt.getTime() - now.getTime();
                
                // 30분 미만 남았으면 갱신
                if (timeUntilExpiry < 30 * 60 * 1000) {
                  await supabase.auth.refreshSession();
                }
              }
            } catch (error) {
              console.error("[Auth] 세션 갱신 실패:", error);
            }
          }, 5 * 60 * 1000); // 5분마다 체크
        } else {
          if (mounted) setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval);
      }
    };
  }, [fetchUserProfile, router]);

  return (
    <AuthContext.Provider value={{ user, handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 로컬 스토리지에서 사용자 정보 가져오기 함수 제거 (실무에서는 사용하지 않음)
