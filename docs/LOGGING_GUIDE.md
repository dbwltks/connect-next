# 🔍 로그 시스템 사용 가이드

## 개요

본 시스템은 기업급 로그 관리 솔루션으로, 다음과 같은 기능을 제공합니다:

- **환경별 로그 레벨 관리** - 개발, 스테이징, 운영 환경별 설정
- **배치 처리 시스템** - 대용량 로그 처리 최적화
- **보안 이벤트 추적** - 실시간 보안 위협 탐지
- **실시간 모니터링** - 관리자 대시보드 및 알림
- **고급 검색 및 분석** - 다양한 필터링 및 통계

## 1. 설치 및 설정

### 1.1 환경 변수 설정

```bash
# .env.local 파일에 다음 변수들을 설정하세요
LOG_LEVEL=1                    # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR, 4=OFF
LOG_BATCH_ENABLED=true         # 배치 처리 활성화
LOG_BATCH_SIZE=50              # 배치 크기
LOG_BATCH_INTERVAL=10000       # 배치 간격 (ms)
LOG_ARCHIVE_DAYS=30            # 로그 보관 기간
LOG_REALTIME_ENABLED=true      # 실시간 스트림 활성화
LOG_SECURITY_ENABLED=true      # 보안 로그 활성화
LOG_PERFORMANCE_ENABLED=true   # 성능 로그 활성화
LOG_SENSITIVE_MASK=true        # 민감 데이터 마스킹
```

### 1.2 데이터베이스 마이그레이션

```bash
# Supabase CLI를 사용하여 마이그레이션 실행
supabase db push

# 또는 수동으로 다음 마이그레이션 파일들을 실행
# - 20250101000000_create_activity_logs_table.sql
# - 20250102000000_create_security_logs_table.sql
# - 20250103000000_add_level_to_activity_logs.sql
```

## 2. 기본 사용법

### 2.1 활동 로그 생성

```typescript
import {
  logBoardPostCreate,
  logBoardPostUpdate,
  logBoardPostDelete,
} from "@/services/activityLogService";
import { LogLevel } from "@/services/logConfig";

// 게시글 생성 로그
await logBoardPostCreate(userId, postId, "게시글 제목", {
  content_length: 1500,
  has_files: true,
  category: "공지사항",
});

// 사용자 정의 로그 (고급 옵션)
await createActivityLog({
  userId,
  action: "create",
  resourceType: "board_post",
  resourceId: postId,
  resourceTitle: title,
  details: { custom_data: "value" },
  level: LogLevel.INFO,
  request, // Request 객체 (서버사이드)
});
```

### 2.2 보안 이벤트 로깅

```typescript
import {
  logLoginAttempt,
  logUnauthorizedAccess,
  logAdminAccess,
} from "@/services/securityLogger";

// 로그인 시도 추적
logLoginAttempt("192.168.1.100", "user@example.com", false);

// 권한 위반 탐지
logUnauthorizedAccess(userId, "admin_panel", "access", "user", "admin");

// 관리자 접근 로깅
logAdminAccess(
  adminUserId,
  "delete_user",
  "user_management",
  ipAddress,
  userAgent
);
```

## 3. 관리자 대시보드 사용법

### 3.1 접근 방법

1. 관리자 계정으로 로그인
2. `/admin/dashboard` 페이지 접속
3. "실시간 로그" 탭에서 모니터링 시작

### 3.2 주요 기능

#### 실시간 로그 스트림

- **시작/중지**: 실시간 로그 수신 제어
- **자동 알림**: 고위험 보안 이벤트 브라우저 알림
- **필터링**: 로그 레벨별, 액션별 실시간 필터

#### 보안 알림 관리

- **심각도별 분류**: LOW, MEDIUM, HIGH, CRITICAL
- **알림 확인**: 처리된 알림 표시
- **일괄 삭제**: 확인된 알림 정리

#### 성능 모니터링

- **배치 처리 상태**: 큐 길이, 처리 시간 모니터링
- **처리량 분석**: 초당 로그 처리 건수
- **오류율 추적**: 시스템 안정성 지표

## 4. 고급 기능

### 4.1 로그 검색 및 분석

```typescript
import { searchActivityLogs } from "@/services/logSearchService";

// 고급 검색
const result = await searchActivityLogs({
  text: "오류", // 텍스트 검색
  action: "delete", // 특정 액션
  resourceType: "board_post", // 리소스 타입
  level: 3, // ERROR 레벨
  startDate: "2024-01-01", // 시작 날짜
  endDate: "2024-01-31", // 종료 날짜
  userId: "specific-user-id", // 특정 사용자
  includeStats: true, // 통계 포함
  sortBy: "created_at", // 정렬 기준
  sortOrder: "desc", // 정렬 순서
  limit: 100, // 결과 수 제한
});

console.log(result.logs); // 로그 목록
console.log(result.stats); // 통계 정보
console.log(result.facets); // 패싯 정보
```

### 4.2 로그 내보내기

```typescript
import { exportActivityLogs } from "@/services/logSearchService";

// CSV 형식으로 내보내기
const csvData = await exportActivityLogs(
  {
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    level: 3, // ERROR 로그만
  },
  "csv"
);

// 파일 다운로드
const blob = new Blob([csvData], { type: "text/csv" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "error_logs.csv";
a.click();
```

### 4.3 검색 쿼리 저장

```typescript
import {
  saveSearchQuery,
  getSavedSearchQueries,
} from "@/services/logSearchService";

// 검색 쿼리 저장
await saveSearchQuery(
  "오류 로그 조회",
  {
    level: 3,
    startDate: "2024-01-01",
    resourceType: "board_post",
  },
  userId
);

// 저장된 검색 조회
const savedSearches = await getSavedSearchQueries(userId);
```

## 5. 배치 처리 시스템

### 5.1 설정 최적화

```typescript
// 환경별 권장 설정

// 개발 환경
LOG_BATCH_ENABLED = false; // 즉시 처리로 디버깅 용이
LOG_LEVEL = 0; // DEBUG 레벨

// 스테이징 환경
LOG_BATCH_ENABLED = true;
LOG_BATCH_SIZE = 50;
LOG_BATCH_INTERVAL = 10000; // 10초
LOG_LEVEL = 1; // INFO 레벨

// 운영 환경
LOG_BATCH_ENABLED = true;
LOG_BATCH_SIZE = 100;
LOG_BATCH_INTERVAL = 30000; // 30초
LOG_LEVEL = 2; // WARN 레벨 이상만
```

### 5.2 성능 모니터링

```typescript
import {
  logBatchProcessor,
  getPerformanceMetrics,
  getErrorMetrics,
} from "@/services/logBatchProcessor";

// 배치 상태 확인
const status = logBatchProcessor.getBatchStatus();
console.log(`대기 중: ${status.queueLength}개`);
console.log(`처리 중: ${status.isProcessing}`);

// 강제 플러시 (관리자용)
await logBatchProcessor.forceBatch();

// 성능 메트릭 조회
const perfMetrics = getPerformanceMetrics();
const errorMetrics = getErrorMetrics();
```

## 6. 보안 이벤트 감지

### 6.1 자동 감지 기능

시스템이 자동으로 감지하는 보안 이벤트:

- **무차별 대입 공격**: 5회 이상 로그인 실패
- **권한 위반**: 접근 권한 없는 리소스 접근
- **대량 데이터 접근**: 5분 내 100개 이상 데이터 접근
- **세션 하이재킹**: 세션 중 IP 주소 변경
- **악성 요청**: SQL 인젝션, XSS 패턴 탐지

### 6.2 커스텀 보안 규칙

```typescript
import { securityLogger } from "@/services/securityLogger";

// 사용자 정의 보안 이벤트
await securityLogger.logSecurityEvent({
  type: "SUSPICIOUS_ACTIVITY",
  severity: SecuritySeverity.HIGH,
  userId,
  ipAddress,
  details: {
    reason: "Multiple admin actions in short time",
    actionCount: 10,
    timeWindow: "5 minutes",
  },
  timestamp: new Date(),
});
```

## 7. 알림 시스템

### 7.1 실시간 알림

- **브라우저 알림**: 고위험 보안 이벤트 발생 시
- **대시보드 배지**: 미확인 알림 수 표시
- **PostgreSQL NOTIFY**: 실시간 데이터베이스 이벤트

### 7.2 알림 설정

```typescript
// 브라우저 알림 권한 요청
if ("Notification" in window && Notification.permission === "default") {
  await Notification.requestPermission();
}

// 알림 확인
const alerts = getSecurityAlerts();
const unreadCount = alerts.filter((alert) => !alert.acknowledged).length;
```

## 8. 데이터 아카이빙

### 8.1 자동 아카이빙

```sql
-- 30일 이후 로그 자동 아카이빙 (매일 새벽 2시)
SELECT cron.schedule(
  'archive-logs',
  '0 2 * * *',
  'SELECT public.archive_old_security_logs();'
);
```

### 8.2 수동 아카이빙

```typescript
// 관리자가 수동으로 아카이빙 실행
await supabase.rpc("archive_old_security_logs");
```

## 9. 문제 해결

### 9.1 일반적인 문제

**Q: 로그가 기록되지 않아요**
A:

1. 로그 레벨 설정 확인 (`LOG_LEVEL`)
2. 액션/리소스 타입이 제외 목록에 있는지 확인
3. 데이터베이스 연결 상태 확인

**Q: 배치 처리가 느려요**
A:

1. `LOG_BATCH_SIZE` 크기 조정
2. `LOG_BATCH_INTERVAL` 간격 단축
3. 성능 메트릭에서 병목 지점 확인

**Q: 보안 알림이 너무 많아요**
A:

1. 보안 로그 레벨 조정
2. 특정 IP 주소 화이트리스트 추가
3. 임계값 설정 조정

### 9.2 디버깅

```typescript
// 디버그 모드 활성화
localStorage.setItem("debug_logs", "true");

// 배치 상태 모니터링
setInterval(() => {
  const status = logBatchProcessor.getBatchStatus();
  console.log("Batch Status:", status);
}, 5000);

// 성능 메트릭 확인
const metrics = getPerformanceMetrics();
console.log("Performance:", metrics);
```

## 10. 운영 체크리스트

### 10.1 일일 점검 항목

- [ ] 시스템 상태 확인 (대시보드)
- [ ] 보안 알림 검토 및 처리
- [ ] 오류율 모니터링 (5% 이하 유지)
- [ ] 배치 처리 성능 확인

### 10.2 주간 점검 항목

- [ ] 로그 보관 용량 확인
- [ ] 성능 추세 분석
- [ ] 보안 이벤트 패턴 분석
- [ ] 아카이빙 상태 확인

### 10.3 월간 점검 항목

- [ ] 로그 설정 최적화 검토
- [ ] 보안 정책 업데이트
- [ ] 시스템 리소스 사용량 분석
- [ ] 백업 및 복구 테스트

---

## 지원 및 문의

시스템 관련 문의사항이나 개선 제안이 있으시면 개발팀에 연락주세요.

- **이메일**: dev-team@company.com
- **슬랙**: #dev-logging-system
- **이슈 트래커**: GitHub Issues
