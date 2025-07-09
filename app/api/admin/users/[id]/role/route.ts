import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PUT - 사용자 역할 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { role, reason } = body;

    // 역할 존재 확인
    const { data: roleData } = await supabase
      .from("roles")
      .select("name")
      .eq("name", role)
      .single();

    if (!roleData) {
      return NextResponse.json(
        { error: "존재하지 않는 역할입니다." },
        { status: 400 }
      );
    }

    // 현재 사용자의 역할 조회
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    // 사용자 역할 업데이트
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 역할 변경 이력 기록
    await supabase.from("user_role_history").insert({
      user_id: id,
      old_role: currentUser?.role || null,
      new_role: role,
      reason: reason || null,
    });

    return NextResponse.json({ message: "사용자 역할이 변경되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}