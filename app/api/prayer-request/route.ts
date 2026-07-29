import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const CONNECT_CHURCH_ORG_ID = "23913033-e35d-456c-818a-7824dd9de106";

// 서비스 역할 클라이언트 (RLS 무시) - 비로그인 방문자도 제출 가능해야 함
// 빌드 타임에 env가 없어도 실패하지 않도록 요청 시점에 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { name, content } = await req.json();

    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "이름과 기도 제목을 입력해주세요." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("org_prayer_requests")
      .insert({
        organization_id: CONNECT_CHURCH_ORG_ID,
        guest_name: name,
        title: content,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save prayer request:", error);
      throw error;
    }

    // 관리자 이메일 알림 - 저장은 이미 성공했으므로 메일 실패가 전체 요청을 실패시키지 않도록 분리
    if (process.env.GOOGLE_EMAIL_USER && process.env.GOOGLE_EMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GOOGLE_EMAIL_USER,
            pass: process.env.GOOGLE_EMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `"Connect Church 홈페이지" <${process.env.GOOGLE_EMAIL_USER}>`,
          to: `${process.env.GOOGLE_EMAIL_USER}, dbwltks@gmail.com`,
          subject: `[중보기도 요청] 새로운 기도 요청이 접수되었습니다`,
          html: `
            <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #eee; border-radius: 20px;">
              <h2 style="font-size: 22px; font-weight: 700; color: #111; margin-bottom: 24px; text-align: center;">중보기도 요청 접수</h2>
              <div style="background-color: #f9f9f9; padding: 24px; border-radius: 12px; text-align: center;">
                <p style="font-size: 16px; color: #111; margin: 0;">새로운 중보기도 요청이 등록되었습니다.</p>
                <p style="font-size: 14px; color: #888; margin-top: 8px;">내용은 개인정보 보호를 위해 메일에 표시되지 않습니다. 관리자 페이지에서 확인해주세요.</p>
              </div>
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">본 메일은 커넥트 교회 홈페이지에서 자동으로 발송되었습니다.</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send prayer request notification email:", emailError);
      }
    } else {
      console.warn("GOOGLE_EMAIL_USER / GOOGLE_EMAIL_APP_PASSWORD가 설정되지 않아 알림 메일을 건너뜁니다.");
    }

    return NextResponse.json({ prayerRequest: data });
  } catch (error: any) {
    console.error("Prayer request API error:", error);
    return NextResponse.json(
      { error: "기도 요청 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
