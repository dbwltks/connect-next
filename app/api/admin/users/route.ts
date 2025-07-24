import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 모든 사용자 조회 (다중 역할 지원)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search");
    const roleFilter = url.searchParams.get("role");

    let query = supabase
      .from("users")
      .select(`
        id,
        username,
        email,
        role,
        roles,
        is_active,
        created_at,
        last_login,
        last_permission_review,
        is_approved,
        approved_at,
        nickname
      `)
      .order("created_at", { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 사용자별 역할 정보 처리 (JSON roles 필드 사용)
    const usersWithRoles = (users || []).map(user => {
      // JSON roles 필드에서 역할 정보 가져오기
      const userRoles = user.roles || [];
      
      // 역할 필터링 (특정 역할이 요청된 경우)
      if (roleFilter && roleFilter !== "all") {
        const hasRole = userRoles.includes(roleFilter) || user.role === roleFilter;
        if (!hasRole) {
          return null; // 필터링된 사용자
        }
      }

      return {
        ...user,
        user_roles: userRoles,
        permissions_count: userRoles.length, // 단순하게 역할 수로 계산
      };
    }).filter(user => user !== null);

    return NextResponse.json({
      users: usersWithRoles,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "사용자 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 새 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { username, email, role, roles, password } = body;

    // 필수 필드 검증
    if (!username || !email || (!role && (!roles || roles.length === 0))) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 검사
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 존재하는 이메일입니다." },
        { status: 400 }
      );
    }

    // 역할 유효성 검사
    const { data: roleExists } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single();

    if (!roleExists) {
      return NextResponse.json(
        { error: "존재하지 않는 역할입니다." },
        { status: 400 }
      );
    }

    // 역할 배열 처리
    const userRoles = roles || (role ? [role] : ["member"]);

    // 사용자 생성 (실제로는 Supabase Auth를 사용해야 함)
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username,
        email,
        role: role || userRoles[0], // 레거시 호환성
        roles: userRoles,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "사용자 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}