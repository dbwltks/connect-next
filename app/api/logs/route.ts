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

// 로그 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");
    const userId = searchParams.get("userId");

    // 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 서비스 역할로 로그 조회 (RLS 무시)
    let query = supabaseAdmin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) query = query.eq("user_id", userId);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (action) query = query.eq("action", action);

    const { data, error } = await query;

    if (error) {
      console.error("로그 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 사용자 정보 조회해서 매핑 (auth.users에서만)
    const userIds = Array.from(
      new Set(data?.map((log) => log.user_id).filter(Boolean))
    );

    if (userIds.length === 0) {
      return NextResponse.json({ data: data || [] });
    }

    // auth.users에서 개별 사용자 정보 가져오기 (더 정확함)
    const userMap = new Map();

    for (const userId of userIds) {
      try {
        const { data: authUser, error: authUserError } =
          await supabaseAdmin.auth.admin.getUserById(userId);

        if (authUserError) {
          console.error(`사용자 ${userId} 조회 오류:`, authUserError);
          continue;
        }

        if (authUser?.user) {
          // users 테이블에서 nickname 가져오기
          const { data: userData } = await supabaseAdmin
            .from("users")
            .select("nickname, username")
            .eq("id", userId)
            .single();

          const displayName =
            userData?.nickname ||
            userData?.username ||
            authUser.user.email?.split("@")[0] ||
            "알수없음";

          userMap.set(userId, {
            id: userId,
            email: authUser.user.email,
            name: displayName,
            user_metadata: authUser.user.user_metadata,
          });
        }
      } catch (error) {
        console.error(`사용자 ${userId} 조회 실패:`, error);
      }
    }

    const logsWithUser =
      data?.map((log) => ({
        ...log,
        user: userMap.get(log.user_id) || {
          id: log.user_id,
          email: "알수없음",
          name: "알수없음",
        },
      })) || [];

    return NextResponse.json({ data: logsWithUser });
  } catch (error) {
    console.error("로그 조회 API 오류:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 로그 생성 API
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