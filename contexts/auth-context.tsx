"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // user: undefined(초기화중), null(비로그인), {...}(로그인)
  const [user, setUser] = useState<UserProfile | null | undefined>(() => {
    // 클라이언트 사이드에서만 실행되도록 함
    if (typeof window !== "undefined") {
      // 로컬 스토리지에서 캐시된 사용자 정보 가져오기
      const cachedUser = localStorage.getItem("user");
      if (cachedUser) {
        try {
          return JSON.parse(cachedUser) as UserProfile;
        } catch (e) {
          localStorage.removeItem("user");
        }
      }
    }
    return undefined;
  });
  const router = useRouter();
  const [profileCache, setProfileCache] = useState<
    Record<string, { profile: UserProfile; timestamp: number }>
  >({});

  // 사용자 프로필 가져오기 (캐싱 적용)
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        // 캐시 확인 (5분 유효)
        const now = Date.now();
        const cachedData = profileCache[userId];
        if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
          return cachedData.profile;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (!error && data) {
          const profile = {
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role || "user",
            avatar_url: data.avatar_url,
          };

          // 캐시 업데이트
          setProfileCache((prev) => ({
            ...prev,
            [userId]: { profile, timestamp: now },
          }));

          // 로컬 스토리지에 저장
          localStorage.setItem("user", JSON.stringify(profile));

          return profile;
        }
        return null;
      } catch (error) {
        console.error("프로필 조회 오류:", error);
        return null;
      }
    },
    [profileCache]
  );

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      router.push("/login");
    } catch (error) {
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      // 이미 로컬 스토리지에서 복원된 사용자 정보가 있으면 세션 검증만 수행
      if (user) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // 세션이 없으면 로그아웃 상태로 설정
          if (mounted) {
            setUser(null);
            localStorage.removeItem("user");
          }
        }
        return;
      }

      // 로그인 상태 확인
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
    }

    init();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        if (mounted) {
          setUser(null);
          localStorage.removeItem("user");
        }
        return;
      }

      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile, router, user]);

  return (
    <AuthContext.Provider value={{ user, handleLogout }}>
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

// 로컬 스토리지에서 사용자 정보 가져오기 (서버 컴포넌트에서 사용 불가)
export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (e) {
    console.error("저장된 사용자 정보 파싱 오류:", e);
    localStorage.removeItem("user");
  }

  return null;
}
