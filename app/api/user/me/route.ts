import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인 - getUser()를 사용하여 안전하게 인증
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user?.id) {
      return NextResponse.json({ user: null });
    }
    
    // 사용자 프로필 정보 조회
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('User profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
    
    if (!userData) {
      return NextResponse.json({ user: null });
    }
    
    // 사용자 프로필 구성
    const profile = {
      id: userData.id,
      username: userData.nickname || userData.username,
      email: userData.email,
      role: userData.role || 'user',
      avatar_url: userData.avatar_url,
      nickname: userData.nickname,
      created_at: userData.created_at,
    };
    
    return NextResponse.json({ user: profile });
    
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}