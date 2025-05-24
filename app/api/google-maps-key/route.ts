import { NextResponse } from 'next/server';

export async function GET() {
  // 환경 변수에서 API 키 가져오기
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 500 });
  }
  
  return NextResponse.json({ apiKey });
}
