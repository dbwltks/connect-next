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

        if (error || !data) {
          console.error("Error fetching profile or no profile found:", error);
          
          // 프로필이 없는 경우 (OAuth 사용자의 경우) 자동으로 생성
          if (user && user.email) {
            try {
              const userMetadata = user.user_metadata || {};
              let baseUsername = userMetadata?.full_name 
                ? userMetadata.full_name.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase()
                : user.email?.split('@')[0] || `user${user.id.slice(0, 8)}`;
              
              if (baseUsername.length < 3) {
                baseUsername = `user${user.id.slice(0, 8)}`;
              }

              // 중복된 username이 있는지 확인하고 고유한 username 생성
              let username = baseUsername;
              let counter = 1;
              
              while (true) {
                const { data: existingUsername } = await supabase
                  .from("users")
                  .select("username")
                  .eq("username", username)
                  .single();
                  
                if (!existingUsername) break;
                
                username = `${baseUsername}${counter}`;
                counter++;
                
                if (counter > 100) {
                  username = `user${user.id.slice(0, 8)}${Date.now()}`;
                  break;
                }
              }

              const { data: insertData, error: insertError } = await supabase.from("users").insert({
                id: user.id,
                email: user.email,
                username: username,
                avatar_url: userMetadata?.avatar_url || null,
                role: "user",
                is_approved: true,
                last_login: new Date().toISOString(),
              }).select().single();

              if (!insertError && insertData) {
                const profileData = {
                  id: insertData.id,
                  username: insertData.username,
                  email: insertData.email,
                  role: insertData.role || 'user',
                  avatar_url: insertData.avatar_url,
                };
                setProfile(profileData);
              } else {
                console.error("Error creating profile:", insertError);
                setProfile(null);
              }
            } catch (createError) {
              console.error("Error creating user profile:", createError);
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        } else if (data) {
          const profileData = {
            id: data.id,
            username: data.nickname || data.username || user.email?.split('@')[0] || 'User',
            email: data.email || user.email || '',
            role: data.role || 'user',
            avatar_url: data.avatar_url,
          };
          setProfile(profileData);
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