"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient();
        const { searchParams } = new URL(window.location.href);
        const code = searchParams.get("code");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("OAuth error:", error, errorDescription);
          // 부모 창에 오류 메시지 전송
          if (window.opener) {
            window.opener.postMessage(
              { type: 'OAUTH_ERROR', error, errorDescription },
              window.location.origin
            );
            // 팝업 창 닫기
            window.close();
          }
          return;
        }

        if (code) {
          // 코드를 세션으로 교환
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            if (window.opener) {
              window.opener.postMessage(
                { type: 'OAUTH_ERROR', error: exchangeError.message },
                window.location.origin
              );
              // 팝업 창 닫기
              window.close();
            }
            return;
          }

          if (data.session && data.user) {
            // OAuth 사용자 정보를 users 테이블에 저장/업데이트
            try {
              const user = data.user;
              const userMetadata = user.user_metadata;
              
              // 사용자 정보가 이미 존재하는지 확인
              const { data: existingUser } = await supabase
                .from("users")
                .select("id, username, avatar_url")
                .eq("id", user.id)
                .single();

              if (!existingUser) {
                // 새 사용자인 경우 users 테이블에 정보 저장
                let baseUsername = userMetadata?.full_name 
                  ? userMetadata.full_name.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase()
                  : user.email?.split('@')[0] || `user${user.id.slice(0, 8)}`;
                
                // username이 너무 짧으면 user_id를 추가
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
                  
                  // 무한 루프 방지
                  if (counter > 100) {
                    username = `user${user.id.slice(0, 8)}${Date.now()}`;
                    break;
                  }
                }

                await supabase.from("users").insert({
                  id: user.id,
                  email: user.email,
                  username: username,
                  avatar_url: userMetadata?.avatar_url || null,
                  role: "user", // 기본 역할
                  is_approved: true, // OAuth 사용자는 자동 승인
                  last_login: new Date().toISOString(),
                });
              } else {
                // 기존 사용자인 경우 마지막 로그인 시간 업데이트
                // 아바타가 이미 있으면 업데이트하지 않음, 없으면 새로 설정
                const updateData: any = {
                  last_login: new Date().toISOString(),
                };
                
                if (!existingUser.avatar_url && userMetadata?.avatar_url) {
                  updateData.avatar_url = userMetadata.avatar_url;
                }
                
                await supabase
                  .from("users")
                  .update(updateData)
                  .eq("id", user.id);
              }
            } catch (dbError) {
              console.error("Database update error:", dbError);
              // 데이터베이스 오류가 있어도 로그인은 계속 진행
            }

            // 팝업 환경인지 확인
            if (window.opener) {
              // 데스크톱 팝업 환경 - 부모 창에 성공 메시지 전송
              window.opener.postMessage(
                { type: 'OAUTH_SUCCESS', session: data.session },
                window.location.origin
              );
              // 팝업 창 닫기 - 여러 방법 시도
              setTimeout(() => {
                window.close();
                if (!window.closed) {
                  // window.close()가 실패하면 빈 페이지로 이동
                  document.body.innerHTML = '<div style="text-align:center;padding:50px;">로그인 완료! 이 창을 닫아주세요.</div>';
                }
              }, 100);
            } else {
              // 모바일 직접 리다이렉트 환경
              const redirectTo = searchParams.get("redirect_to");
              const targetUrl = redirectTo || "/";
              // 성공 플래그와 함께 리다이렉트
              window.location.href = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}oauth_success=true`;
            }
          }
        }
      } catch (error) {
        console.error("Callback handling error:", error);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'OAUTH_ERROR', error: 'Unexpected error occurred' },
            window.location.origin
          );
          // 팝업 창 닫기
          window.close();
        }
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}