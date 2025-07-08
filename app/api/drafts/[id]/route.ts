import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 임시저장 소유자 확인
    const { data: existingDraft, error: fetchError } = await supabase
      .from('board_posts')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingDraft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    if (existingDraft.user_id !== user.id || existingDraft.status !== 'draft') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 임시저장 삭제
    const { error } = await supabase
      .from('board_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Draft delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}