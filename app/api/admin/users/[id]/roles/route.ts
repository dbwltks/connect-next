import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 특정 사용자의 역할 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: userRoles, error } = await supabase
      .from("user_roles")
      .select(`
        id,
        role_id,
        assigned_at,
        is_active,
        roles (
          id,
          name,
          display_name,
          description,
          level
        )
      `)
      .eq("user_id", id)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roles: userRoles || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "사용자 역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 사용자의 역할 설정 (다중 역할 지원)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { role_ids } = body;

    if (!Array.isArray(role_ids)) {
      return NextResponse.json(
        { error: "역할 ID 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 활성 역할들을 비활성화
    await supabase
      .from("user_roles")
      .update({ is_active: false })
      .eq("user_id", id);

    // 새 역할들 추가
    if (role_ids.length > 0) {
      const userRoles = role_ids.map((role_id: string) => ({
        user_id: id,
        role_id,
        is_active: true,
        assigned_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("user_roles")
        .upsert(userRoles, {
          onConflict: "user_id,role_id",
          ignoreDuplicates: false,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: "역할이 설정되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 사용자에게 역할 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { role_id } = body;

    if (!role_id) {
      return NextResponse.json(
        { error: "역할 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 역할 추가
    const { error } = await supabase
      .from("user_roles")
      .upsert({
        user_id: id,
        role_id,
        is_active: true,
        assigned_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,role_id",
        ignoreDuplicates: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "역할이 추가되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE - 사용자로부터 특정 역할 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const url = new URL(request.url);
    const role_id = url.searchParams.get("role_id");

    if (!role_id) {
      return NextResponse.json(
        { error: "역할 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 특정 역할 비활성화
    const { error } = await supabase
      .from("user_roles")
      .update({ is_active: false })
      .eq("user_id", id)
      .eq("role_id", role_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "역할이 제거되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "역할 제거 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}