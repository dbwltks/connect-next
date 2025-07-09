import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 특정 역할의 권한 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: rolePermissions, error } = await supabase
      .from("role_permissions")
      .select(`
        permission_id,
        permissions (
          id,
          name,
          display_name,
          description,
          category
        )
      `)
      .eq("role_id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const permissions = rolePermissions?.map((rp: any) => rp.permissions) || [];

    return NextResponse.json({ permissions });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 역할의 권한 설정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { permission_ids } = body;

    // 기존 권한 관계 삭제
    await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", id);

    // 새 권한 관계 추가
    if (permission_ids && permission_ids.length > 0) {
      const rolePermissions = permission_ids.map((permission_id: string) => ({
        role_id: id,
        permission_id,
      }));

      const { error } = await supabase
        .from("role_permissions")
        .insert(rolePermissions);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "권한이 설정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}