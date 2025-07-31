import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, body } = await request.json();

    // Supabase Edge Function 호출
    const response = await fetch(
      'https://tgmxfgxkqmzjvydhrglg.supabase.co/functions/v1/send-fcm-notification',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body
        }),
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ success: false, error: result }, { status: 400 });
    }
  } catch (error) {
    console.error('FCM 알림 API 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}