import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 모든 카테고리 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const active = url.searchParams.get("active");

    let query = supabase
      .from("permission_categories")
      .select("*")
      .order("display_order", { ascending: true });

    // 활성 상태 필터
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data: categories, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "카테고리 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, display_name, icon, description, display_order } = body;

    // 필수 필드 검증
    if (!name || !display_name) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 카테고리 이름 중복 검사
    const { data: existingCategory } = await supabase
      .from("permission_categories")
      .select("id")
      .eq("name", name)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리 이름입니다." },
        { status: 400 }
      );
    }

    // 카테고리 생성
    const { data: category, error } = await supabase
      .from("permission_categories")
      .insert({
        name,
        display_name,
        icon: icon || "📁",
        description,
        display_order: display_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    await supabase.from("activity_logs").insert({
      user_id: "current-user-id",
      action: "create",
      resource_type: "permission_category",
      resource_id: category.id,
      resource_title: category.display_name,
      details: {
        category_name: name,
        display_name,
        icon,
        display_order,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "카테고리 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 카테고리 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { id, name, display_name, icon, description, display_order, is_active } = body;

    // 필수 필드 검증
    if (!id || !name || !display_name) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 카테고리 존재 여부 확인
    const { data: existingCategory } = await supabase
      .from("permission_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingCategory) {
      return NextResponse.json(
        { error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    // 카테고리 이름 중복 검사 (자기 자신 제외)
    const { data: duplicateCategory } = await supabase
      .from("permission_categories")
      .select("id")
      .eq("name", name)
      .neq("id", id)
      .single();

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "이미 존재하는 카테고리 이름입니다." },
        { status: 400 }
      );
    }

    // 카테고리 수정
    const { data: category, error } = await supabase
      .from("permission_categories")
      .update({
        name,
        display_name,
        icon: icon || "📁",
        description,
        display_order: display_order || 0,
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
      resource_type: "permission_category",
      resource_id: id,
      resource_title: category.display_name,
      details: {
        old_data: existingCategory,
        new_data: category,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json(
      { error: "카테고리 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE - 카테고리 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "카테고리 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 카테고리 존재 여부 확인
    const { data: existingCategory } = await supabase
      .from("permission_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (!existingCategory) {
      return NextResponse.json(
        { error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    // 카테고리를 사용하는 권한이 있는지 확인
    const { data: permissions } = await supabase
      .from("permissions")
      .select("id")
      .eq("category", existingCategory.name);

    if (permissions && permissions.length > 0) {
      return NextResponse.json(
        { error: "이 카테고리는 현재 권한들이 사용 중이어서 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 카테고리 삭제
    const { error } = await supabase
      .from("permission_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    await supabase.from("activity_logs").insert({
      user_id: "current-user-id",
      action: "delete",
      resource_type: "permission_category",
      resource_id: id,
      resource_title: existingCategory.display_name,
      details: {
        deleted_category: existingCategory,
      },
    });

    return NextResponse.json({ message: "카테고리가 삭제되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { error: "카테고리 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}