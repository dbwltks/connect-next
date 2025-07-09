import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 특정 역할 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: role, error } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!role) {
      return NextResponse.json(
        { error: "역할을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 역할 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { name, display_name, description, level, is_active } = body;

    // 시스템 역할인지 확인
    const { data: existingRole } = await supabase
      .from("roles")
      .select("is_system, name")
      .eq("id", id)
      .single();

    if (existingRole?.is_system && name !== existingRole.name) {
      return NextResponse.json(
        { error: "시스템 역할의 이름은 변경할 수 없습니다." },
        { status: 400 }
      );
    }

    // 역할 이름 중복 검사 (자신 제외)
    if (name) {
      const { data: existing } = await supabase
        .from("roles")
        .select("id")
        .eq("name", name)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "이미 존재하는 역할 이름입니다." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = parseInt(level);
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: role, error } = await supabase
      .from("roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE - 역할 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 시스템 역할인지 확인
    const { data: role } = await supabase
      .from("roles")
      .select("is_system, name")
      .eq("id", id)
      .single();

    if (role?.is_system) {
      return NextResponse.json(
        { error: "시스템 역할은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 해당 역할을 사용하는 사용자가 있는지 확인
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("role", role?.name)
      .limit(1);

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: "이 역할을 사용하는 사용자가 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "역할이 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}