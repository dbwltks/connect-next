import { createClient } from "@/utils/supabase/client";
import { queueLog } from "./logBatchProcessor";
import {
  LogLevel,
  shouldLog,
  shouldLogAction,
  maskSensitiveData,
  getLogConfig,
} from "./logConfig";
import { logAdminAccess } from "./securityLogger";

// 활동 로그 타입 정의
export interface ActivityLog {
  id: string;
  user_id: string;
  action:
    | "create"
    | "update"
    | "delete"
    | "view"
    | "publish"
    | "unpublish"
    | "error";
  resource_type:
    | "board_post"
    | "calendar_event"
    | "comment"
    | "draft"
    | "file"
    | "system"
    | "permission"
    | "role"
    | "user_role";
  resource_id?: string;
  resource_title?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  level?: number;
}

// 활동 로그 생성 함수
export async function createActivityLog({
  userId,
  action,
  resourceType,
  resourceId,
  resourceTitle,
  details = {},
  request,
  level = LogLevel.INFO,
}: {
  userId: string;
  action: ActivityLog["action"];
  resourceType: ActivityLog["resource_type"];
  resourceId?: string;
  resourceTitle?: string;
  details?: Record<string, any>;
  request?: Request;
  level?: LogLevel;
}) {
  console.log("[ActivityLog DEBUG] 로그 함수 호출됨:", {
    userId,
    action,
    resourceType,
    resourceId,
    resourceTitle,
    level,
  });

  try {
    // 로그 레벨 체크
    const config = getLogConfig();
    console.log("[ActivityLog DEBUG] 설정:", config);

    if (!shouldLog(level)) {
      console.log("[ActivityLog DEBUG] 로그 레벨로 인해 스킵됨");
      return null;
    }

    // 액션 및 리소스 타입 필터링
    if (!shouldLogAction(action, resourceType)) {
      return null;
    }

    // 요청 정보에서 IP와 User-Agent 추출
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      // Next.js API route에서 요청 정보 추출
      ipAddress =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined;
      userAgent = request.headers.get("user-agent") || undefined;
    } else if (typeof window !== "undefined") {
      // 클라이언트 사이드에서 실행되는 경우
      userAgent = navigator.userAgent;
    }

    // 관리자 접근 로깅
    if (config.enableSecurityLog) {
      // 사용자 정보 가져와서 관리자인지 확인
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.user_metadata?.role === "admin") {
        logAdminAccess(
          userId,
          action,
          `${resourceType}:${resourceId || "unknown"}`,
          ipAddress,
          userAgent
        );
      }
    }

    // 민감 데이터 마스킹
    const maskedDetails = maskSensitiveData(details);

    const logData = {
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_title: resourceTitle,
      details: maskedDetails,
      ip_address: ipAddress,
      user_agent: userAgent,
      level,
    };

    console.log("[ActivityLog DEBUG] 배치 처리 여부:", config.enableBatching);

    // 배치 처리 또는 즉시 처리
    if (config.enableBatching) {
      queueLog(userId, action, resourceType, {
        resourceId,
        resourceTitle,
        details: maskedDetails,
        ipAddress,
        userAgent,
        level,
      });

      // 배치 처리 시에는 로컬 반환
      return {
        id: "queued",
        ...logData,
        created_at: new Date().toISOString(),
      };
    } else {
      // API 라우트를 통한 즉시 처리 (실무용)
      try {
        // 현재 사용자 인증 토큰 가져오기
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession(); // API 호출을 위해 access_token이 필요하므로 getSession 유지

        if (!session?.access_token) {
          console.warn("활동 로그: 인증 토큰이 없습니다");
          return null;
        }

        const response = await fetch("/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId,
            action,
            resourceType,
            resourceId,
            resourceTitle,
            details: maskedDetails,
            level,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("활동 로그 API 오류:", errorData);
          return null;
        }

        const result = await response.json();

        // 성공 로그 (개발 환경에서만)
        if (process.env.NODE_ENV === "development") {
          console.log(`[ActivityLog] ${action} ${resourceType}:`, {
            userId,
            resourceId,
            resourceTitle:
              resourceTitle?.substring(0, 50) +
              (resourceTitle && resourceTitle.length > 50 ? "..." : ""),
            level: LogLevel[level],
          });
        }

        return result.data;
      } catch (fetchError) {
        console.error("활동 로그 생성 중 네트워크 오류:", fetchError);
        return null;
      }
    }
  } catch (error) {
    console.error("활동 로그 생성 중 예외 발생:", error);

    // 오류 로그 생성 (재귀 호출 방지)
    if (level !== LogLevel.ERROR) {
      createActivityLog({
        userId,
        action: "error",
        resourceType: "system" as any,
        resourceTitle: "Log creation failed",
        details: {
          originalAction: action,
          originalResourceType: resourceType,
          error: error instanceof Error ? error.message : String(error),
        },
        level: LogLevel.ERROR,
      });
    }

    return null;
  }
}

// 게시글 관련 로그 생성 함수들
export const logBoardPostCreate = (
  userId: string,
  postId: string,
  title: string,
  details?: Record<string, any>
) => {
  console.log("[DEBUG] logBoardPostCreate 호출됨:", {
    userId,
    postId,
    title,
    details,
  });
  return createActivityLog({
    userId,
    action: "create",
    resourceType: "board_post",
    resourceId: postId,
    resourceTitle: title,
    details: {
      ...details,
      content_length: details?.content_length || 0,
      has_files: details?.has_files || false,
    },
    level: LogLevel.INFO,
  });
};

export const logBoardPostUpdate = (
  userId: string,
  postId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "update",
    resourceType: "board_post",
    resourceId: postId,
    resourceTitle: title,
    details: {
      ...details,
      content_length: details?.content_length || 0,
      has_files: details?.has_files || false,
    },
    level: LogLevel.INFO,
  });

export const logBoardPostDelete = (
  userId: string,
  postId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "board_post",
    resourceId: postId,
    resourceTitle: title,
    details: {
      ...details,
      had_files: details?.had_files || false,
    },
    level: LogLevel.WARN, // 삭제는 WARN 레벨
  });

export const logBoardPostPublish = (
  userId: string,
  postId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "publish",
    resourceType: "board_post",
    resourceId: postId,
    resourceTitle: title,
    details,
    level: LogLevel.INFO,
  });

// 초안 관련 로그 생성 함수들
export const logDraftCreate = (
  userId: string,
  draftId: string,
  title: string
) =>
  createActivityLog({
    userId,
    action: "create",
    resourceType: "draft",
    resourceId: draftId,
    resourceTitle: title,
    level: LogLevel.DEBUG, // 초안은 DEBUG 레벨
  });

export const logDraftDelete = (
  userId: string,
  draftId: string,
  title: string
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "draft",
    resourceId: draftId,
    resourceTitle: title,
    level: LogLevel.DEBUG, // 초안 삭제도 DEBUG 레벨
  });

// 일정 관련 로그 생성 함수들
export const logCalendarEventCreate = (
  userId: string,
  eventId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "create",
    resourceType: "calendar_event",
    resourceId: eventId,
    resourceTitle: title,
    details: {
      ...details,
      start_date: details?.start_date,
      category: details?.category,
      department: details?.department,
      is_all_day: details?.is_all_day || false,
    },
    level: LogLevel.INFO,
  });

export const logCalendarEventUpdate = (
  userId: string,
  eventId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "update",
    resourceType: "calendar_event",
    resourceId: eventId,
    resourceTitle: title,
    details: {
      ...details,
      start_date: details?.start_date,
      category: details?.category,
      department: details?.department,
      is_all_day: details?.is_all_day || false,
    },
    level: LogLevel.INFO,
  });

export const logCalendarEventDelete = (
  userId: string,
  eventId: string,
  title: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "calendar_event",
    resourceId: eventId,
    resourceTitle: title,
    details: {
      ...details,
      start_date: details?.start_date,
      category: details?.category,
      department: details?.department,
    },
    level: LogLevel.WARN,
  });

// 댓글 관련 로그 생성 함수들
export const logCommentCreate = (
  userId: string,
  commentId: string,
  postTitle: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "create",
    resourceType: "comment",
    resourceId: commentId,
    resourceTitle: `댓글: ${postTitle}`,
    details: {
      ...details,
      post_id: details?.post_id,
    },
    level: LogLevel.INFO,
  });

export const logCommentDelete = (
  userId: string,
  commentId: string,
  postTitle: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "comment",
    resourceId: commentId,
    resourceTitle: `댓글: ${postTitle}`,
    details: {
      ...details,
      post_id: details?.post_id,
    },
    level: LogLevel.WARN,
  });

// 권한 관련 로그 생성 함수들
export const logPermissionGrant = (
  userId: string,
  targetUserId: string,
  permission: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "create",
    resourceType: "permission",
    resourceId: targetUserId,
    resourceTitle: `권한 부여: ${permission}`,
    details: {
      ...details,
      permission,
      target_user_id: targetUserId,
    },
    level: LogLevel.WARN, // 권한 변경은 중요하므로 WARN
  });

export const logPermissionRevoke = (
  userId: string,
  targetUserId: string,
  permission: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "permission",
    resourceId: targetUserId,
    resourceTitle: `권한 회수: ${permission}`,
    details: {
      ...details,
      permission,
      target_user_id: targetUserId,
    },
    level: LogLevel.WARN,
  });

export const logRoleChange = (
  userId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "update",
    resourceType: "user_role",
    resourceId: targetUserId,
    resourceTitle: `역할 변경: ${oldRole} → ${newRole}`,
    details: {
      ...details,
      old_role: oldRole,
      new_role: newRole,
      target_user_id: targetUserId,
    },
    level: LogLevel.WARN,
  });

export const logRoleCreate = (
  userId: string,
  roleId: string,
  roleName: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "create",
    resourceType: "role",
    resourceId: roleId,
    resourceTitle: `역할 생성: ${roleName}`,
    details: {
      ...details,
      role_name: roleName,
    },
    level: LogLevel.INFO,
  });

export const logRoleUpdate = (
  userId: string,
  roleId: string,
  roleName: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "update",
    resourceType: "role",
    resourceId: roleId,
    resourceTitle: `역할 수정: ${roleName}`,
    details: {
      ...details,
      role_name: roleName,
    },
    level: LogLevel.INFO,
  });

export const logRoleDelete = (
  userId: string,
  roleId: string,
  roleName: string,
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "delete",
    resourceType: "role",
    resourceId: roleId,
    resourceTitle: `역할 삭제: ${roleName}`,
    details: {
      ...details,
      role_name: roleName,
    },
    level: LogLevel.WARN,
  });

export const logPermissionReview = (
  userId: string,
  targetUserId: string,
  action: string,
  revokedPermissions: string[],
  details?: Record<string, any>
) =>
  createActivityLog({
    userId,
    action: "update",
    resourceType: "permission",
    resourceId: targetUserId,
    resourceTitle: `권한 리뷰: ${action}`,
    details: {
      ...details,
      review_action: action,
      revoked_permissions: revokedPermissions,
      target_user_id: targetUserId,
    },
    level: LogLevel.WARN,
  });

// 활동 로그 조회 함수들
export async function getActivityLogs({
  userId,
  resourceType,
  action,
  limit = 50,
  offset = 0,
}: {
  userId?: string;
  resourceType?: ActivityLog["resource_type"];
  action?: ActivityLog["action"];
  limit?: number;
  offset?: number;
}) {
  try {
    // 현재 사용자 세션 토큰 가져오기
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.warn("활동 로그 조회: 인증 토큰이 없습니다");
      return [];
    }

    // API 라우트를 통한 로그 조회
    const searchParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (userId) searchParams.append("userId", userId);
    if (resourceType) searchParams.append("resourceType", resourceType);
    if (action) searchParams.append("action", action);

    const response = await fetch(`/api/logs?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("활동 로그 조회 API 오류:", errorData);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("활동 로그 조회 중 예외 발생:", error);
    return [];
  }
}

// 사용자별 활동 통계 조회
export async function getUserActivityStats(userId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("action, resource_type")
      .eq("user_id", userId);

    if (error) {
      console.error("활동 통계 조회 오류:", error);
      return null;
    }

    // 통계 집계
    const stats = data?.reduce(
      (acc: Record<string, Record<string, number>>, log: any) => {
        if (!acc[log.resource_type]) {
          acc[log.resource_type] = {};
        }
        if (!acc[log.resource_type][log.action]) {
          acc[log.resource_type][log.action] = 0;
        }
        acc[log.resource_type][log.action] += 1;
        return acc;
      },
      {}
    );

    return stats;
  } catch (error) {
    console.error("활동 통계 조회 중 예외 발생:", error);
    return null;
  }
}
