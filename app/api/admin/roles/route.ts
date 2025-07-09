import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 모든 역할 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .order("level", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roles });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 새 역할 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, display_name, description, level } = body;

    // 필수 필드 검증
    if (!name || !display_name || level === undefined) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 역할 이름 중복 검사
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 역할 이름입니다." },
        { status: 400 }
      );
    }

    const { data: role, error } = await supabase
      .from("roles")
      .insert({
        name,
        display_name,
        description,
        level: parseInt(level),
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 역할 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, name, display_name, description, level, is_active } = body;

    // 필수 필드 검증
    if (!id || !name || !display_name) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 역할 존재 여부 확인
    const { data: existingRole } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingRole) {
      return NextResponse.json(
        { error: "존재하지 않는 역할입니다." },
        { status: 404 }
      );
    }

    // 시스템 역할 수정 방지
    if (existingRole.is_system) {
      return NextResponse.json(
        { error: "시스템 역할은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 역할 이름 중복 검사 (자기 자신 제외)
    const { data: duplicateRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .single();

    if (duplicateRole) {
      return NextResponse.json(
        { error: "이미 존재하는 역할 이름입니다." },
        { status: 400 }
      );
    }

    // 역할 수정
    const { data: role, error } = await supabase
      .from("roles")
      .update({
        name,
        display_name,
        description,
        level: parseInt(level) || 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
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
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "역할 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 역할 존재 여부 확인
    const { data: existingRole } = await supabase
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingRole) {
      return NextResponse.json(
        { error: "존재하지 않는 역할입니다." },
        { status: 404 }
      );
    }

    // 시스템 역할 삭제 방지
    if (existingRole.is_system) {
      return NextResponse.json(
        { error: "시스템 역할은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 역할을 사용하는 사용자가 있는지 확인
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("role", existingRole.name);

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: "이 역할을 사용하는 사용자가 있어서 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 역할 삭제
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