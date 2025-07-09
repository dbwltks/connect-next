import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 관리자 페이지는 레이아웃에서 처리하도록 일시적으로 비활성화
  // if (request.nextUrl.pathname.startsWith('/admin')) {
  //   if (!user) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // 관리자 권한 체크
  //   const { data: userProfile, error } = await supabase
  //     .from('users')
  //     .select('role')
  //     .eq('id', user.id)
  //     .single();

  //   console.log('[Middleware] 관리자 권한 체크:', { userProfile, error, userId: user.id });

  //   if (error || !userProfile || userProfile.role !== 'admin') {
  //     console.log('[Middleware] 관리자 권한 없음, 홈으로 리다이렉트');
  //     const url = request.nextUrl.clone();
  //     url.pathname = '/';
  //     return NextResponse.redirect(url);
  //   }

  //   console.log('[Middleware] 관리자 권한 확인됨');
  // }

  // 로그인이 필요한 보호된 경로들
  const protectedPaths = ['/mypage'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (
    !user &&
    isProtectedPath &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // 사용자가 없고 보호된 경로에 접근하려는 경우 로그인 페이지로 리디렉션
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 로그인된 사용자가 로그인/회원가입 페이지에 접근하는 경우 홈으로 리디렉션
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') || 
     request.nextUrl.pathname.startsWith('/register'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 중요: supabaseResponse 객체를 반드시 그대로 반환해야 합니다.
  // NextResponse.next()로 새로운 response 객체를 생성하는 경우 다음 사항을 반드시 지켜주세요:
  // 1. 다음과 같이 request를 전달하세요:
  // const myNewResponse = NextResponse.next({ request })

  // 2. 다음과 같이 쿠키를 복사하세요:
  // myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())

  // 3. myNewResponse 객체를 필요에 맞게 수정하되, 쿠키는 변경하지 마세요!

  // 4. 마지막으로:
  // return myNewResponse

  // 이 과정을 지키지 않으면 브라우저와 서버의 동기화가 깨져
  // 사용자 세션이 예기치 않게 종료될 수 있습니다!

  return supabaseResponse;
}
