import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 특정 사용자의 역할 조회 (JSON roles 필드 사용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: user, error } = await supabase
      .from("users")
      .select("role, roles")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // JSON roles 필드에서 역할 정보 반환
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    
    return NextResponse.json({ roles: userRoles });
  } catch (error) {
    return NextResponse.json(
      { error: "사용자 역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - 사용자의 역할 설정 (JSON roles 필드 사용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { role_ids, roles } = body;

    // role_ids나 roles 둘 중 하나라도 있으면 처리
    const newRoles = roles || role_ids || [];

    if (!Array.isArray(newRoles)) {
      return NextResponse.json(
        { error: "역할 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // JSON roles 필드 업데이트
    const { error } = await supabase
      .from("users")
      .update({ 
        roles: newRoles,
        role: newRoles.length > 0 ? newRoles[0] : "member" // 레거시 호환성
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "역할이 설정되었습니다." });
  } catch (error: any) {
    console.error("역할 설정 오류:", error);
    return NextResponse.json(
      { 
        error: "역할 설정 중 오류가 발생했습니다.",
        details: error.message || error.toString()
      },
      { status: 500 }
    );
  }
}

// POST - 사용자에게 역할 추가 (JSON roles 필드 사용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { role_id, role } = body;
    const newRole = role || role_id;

    if (!newRole) {
      return NextResponse.json(
        { error: "역할이 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 사용자 역할 가져오기
    const { data: user } = await supabase
      .from("users")
      .select("roles")
      .eq("id", id)
      .single();

    const currentRoles = user?.roles || [];
    const updatedRoles = Array.from(new Set([...currentRoles, newRole])); // 중복 제거

    // 역할 추가
    const { error } = await supabase
      .from("users")
      .update({ roles: updatedRoles })
      .eq("id", id);

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

// DELETE - 사용자로부터 특정 역할 제거 (JSON roles 필드 사용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const url = new URL(request.url);
    const roleToRemove = url.searchParams.get("role_id") || url.searchParams.get("role");

    if (!roleToRemove) {
      return NextResponse.json(
        { error: "제거할 역할이 필요합니다." },
        { status: 400 }
      );
    }

    // 현재 사용자 역할 가져오기
    const { data: user } = await supabase
      .from("users")
      .select("roles")
      .eq("id", id)
      .single();

    const currentRoles = user?.roles || [];
    const updatedRoles = currentRoles.filter((role: string) => role !== roleToRemove);

    // 역할 제거
    const { error } = await supabase
      .from("users")
      .update({ 
        roles: updatedRoles,
        role: updatedRoles.length > 0 ? updatedRoles[0] : "member" // 레거시 호환성
      })
      .eq("id", id);

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