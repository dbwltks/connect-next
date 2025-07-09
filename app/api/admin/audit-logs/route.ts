import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 감사 로그 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const action = url.searchParams.get("action");
    const userId = url.searchParams.get("userId");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let query = supabase
      .from("activity_logs")
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        resource_title,
        details,
        ip_address,
        user_agent,
        created_at
      `)
      .order("created_at", { ascending: false });

    // 필터 적용
    if (action) {
      query = query.eq("action", action);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 통계 정보도 함께 반환 (activity_logs는 성공/실패 구분이 없으므로 단순화)
    const { data: stats } = await supabase
      .from("activity_logs")
      .select("action, resource_type")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const statistics = {
      total_24h: stats?.length || 0,
      permission_related: stats?.filter(s => 
        s.resource_type === 'permission' || 
        s.resource_type === 'role' || 
        s.resource_type === 'user_role'
      ).length || 0,
      system_actions: stats?.filter(s => s.resource_type === 'system').length || 0,
    };

    return NextResponse.json({ 
      logs: logs || [], 
      total: logs?.length || 0,
      page,
      limit,
      statistics
    });
  } catch (error) {
    return NextResponse.json(
      { error: "감사 로그 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}