import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 감사 로그 CSV 내보내기
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: logs, error } = await supabase
      .from("activity_logs")
      .select(`
        created_at,
        action,
        resource_type,
        resource_id,
        resource_title,
        details,
        ip_address,
        user_agent,
        users (
          username,
          email,
          role
        )
      `)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // CSV 헤더
    const csvHeaders = [
      "날짜시간",
      "사용자명",
      "이메일", 
      "역할",
      "작업",
      "리소스타입",
      "리소스ID",
      "리소스제목",
      "IP주소",
      "사용자에이전트",
      "세부정보"
    ].join(",");

    // CSV 데이터 생성
    const csvData = logs?.map(log => [
      `"${new Date(log.created_at).toLocaleString()}"`,
      `"${(log.users as any)?.username || 'Unknown'}"`,
      `"${(log.users as any)?.email || 'Unknown'}"`,
      `"${(log.users as any)?.role || 'Unknown'}"`,
      `"${log.action}"`,
      `"${log.resource_type}"`,
      `"${log.resource_id || ''}"`,
      `"${log.resource_title || ''}"`,
      `"${log.ip_address || ''}"`,
      `"${(log.user_agent || '').replace(/"/g, '""')}"`,
      `"${log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''}"`
    ].join(",")).join("\n") || "";

    const csvContent = `\uFEFF${csvHeaders}\n${csvData}`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "감사 보고서 내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}