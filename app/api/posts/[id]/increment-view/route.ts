import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // RLS를 우회하는 SECURITY DEFINER RPC로 조회수만 안전하게 증가
    // (org_posts 직접 UPDATE는 익명 방문자에게 RLS로 막혀 있어 항상 실패했음)
    const { error: rpcError } = await supabase.rpc('increment_post_views', {
      post_id: id,
    });

    if (rpcError) {
      return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 });
    }

    const { data, error: fetchError } = await supabase
      .from('org_posts')
      .select('views')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      views: data.views
    });
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}