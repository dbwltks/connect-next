import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cleanupTempFiles } from '@/utils/fileUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrls } = body;

    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 임시 파일들 정리
    await cleanupTempFiles(fileUrls || []);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Temp file cleanup API error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup temp files' },
      { status: 500 }
    );
  }
}