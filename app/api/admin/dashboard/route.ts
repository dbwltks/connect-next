import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 통계
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("role, created_at, last_login, is_active");

    const safeUsers = users || [];

    // 역할 통계
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("*");

    const safeRoles = roles || [];

    // 권한 통계
    const { data: permissions, error: permissionsError } = await supabase
      .from("permissions")
      .select("category, is_active");

    const safePermissions = permissions || [];

    // 카테고리 통계
    const { data: categories, error: categoriesError } = await supabase
      .from("permission_categories")
      .select("*");

    const safeCategories = categories || [];

    // 최근 활동 로그 (관계 없이 단순 조회)
    const { data: recentActivity, error: activityError } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    // 활동 로그 오류는 무시하고 빈 배열로 처리
    const safeRecentActivity = recentActivity || [];

    // 오늘 날짜 계산
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // 사용자 통계 계산
    const userStats = {
      total: safeUsers.length,
      active: safeUsers.filter(u => u.is_active).length,
      inactive: safeUsers.filter(u => !u.is_active).length,
      new_this_week: safeUsers.filter(u => new Date(u.created_at) >= lastWeek).length,
      new_this_month: safeUsers.filter(u => new Date(u.created_at) >= lastMonth).length,
      recent_login: safeUsers.filter(u => u.last_login && new Date(u.last_login) >= yesterday).length,
      by_role: safeUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // 역할 통계 계산
    const roleStats = {
      total: safeRoles.length,
      active: safeRoles.filter(r => r.is_active).length,
      system: safeRoles.filter(r => r.is_system).length,
      custom: safeRoles.filter(r => !r.is_system).length,
    };

    // 권한 통계 계산
    const permissionStats = {
      total: safePermissions.length,
      active: safePermissions.filter(p => p.is_active).length,
      inactive: safePermissions.filter(p => !p.is_active).length,
      by_category: safePermissions.reduce((acc, permission) => {
        const category = permission.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // 카테고리 통계 계산
    const categoryStats = {
      total: safeCategories.length,
      active: safeCategories.filter(c => c.is_active).length,
      inactive: safeCategories.filter(c => !c.is_active).length,
    };

    // 최근 24시간 활동 통계
    const yesterday24h = new Date(today);
    yesterday24h.setHours(yesterday24h.getHours() - 24);
    
    const recentActivityStats = {
      total_24h: safeRecentActivity.filter(a => new Date(a.created_at) >= yesterday24h).length,
      by_action: safeRecentActivity.reduce((acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      userStats,
      roleStats,
      permissionStats,
      categoryStats,
      recentActivity: safeRecentActivity,
      recentActivityStats,
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return NextResponse.json(
      { error: "대시보드 데이터 로딩 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}