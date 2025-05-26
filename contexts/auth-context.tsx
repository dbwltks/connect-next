"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  const [user, setUser] = useState<UserProfile | null | undefined>(undefined);
  const router = useRouter();

  // 사용자 프로필 가져오기 (필요할 때만 호출)
  async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role || "user",
          avatar_url: data.avatar_url,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        setUser(null);
      }
    }
    init();
    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        if (mounted) setUser(profile);
      } else {
        setUser(null);
      }
    });
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

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
