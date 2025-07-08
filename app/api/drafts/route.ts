import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 임시저장 목록 조회
    const { data: drafts, error } = await supabase
      .from('board_posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch drafts:', error);
      throw error;
    }

    return NextResponse.json({ drafts: drafts || [] });
  } catch (error) {
    console.error('Drafts fetch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      page_id,
      category_id,
      allow_comments = true,
      files,
      tags
    } = body;

    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 임시저장 생성
    const { data: draft, error } = await supabase
      .from('board_posts')
      .insert({
        title: title || '제목 없음',
        content,
        page_id,
        category_id,
        user_id: user.id,
        allow_comments,
        status: 'draft',
        files,
        tags,
        views: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create draft:', error);
      throw error;
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Draft creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}