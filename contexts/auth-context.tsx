"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        console.log("AuthContext - 초기 세션 확인 시작");
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("AuthContext - 세션 확인 결과:", { session: !!session, user: !!session?.user, error });
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("AuthContext - 세션 확인 에러:", error);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log("AuthContext - 인증 상태 변경:", { event, session: !!session, user: !!session?.user });
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // supabase.auth 의존성 제거

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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