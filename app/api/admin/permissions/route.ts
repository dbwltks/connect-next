import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 모든 권한 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const active = url.searchParams.get("active");

    let query = supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("display_name", { ascending: true });

    // 카테고리 필터
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // 활성 상태 필터
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data: permissions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ permissions: permissions || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 새 권한 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, display_name, description, category, data_scope } = body;

    // 필수 필드 검증
    if (!name || !display_name || !category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 권한 이름 중복 검사
    const { data: existingPermission } = await supabase
      .from("permissions")
      .select("id")
      .eq("name", name)
      .single();

    if (existingPermission) {
      return NextResponse.json(
        { error: "이미 존재하는 권한 이름입니다." },
        { status: 400 }
      );
    }

    // 권한 생성
    const { data: permission, error } = await supabase
      .from("permissions")
      .insert({
        name,
        display_name,
        description,
        category,
        data_scope: data_scope || "all",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    await supabase.from("activity_logs").insert({
      user_id: "current-user-id", // 실제로는 현재 로그인한 사용자 ID
      action: "create",
      resource_type: "permission",
      resource_id: permission.id,
      resource_title: permission.display_name,
      details: {
        permission_name: name,
        category,
        data_scope: data_scope || "all",
      },
    });

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 권한 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, name, display_name, description, category, data_scope, is_active } = body;

    // 필수 필드 검증
    if (!id || !name || !display_name || !category) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 권한 존재 여부 확인
    const { data: existingPermission } = await supabase
      .from("permissions")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingPermission) {
      return NextResponse.json(
        { error: "존재하지 않는 권한입니다." },
        { status: 404 }
      );
    }

    // 권한 이름 중복 검사 (자기 자신 제외)
    const { data: duplicatePermission } = await supabase
      .from("permissions")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .single();

    if (duplicatePermission) {
      return NextResponse.json(
        { error: "이미 존재하는 권한 이름입니다." },
        { status: 400 }
      );
    }

    // 권한 수정
    const { data: permission, error } = await supabase
      .from("permissions")
      .update({
        name,
        display_name,
        description,
        category,
        data_scope: data_scope || "all",
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    await supabase.from("activity_logs").insert({
      user_id: "current-user-id",
      action: "update",
      resource_type: "permission",
      resource_id: id,
      resource_title: permission.display_name,
      details: {
        old_data: existingPermission,
        new_data: permission,
      },
    });

    return NextResponse.json({ permission });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE - 권한 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "권한 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 권한 존재 여부 확인
    const { data: existingPermission } = await supabase
      .from("permissions")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingPermission) {
      return NextResponse.json(
        { error: "존재하지 않는 권한입니다." },
        { status: 404 }
      );
    }

    // 권한이 사용 중인지 확인
    const { data: rolePermissions } = await supabase
      .from("role_permissions")
      .select("role_id")
      .eq("permission_id", id);

    if (rolePermissions && rolePermissions.length > 0) {
      return NextResponse.json(
        { error: "이 권한은 현재 역할에 할당되어 있어 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 권한 삭제
    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    await supabase.from("activity_logs").insert({
      user_id: "current-user-id",
      action: "delete",
      resource_type: "permission",
      resource_id: id,
      resource_title: existingPermission.display_name,
      details: {
        deleted_permission: existingPermission,
      },
    });

    return NextResponse.json({ message: "권한이 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}