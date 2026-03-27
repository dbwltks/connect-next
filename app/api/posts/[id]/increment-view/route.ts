import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const CONNECT_CHURCH_ORG_ID = '23913033-e35d-456c-818a-7824dd9de106';

    // 현재 조회수 가져오기 - org_posts 테이블 사용
    const { data: currentPost, error: fetchError } = await supabase
      .from('org_posts')
      .select('views')
      .eq('id', id)
      .eq('organization_id', CONNECT_CHURCH_ORG_ID)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    // 조회수 증가
    const currentViews = currentPost.views || 0;
    const newViews = currentViews + 1;

    // 조회수 업데이트 (views만 업데이트)
    const { data, error } = await supabase
      .from('org_posts')
      .update({
        views: newViews
      })
      .eq('id', id)
      .eq('organization_id', CONNECT_CHURCH_ORG_ID)
      .select('views')
      .single();

    if (error) {
      return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      views: data.views
    });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}