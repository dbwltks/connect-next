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

export function useUserProfile(user: User | null, options?: { waitForProfile?: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // 관리자 페이지에서는 프로필 로딩을 기다림
    if (!options?.waitForProfile) {
      // 로딩 상태를 즉시 false로 설정하여 메뉴 로딩을 차단하지 않음
      setLoading(false);
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

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
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        // 프로필 로딩이 완료되면 로딩 상태 false로 설정
        if (options?.waitForProfile) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        if (options?.waitForProfile) {
          setLoading(false);
        }
      }
    };

    // 비동기로 프로필 가져오기 (메뉴 로딩을 차단하지 않음)
    fetchProfile();

    // 브라우저 이벤트를 통한 프로필 업데이트 리스너
    const handleProfileUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user?.id, supabase, refreshTrigger, options?.waitForProfile]);

  const refreshProfile = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { profile, loading, refreshProfile };
}