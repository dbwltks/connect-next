"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    console.log("useUserProfile - useEffect 실행:", { user: !!user, userId: user?.id });
    
    if (!user) {
      console.log("useUserProfile - 사용자 없음, profile null 설정");
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true); // 로딩 시작

    const fetchProfile = async () => {
      try {
        console.log("useUserProfile - 프로필 조회 시작:", user.id);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("useUserProfile - 프로필 조회 결과:", { data, error });

        if (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        } else if (data) {
          const profileData = {
            id: data.id,
            username: data.nickname || data.username || user.email?.split('@')[0] || 'User',
            email: data.email || user.email || '',
            role: data.role || 'user',
            avatar_url: data.avatar_url,
          };
          console.log("useUserProfile - 프로필 설정 전:", profileData);
          setProfile(profileData);
          console.log("useUserProfile - 프로필 설정 후");
        } else {
          console.log("useUserProfile - 데이터 없음");
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } finally {
        console.log("useUserProfile - 로딩 완료");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, supabase]); // supabase도 의존성에 추가

  return { profile, loading };
}