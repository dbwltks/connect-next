import { getLogConfig } from "./logConfig";
import { createClient } from "@/utils/supabase/client";

interface BatchLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_title?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  level: number;
}

class LogBatchProcessor {
  private batch: BatchLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private supabase = createClient();
  private isProcessing = false;

  constructor() {
    // 페이지 언로드 시 남은 배치 처리
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flushBatch();
      });
    }
  }

  // 로그 엔트리 추가
  addLog(entry: BatchLogEntry): void {
    const config = getLogConfig();

    if (!config.enableBatching) {
      // 배치 처리 비활성화 시 즉시 처리
      this.processImmediately(entry);
      return;
    }

    this.batch.push(entry);

    // 배치 크기 확인
    if (this.batch.length >= config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // 타이머 설정
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, config.batchInterval);
    }
  }

  // 즉시 로그 처리
  private async processImmediately(entry: BatchLogEntry): Promise<void> {
    try {
      const { error } = await this.supabase.from("activity_logs").insert([
        {
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          resource_title: entry.resource_title,
          details: entry.details,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          level: entry.level,
          created_at: entry.timestamp.toISOString(),
        },
      ]);

      if (error) {
        console.error("로그 저장 실패:", error);
        // 실패한 로그는 다시 배치에 추가
        this.batch.push(entry);
      }
    } catch (error) {
      console.error("로그 처리 오류:", error);
      this.batch.push(entry);
    }
  }

  // 배치 플러시
  async flushBatch(): Promise<void> {
    if (this.batch.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    // 타이머 정리
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      // 성능 측정
      const startTime = performance.now();

      const { error } = await this.supabase.from("activity_logs").insert(
        currentBatch.map((entry) => ({
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          resource_title: entry.resource_title,
          details: entry.details,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          level: entry.level,
          created_at: entry.timestamp.toISOString(),
        }))
      );

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      if (error) {
        console.error("배치 로그 저장 실패:", error);
        // 실패한 로그들을 다시 배치에 추가
        this.batch.unshift(...currentBatch);

        // 실패 로그 기록
        this.logBatchError(currentBatch.length, error, processingTime);
      } else {
        console.log(
          `배치 로그 저장 성공: ${currentBatch.length}개, ${processingTime.toFixed(2)}ms`
        );

        // 성능 로그 기록
        this.logBatchPerformance(currentBatch.length, processingTime);
      }
    } catch (error) {
      console.error("배치 처리 오류:", error);
      // 실패한 로그들을 다시 배치에 추가
      this.batch.unshift(...currentBatch);
    } finally {
      this.isProcessing = false;
    }
  }

  // 배치 처리 성능 로그
  private logBatchPerformance(batchSize: number, processingTime: number): void {
    const config = getLogConfig();

    if (!config.enablePerformanceLog) {
      return;
    }

    // 성능 임계값 체크 (100ms 이상)
    if (processingTime > 100) {
      console.warn(
        `배치 처리 성능 저하: ${batchSize}개 로그, ${processingTime.toFixed(2)}ms`
      );
    }

    // 성능 메트릭 저장 (실제로는 별도 성능 로그 테이블에 저장)
    const performanceMetric = {
      type: "batch_processing",
      batch_size: batchSize,
      processing_time: processingTime,
      throughput: batchSize / (processingTime / 1000), // logs per second
      timestamp: new Date(),
    };

    // 로컬 스토리지에 성능 메트릭 저장 (임시)
    if (typeof window !== "undefined") {
      const metrics = JSON.parse(
        localStorage.getItem("performance_metrics") || "[]"
      );
      metrics.push(performanceMetric);

      // 최근 100개만 유지
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }

      localStorage.setItem("performance_metrics", JSON.stringify(metrics));
    }
  }

  // 배치 처리 오류 로그
  private logBatchError(
    batchSize: number,
    error: any,
    processingTime: number
  ): void {
    const errorLog = {
      type: "batch_error",
      batch_size: batchSize,
      error: error.message,
      processing_time: processingTime,
      timestamp: new Date(),
    };

    console.error("배치 처리 오류 로그:", errorLog);

    // 오류 메트릭 저장
    if (typeof window !== "undefined") {
      const errors = JSON.parse(localStorage.getItem("error_metrics") || "[]");
      errors.push(errorLog);

      // 최근 50개만 유지
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      localStorage.setItem("error_metrics", JSON.stringify(errors));
    }
  }

  // 배치 상태 정보
  getBatchStatus(): {
    queueLength: number;
    isProcessing: boolean;
    hasTimer: boolean;
  } {
    return {
      queueLength: this.batch.length,
      isProcessing: this.isProcessing,
      hasTimer: this.batchTimer !== null,
    };
  }

  // 강제 플러시 (관리자용)
  forceBatch(): Promise<void> {
    return this.flushBatch();
  }
}

// 싱글톤 인스턴스
export const logBatchProcessor = new LogBatchProcessor();

// 로그 큐에 추가하는 헬퍼 함수
export function queueLog(
  userId: string,
  action: string,
  resourceType: string,
  options: {
    resourceId?: string;
    resourceTitle?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    level?: number;
  } = {}
): void {
  logBatchProcessor.addLog({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: options.resourceId,
    resource_title: options.resourceTitle,
    details: options.details,
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
    timestamp: new Date(),
    level: options.level || 1, // INFO 레벨
  });
}

// 성능 메트릭 조회
export function getPerformanceMetrics(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("performance_metrics") || "[]");
}

// 오류 메트릭 조회
export function getErrorMetrics(): any[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("error_metrics") || "[]");
}
