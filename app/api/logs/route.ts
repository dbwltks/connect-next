import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 서비스 역할 클라이언트 (RLS 무시)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서비스 역할 키
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();

    // 요청 헤더에서 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 서비스 역할로 로그 삽입 (RLS 무시)
    const { data, error } = await supabaseAdmin
      .from("activity_logs")
      .insert([
        {
          user_id: logData.userId,
          action: logData.action,
          resource_type: logData.resourceType,
          resource_id: logData.resourceId,
          resource_title: logData.resourceTitle,
          details: logData.details,
          ip_address:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          level: logData.level || 1,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("로그 삽입 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
