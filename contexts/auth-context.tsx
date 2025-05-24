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
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // 사용자 프로필 가져오기
  async function fetchUserProfile(userId: string) {
    try {
      console.log("Fetching user profile for ID:", userId);

      // 1. 먼저 ID로 조회
      const { data: userById, error: idError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!idError && userById) {
        console.log("Found user by ID:", userById);
        return {
          id: userById.id,
          username: userById.username,
          email: userById.email,
          role: userById.role || "user",
          avatar_url: userById.avatar_url,
        };
      }

      // 2. 세션에서 이메일 가져오기
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        console.log("No session or email found");
        return null;
      }

      // 3. 이메일로 사용자 조회
      const { data: userByEmail, error: emailError } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (!emailError && userByEmail) {
        console.log("Found user by email:", userByEmail);
        // ID가 다르면 업데이트
        if (userByEmail.id !== userId) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ id: userId })
            .eq("email", session.user.email);

          if (updateError) {
            console.error("Failed to update user ID:", updateError);
          }
        }
        return {
          id: userId,
          username: userByEmail.username,
          email: userByEmail.email,
          role: userByEmail.role || "user",
          avatar_url: userByEmail.avatar_url,
        };
      }

      // 4. 사용자가 없는 경우에만 새로 생성
      console.log("Creating new user profile");
      const timestamp = Date.now();
      const newUser = {
        id: userId,
        email: session.user.email,
        username: `user_${timestamp}`,
        role: "user",
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("users")
        .insert([newUser]);

      if (insertError) {
        console.error("User creation error:", insertError);
        return null;
      }

      return newUser;
    } catch (error) {
      console.error("사용자 프로필 조회/생성 실패:", error);
      return null;
    }
  }

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  };

  // 세션 상태 업데이트
  const updateUserState = async (session: any) => {
    try {
      if (!session?.user?.id) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      const profile = await fetchUserProfile(session.user.id);
      console.log("Updated user profile:", profile);

      if (profile) {
        setUser(profile);
        setIsAdmin(profile.role.toLowerCase() === "admin");
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("사용자 상태 업데이트 실패:", error);
      setUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 초기 세션 체크
    async function initializeAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial session:", session);

        if (mounted) {
          if (session) {
            await updateUserState(session);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("인증 초기화 실패:", error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (!mounted) return;

      if (event === "SIGNED_IN") {
        await updateUserState(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, handleLogout }}>
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
