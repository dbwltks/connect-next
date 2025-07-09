import { createClient } from "@/utils/supabase/client";
import { queueLog } from "./logBatchProcessor";
import { LogLevel, getLogConfig } from "./logConfig";

interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  timestamp: Date;
}

enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  ACCOUNT_LOCKED = "account_locked",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DATA_BREACH_ATTEMPT = "data_breach_attempt",
  ADMIN_ACCESS = "admin_access",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  BULK_DATA_ACCESS = "bulk_data_access",
  UNUSUAL_LOCATION = "unusual_location",
  MULTIPLE_FAILED_ATTEMPTS = "multiple_failed_attempts",
  SESSION_HIJACK_ATTEMPT = "session_hijack_attempt",
  MALICIOUS_REQUEST = "malicious_request",
}

enum SecuritySeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

class SecurityLogger {
  private supabase = createClient();
  private suspiciousActivityTracker = new Map<string, any>();
  private loginAttemptTracker = new Map<string, any>();

  // 보안 이벤트 로깅
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const config = getLogConfig();

    if (!config.enableSecurityLog) {
      return;
    }

    // 즉시 보안 로그 저장 (배치 처리하지 않음)
    try {
      const { error } = await this.supabase.from("security_logs").insert([
        {
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          session_id: event.sessionId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details,
          created_at: event.timestamp.toISOString(),
        },
      ]);

      if (error) {
        console.error("보안 로그 저장 실패:", error);
      }

      // 고위험 이벤트는 일반 로그에도 기록
      if (event.severity >= SecuritySeverity.HIGH) {
        queueLog(event.userId || "unknown", "security_event", "security", {
          resourceTitle: event.type,
          details: event.details,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          level: LogLevel.ERROR,
        });
      }

      // 실시간 알림 처리
      this.handleSecurityAlert(event);
    } catch (error) {
      console.error("보안 이벤트 로깅 오류:", error);
    }
  }

  // 로그인 시도 추적
  trackLoginAttempt(ipAddress: string, email: string, success: boolean): void {
    const key = `${ipAddress}_${email}`;
    const now = new Date();

    if (!this.loginAttemptTracker.has(key)) {
      this.loginAttemptTracker.set(key, {
        attempts: 0,
        lastAttempt: now,
        failures: 0,
      });
    }

    const tracker = this.loginAttemptTracker.get(key);
    tracker.attempts++;
    tracker.lastAttempt = now;

    if (success) {
      // 성공 시 추적 정보 초기화
      this.loginAttemptTracker.delete(key);

      this.logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        severity: SecuritySeverity.LOW,
        ipAddress,
        details: { email },
        timestamp: now,
      });
    } else {
      tracker.failures++;

      // 실패 횟수에 따른 보안 이벤트 생성
      let severity = SecuritySeverity.LOW;
      if (tracker.failures >= 5) {
        severity = SecuritySeverity.HIGH;
      } else if (tracker.failures >= 3) {
        severity = SecuritySeverity.MEDIUM;
      }

      this.logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILURE,
        severity,
        ipAddress,
        details: {
          email,
          failureCount: tracker.failures,
          consecutiveFailures: tracker.failures,
        },
        timestamp: now,
      });

      // 다중 실패 시 추가 이벤트
      if (tracker.failures >= 3) {
        this.logSecurityEvent({
          type: SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
          severity: SecuritySeverity.HIGH,
          ipAddress,
          details: {
            email,
            failureCount: tracker.failures,
            timeWindow: "1 hour",
          },
          timestamp: now,
        });
      }
    }

    // 1시간 후 추적 정보 자동 삭제
    setTimeout(
      () => {
        this.loginAttemptTracker.delete(key);
      },
      60 * 60 * 1000
    );
  }

  // 권한 위반 탐지
  detectUnauthorizedAccess(
    userId: string,
    resource: string,
    action: string,
    userRole: string,
    requiredRole: string
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      userId,
      details: {
        resource,
        action,
        userRole,
        requiredRole,
        reason: "Insufficient privileges",
      },
      timestamp: new Date(),
    });
  }

  // 대량 데이터 접근 탐지
  detectBulkDataAccess(
    userId: string,
    resourceType: string,
    count: number,
    timeWindow: number
  ): void {
    const key = `${userId}_${resourceType}`;
    const now = new Date();

    if (!this.suspiciousActivityTracker.has(key)) {
      this.suspiciousActivityTracker.set(key, {
        count: 0,
        startTime: now,
      });
    }

    const tracker = this.suspiciousActivityTracker.get(key);
    tracker.count += count;

    // 임계값 체크 (5분 내 100개 이상)
    const timeElapsed = now.getTime() - tracker.startTime.getTime();
    if (timeElapsed <= timeWindow && tracker.count >= 100) {
      this.logSecurityEvent({
        type: SecurityEventType.BULK_DATA_ACCESS,
        severity: SecuritySeverity.HIGH,
        userId,
        details: {
          resourceType,
          accessCount: tracker.count,
          timeWindow: `${timeWindow / 1000}s`,
          rate: `${tracker.count / (timeElapsed / 1000)}/s`,
        },
        timestamp: now,
      });
    }

    // 추적 정보 정리
    setTimeout(() => {
      this.suspiciousActivityTracker.delete(key);
    }, timeWindow);
  }

  // 관리자 접근 로깅
  logAdminAccess(
    userId: string,
    action: string,
    resource: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logSecurityEvent({
      type: SecurityEventType.ADMIN_ACCESS,
      severity: SecuritySeverity.MEDIUM,
      userId,
      ipAddress,
      userAgent,
      details: {
        action,
        resource,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }

  // 세션 하이재킹 탐지
  detectSessionHijacking(
    userId: string,
    sessionId: string,
    currentIp: string,
    previousIp: string,
    userAgent: string
  ): void {
    if (currentIp !== previousIp) {
      this.logSecurityEvent({
        type: SecurityEventType.SESSION_HIJACK_ATTEMPT,
        severity: SecuritySeverity.CRITICAL,
        userId,
        sessionId,
        ipAddress: currentIp,
        userAgent,
        details: {
          previousIp,
          currentIp,
          reason: "IP address changed during session",
        },
        timestamp: new Date(),
      });
    }
  }

  // 악성 요청 탐지
  detectMaliciousRequest(
    request: any,
    ipAddress: string,
    userAgent: string
  ): void {
    const suspiciousPatterns = [
      /(<script|javascript:|data:)/i,
      /(union|select|insert|update|delete|drop|exec)/i,
      /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i,
      /(eval\(|exec\(|system\()/i,
    ];

    const requestString = JSON.stringify(request);
    const detectedPatterns = suspiciousPatterns.filter((pattern) =>
      pattern.test(requestString)
    );

    if (detectedPatterns.length > 0) {
      this.logSecurityEvent({
        type: SecurityEventType.MALICIOUS_REQUEST,
        severity: SecuritySeverity.HIGH,
        ipAddress,
        userAgent,
        details: {
          requestData: requestString.substring(0, 1000), // 처음 1000자만
          detectedPatterns: detectedPatterns.map((p: any) => p.source),
          reason: "Suspicious patterns detected in request",
        },
        timestamp: new Date(),
      });
    }
  }

  // 보안 알림 처리
  private handleSecurityAlert(event: SecurityEvent): void {
    if (event.severity >= SecuritySeverity.HIGH) {
      // 고위험 이벤트는 즉시 알림
      console.warn("🚨 보안 알림:", {
        type: event.type,
        severity: event.severity,
        userId: event.userId,
        details: event.details,
      });

      // 실제 환경에서는 이메일, 슬랙, SMS 등으로 알림
      this.sendSecurityAlert(event);
    }
  }

  // 보안 알림 전송 (실제 구현에서는 이메일/슬랙 연동)
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // 임시로 로컬 스토리지에 알림 저장
    if (typeof window !== "undefined") {
      const alerts = JSON.parse(
        localStorage.getItem("security_alerts") || "[]"
      );
      alerts.push({
        ...event,
        timestamp: event.timestamp.toISOString(),
        acknowledged: false,
      });

      // 최근 100개만 유지
      if (alerts.length > 100) {
        alerts.splice(0, alerts.length - 100);
      }

      localStorage.setItem("security_alerts", JSON.stringify(alerts));
    }
  }

  // 보안 통계 조회
  async getSecurityStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data, error } = await this.supabase
        .from("security_logs")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) {
        console.error("보안 통계 조회 실패:", error);
        return null;
      }

      // 통계 계산
      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};
      const uniqueIPs = new Set<string>();
      const uniqueUsers = new Set<string>();

      data.forEach((log: any) => {
        // 타입별 통계
        eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1;

        // 심각도별 통계
        eventsBySeverity[log.severity] =
          (eventsBySeverity[log.severity] || 0) + 1;

        // IP 및 사용자 수집
        if (log.ip_address) uniqueIPs.add(log.ip_address);
        if (log.user_id) uniqueUsers.add(log.user_id);
      });

      const stats = {
        totalEvents: data.length,
        eventsByType,
        eventsBySeverity,
        uniqueIPs: uniqueIPs.size,
        uniqueUsers: uniqueUsers.size,
        timeline: [],
      };

      return stats;
    } catch (error) {
      console.error("보안 통계 조회 오류:", error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const securityLogger = new SecurityLogger();

// 편의 함수들
export function logLoginAttempt(
  ipAddress: string,
  email: string,
  success: boolean
): void {
  securityLogger.trackLoginAttempt(ipAddress, email, success);
}

export function logUnauthorizedAccess(
  userId: string,
  resource: string,
  action: string,
  userRole: string,
  requiredRole: string
): void {
  securityLogger.detectUnauthorizedAccess(
    userId,
    resource,
    action,
    userRole,
    requiredRole
  );
}

export function logAdminAccess(
  userId: string,
  action: string,
  resource: string,
  ipAddress?: string,
  userAgent?: string
): void {
  securityLogger.logAdminAccess(userId, action, resource, ipAddress, userAgent);
}

export function checkMaliciousRequest(
  request: any,
  ipAddress: string,
  userAgent: string
): void {
  securityLogger.detectMaliciousRequest(request, ipAddress, userAgent);
}

// 보안 알림 조회
export function getSecurityAlerts(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("security_alerts") || "[]");
}
