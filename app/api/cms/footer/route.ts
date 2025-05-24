import { createClient } from '@/db';
import { NextResponse } from 'next/server';

// 서버 사이드 Supabase 클라이언트 생성
const supabase = createClient();

export async function POST(request: Request) {
  try {
    // 요청 본문에서 데이터 추출
    const data = await request.json();
    console.log('푸터 설정 저장 요청 데이터:', data);

    // 필수 필드 검증
    if (!data.church_name) {
      return NextResponse.json(
        { error: '교회명은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    let result;

    // ID가 있으면 업데이트, 없으면 새로 생성
    if (data.id) {
      const { id, ...updateData } = data;
      
      result = await supabase
        .from('cms_footer')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    } else {
      // ID 제외하고 삽입
      const { id, ...insertData } = data;
      
      result = await supabase
        .from('cms_footer')
        .insert(insertData)
        .select()
        .single();
    }

    const { data: savedData, error } = result;

    if (error) {
      console.error('푸터 설정 저장 중 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('푸터 설정 저장 성공:', savedData);
    return NextResponse.json(savedData);
  } catch (error) {
    console.error('푸터 설정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cms_footer')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('푸터 설정 조회 중 오류:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('푸터 설정 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
