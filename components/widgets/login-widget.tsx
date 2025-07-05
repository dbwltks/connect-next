"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/db";
import { IWidget } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface LoginWidgetProps {
  widget: IWidget;
}

export default function LoginWidget({ widget }: LoginWidgetProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  

  useEffect(() => {
    
    const getSession = async () => {
      setIsLoading(true);
      
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      
      if (!error && user) {
        setUser(user as AuthUser);
        // Fetch user data from users table
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        setUserData(userProfile);
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user as AuthUser);
          // Fetch user data from users table
          const { data: userProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setUserData(userProfile);
        } else {
          setUser(null);
          setUserData(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const displayName =
    userData?.nickname || userData?.username || user?.email?.split("@")[0] || "사용자";

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-200/50">
      {user ? (
        // Logged-in state
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={userData?.avatar_url}
                alt={displayName}
              />
              <AvatarFallback>
                {displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-gray-500">
                {widget.display_options?.logged_in_title || "님, 환영합니다!"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <Link href="/mypage">마이페이지</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>
        </div>
      ) : (
        // Logged-out state
        <div className="space-y-3 text-center">
          <h3 className="text-sm font-medium text-gray-700">
            {widget.title || "로그인"}
          </h3>
          <p className="text-xs text-gray-500 px-2">
            {widget.display_options?.logged_out_title ||
              "로그인하고 모든 서비스를 이용하세요."}
          </p>
          <div className="flex flex-col space-y-2 pt-2">
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-2" />
                로그인
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/register">회원가입</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
