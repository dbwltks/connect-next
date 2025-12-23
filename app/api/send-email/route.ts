import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();
    
    // 환경 변수 체크
    if (!process.env.GOOGLE_EMAIL_USER || !process.env.GOOGLE_EMAIL_APP_PASSWORD) {
      throw new Error("서버에 이메일 설정(환경변수)이 되어있지 않습니다.");
    }

    // 호스트 정보 가져오기 (배포 시 자동으로 도메인 반영)
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    // 로컬 환경에서는 이미지가 깨질 수 있으므로 배포 후에는 실제 도메인 주소가 사용됩니다.
    const logoUrl = `${protocol}://${host}/connect_logo.png`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_EMAIL_USER,
        pass: process.env.GOOGLE_EMAIL_APP_PASSWORD,
      },
    });

    console.log("Email request log:", { name, email, logoUrl });

    // 1. 교회측에 보내는 이메일 템플릿
    const churchMailOptions = {
      from: `"${name}" <${process.env.GOOGLE_EMAIL_USER}>`,
      to: `${process.env.GOOGLE_EMAIL_USER}, dbwltks@gmail.com`, // 전송 계정과 확인용 계정 모두 발송
      replyTo: email,
      subject: `[문의] ${name} 성도님의 새로운 문의가 접수되었습니다.`,
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="${logoUrl}" alt="Connect Church" style="width: 120px; height: auto;">
          </div>
          <h2 style="font-size: 24px; font-weight: 700; color: #111; margin-bottom: 24px; text-align: center; letter-spacing: -0.5px;">교회 문의 접수</h2>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
            <div style="margin-bottom: 15px;">
              <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Name</span>
              <div style="font-size: 16px; color: #111; font-weight: 500; margin-top: 4px;">${name}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Email</span>
              <div style="font-size: 16px; color: #111; font-weight: 500; margin-top: 4px;">${email}</div>
            </div>
            <div style="margin-bottom: 15px;">
              <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Phone</span>
              <div style="font-size: 16px; color: #111; font-weight: 500; margin-top: 4px;">${phone}</div>
            </div>
            <div>
              <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Message</span>
              <div style="font-size: 16px; color: #111; line-height: 1.6; margin-top: 8px;">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">본 메일은 커넥트 교회 홈페이지에서 자동으로 발송되었습니다.</p>
        </div>
      `,
    };

    // 2. 작성자에게 보내는 확인 이메일 템플릿
    const userMailOptions = {
      from: `"Connect Church" <${process.env.GOOGLE_EMAIL_USER}>`,
      to: email,
      replyTo: process.env.GOOGLE_EMAIL_USER, // 사용자가 답장을 보내면 전송 계정으로 가도록 함
      subject: `안녕하세요 ${name}님, 커넥트 교회입니다.`,
      html: `
        <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #111; border-radius: 20px; background-color: #fff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="${logoUrl}" alt="Connect Church" style="width: 120px; height: auto;">
          </div>
          <h2 style="font-size: 28px; font-weight: 700; color: #111; margin-bottom: 24px; text-align: center; letter-spacing: -1px;">환영합니다!</h2>
          <p style="font-size: 16px; color: #444; line-height: 1.8; text-align: center; margin-bottom: 40px;">
            안녕하세요 ${name}님,<br>
            커넥트 교회에 관심을 가져주셔서 진심으로 감사합니다.<br>
            보내주신 소중한 메시지는 잘 접수되었으며,<br>
            빠른 시일 내에 담당자께서 연락드리도록 하겠습니다.
          </p>
          <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 30px;">
            <p style="font-size: 14px; color: #888; text-align: center;">
              우리의 연결은 하나님 안에서 시작됩니다.<br>
              <strong>Connect Church</strong>
            </p>
          </div>
        </div>
      `,
    };

    // 메일 전송 (순차적으로 전송하여 안정성 확보)
    console.log("Sending church notification...");
    await transporter.sendMail(churchMailOptions);
    
    console.log("Sending user confirmation...");
    await transporter.sendMail(userMailOptions);

    console.log("All emails sent successfully");
    return NextResponse.json({ message: "Emails sent successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Email API Error Details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command
    });
    
    return NextResponse.json(
      { error: `메일 발송 실패: ${error.message}` },
      { status: 500 }
    );
  }
}
