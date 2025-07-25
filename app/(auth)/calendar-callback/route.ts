import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const origin = request.nextUrl.origin;

  // 에러 처리
  if (error) {
    return NextResponse.redirect(`${origin}/?calendar_auth=error&message=${encodeURIComponent("인증이 취소되었습니다")}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?calendar_auth=error&message=${encodeURIComponent("인증 코드를 받을 수 없습니다")}`);
  }

  try {
    // Google OAuth 토큰 교환
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID || 
                    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
                    '728201014571-vcacg1pgbo5nfpgabdf7nngno467v63k.apps.googleusercontent.com';
    
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET; // 서버사이드에서만 사용

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret || '', // 프로덕션에서는 필수
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${origin}/calendar-callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // 성공: 클라이언트에서 토큰을 저장할 수 있도록 스크립트 반환
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Calendar 인증 완료</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #f9fafb;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .success { color: #059669; }
            .spinner {
              width: 20px;
              height: 20px;
              border: 2px solid #f3f3f3;
              border-top: 2px solid #3498db;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2 class="success">Google Calendar 연결 완료!</h2>
            <p>잠시 후 원래 페이지로 돌아갑니다...</p>
          </div>
          <script>
            // 토큰을 세션 스토리지에 저장
            sessionStorage.setItem('calendar_access_token', '${tokenData.access_token}');
            ${tokenData.refresh_token ? `sessionStorage.setItem('calendar_refresh_token', '${tokenData.refresh_token}');` : ''}
            
            // 원래 페이지로 리디렉션
            setTimeout(() => {
              window.location.href = '${state || "/"}?calendar_auth=success';
            }, 2000);
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      return NextResponse.redirect(`${origin}/?calendar_auth=error&message=${encodeURIComponent("토큰 교환에 실패했습니다")}`);
    }
  } catch (error) {
    console.error("Calendar callback error:", error);
    return NextResponse.redirect(`${origin}/?calendar_auth=error&message=${encodeURIComponent("인증 처리 중 오류가 발생했습니다")}`);
  }
}