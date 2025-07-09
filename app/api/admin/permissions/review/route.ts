import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - 권한 리뷰 대상 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const department = url.searchParams.get("department");

    let query = supabase
      .from("users")
      .select(`
        id,
        username,
        email,
        role,
        last_login,
        created_at,
        last_permission_review,
        is_active
      `);

    // 90일 이상 권한 검토가 없었던 사용자 필터링
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (status === "needs_review") {
      query = query.or(`last_permission_review.is.null,last_permission_review.lt.${threeMonthsAgo.toISOString()}`);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 각 사용자의 권한 수 계산
    const reviewData = await Promise.all(
      (users || []).map(async (user) => {
        // 사용자의 역할에 따른 권한 수 계산
        const { data: roleData } = await supabase
          .from("roles")
          .select(`
            role_permissions (
              permission_id
            )
          `)
          .eq("name", user.role)
          .single();

        const permissionsCount = roleData?.role_permissions?.length || 0;
        const riskScore = calculateRiskScore(user, permissionsCount);
        const lastReview = user.last_permission_review;
        const daysSinceReview = lastReview 
          ? Math.floor((Date.now() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          ...user,
          permissions_count: permissionsCount,
          risk_score: riskScore,
          days_since_review: daysSinceReview,
          review_priority: getRiskPriority(riskScore, daysSinceReview),
        };
      })
    );

    // 리스크 점수 순으로 정렬
    reviewData?.sort((a, b) => b.risk_score - a.risk_score);

    return NextResponse.json({ users: reviewData });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 리뷰 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST - 권한 리뷰 실행
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { user_id, reviewer_id, action, permissions_to_revoke, comments } = body;

    // 1. 권한 회수 처리
    if (action === "revoke_permissions" && permissions_to_revoke?.length > 0) {
      for (const permission of permissions_to_revoke) {
        await supabase
          .from("role_permissions")
          .delete()
          .match({
            role_id: await getRoleId(supabase, user_id),
            permission_id: permission
          });
      }
    }

    // 2. 리뷰 기록 생성
    const { error: reviewError } = await supabase
      .from("permission_reviews")
      .insert({
        user_id,
        reviewer_id,
        action,
        revoked_permissions: permissions_to_revoke || [],
        comments,
        reviewed_at: new Date().toISOString(),
      });

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    // 3. 사용자 테이블의 마지막 리뷰 날짜 업데이트
    await supabase
      .from("users")
      .update({ last_permission_review: new Date().toISOString() })
      .eq("id", user_id);

    // 4. 감사 로그 기록
    await supabase
      .from("audit_logs")
      .insert({
        user_id: reviewer_id,
        action: "permission_review",
        resource: "user_permissions",
        resource_id: user_id,
        success: true,
        additional_data: JSON.stringify({
          action,
          revoked_permissions: permissions_to_revoke,
          comments,
        }),
      });

    return NextResponse.json({ 
      message: "권한 리뷰가 완료되었습니다.",
      revoked_count: permissions_to_revoke?.length || 0 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "권한 리뷰 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 리스크 점수 계산 함수
function calculateRiskScore(user: any, permissionCount: number): number {
  let score = 0;

  // 1. 권한 수량 (많을수록 위험)
  score += Math.min(permissionCount * 2, 50);

  // 2. 역할별 기본 위험도
  const roleRisk = {
    admin: 30,
    pastor: 20,
    elder: 15,
    teacher: 10,
    member: 5,
  };
  score += roleRisk[user.role as keyof typeof roleRisk] || 0;

  // 3. 최근 로그인 (오래될수록 위험)
  if (user.last_login) {
    const daysSinceLogin = Math.floor(
      (Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLogin > 90) score += 40;
    else if (daysSinceLogin > 30) score += 20;
    else if (daysSinceLogin > 7) score += 10;
  } else {
    score += 50; // 로그인 기록 없음
  }

  // 4. 계정 활성 상태
  if (!user.is_active) {
    score += 30; // 비활성 계정은 위험
  }

  // 5. 권한 리뷰 기간
  if (user.last_permission_review) {
    const daysSinceReview = Math.floor(
      (Date.now() - new Date(user.last_permission_review).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceReview > 180) score += 30;
    else if (daysSinceReview > 90) score += 20;
    else if (daysSinceReview > 60) score += 10;
  } else {
    score += 40; // 리뷰 기록 없음
  }

  return Math.min(score, 100); // 최대 100점
}

// 리뷰 우선순위 결정
function getRiskPriority(riskScore: number, daysSinceReview: number): string {
  if (riskScore >= 80 || daysSinceReview >= 180) return "critical";
  if (riskScore >= 60 || daysSinceReview >= 120) return "high";
  if (riskScore >= 40 || daysSinceReview >= 90) return "medium";
  return "low";
}

// Helper 함수
async function getRoleId(supabase: any, userId: string): Promise<string | null> {
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (!user) return null;

  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", user.role)
    .single();

  return role?.id || null;
}