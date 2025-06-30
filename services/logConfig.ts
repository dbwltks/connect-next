// 로그 레벨 설정
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4,
}

// 환경별 로그 설정
export interface LogConfig {
  level: LogLevel;
  enableBatching: boolean;
  batchSize: number;
  batchInterval: number; // ms
  enableRealtime: boolean;
  archiveDays: number;
  excludeActions?: string[];
  excludeResources?: string[];
  enableSecurityLog: boolean;
  enablePerformanceLog: boolean;
  enableErrorTracking: boolean;
  sensitiveDataMask: boolean;
}

// 환경별 기본 설정
const defaultConfigs: Record<string, LogConfig> = {
  development: {
    level: LogLevel.DEBUG,
    enableBatching: false,
    batchSize: 10,
    batchInterval: 5000,
    enableRealtime: true,
    archiveDays: 7,
    enableSecurityLog: true,
    enablePerformanceLog: true,
    enableErrorTracking: true,
    sensitiveDataMask: false,
  },

  staging: {
    level: LogLevel.INFO,
    enableBatching: true,
    batchSize: 50,
    batchInterval: 10000,
    enableRealtime: true,
    archiveDays: 30,
    enableSecurityLog: true,
    enablePerformanceLog: true,
    enableErrorTracking: true,
    sensitiveDataMask: true,
  },

  production: {
    level: LogLevel.WARN,
    enableBatching: true,
    batchSize: 100,
    batchInterval: 30000,
    enableRealtime: false,
    archiveDays: 90,
    excludeActions: ["view"],
    enableSecurityLog: true,
    enablePerformanceLog: false,
    enableErrorTracking: true,
    sensitiveDataMask: true,
  },
};

// 현재 환경 설정 가져오기
export function getLogConfig(): LogConfig {
  const env = process.env.NODE_ENV || "development";
  const config = defaultConfigs[env] || defaultConfigs.development;

  // 환경변수로 오버라이드 가능
  return {
    ...config,
    level: process.env.LOG_LEVEL
      ? parseInt(process.env.LOG_LEVEL)
      : config.level,
    enableBatching:
      process.env.LOG_BATCH_ENABLED === "true" ? true : config.enableBatching,
    batchSize: process.env.LOG_BATCH_SIZE
      ? parseInt(process.env.LOG_BATCH_SIZE)
      : config.batchSize,
    archiveDays: process.env.LOG_ARCHIVE_DAYS
      ? parseInt(process.env.LOG_ARCHIVE_DAYS)
      : config.archiveDays,
  };
}

// 로그 레벨 체크
export function shouldLog(level: LogLevel): boolean {
  const config = getLogConfig();
  return level >= config.level;
}

// 액션 및 리소스 필터링
export function shouldLogAction(action: string, resourceType: string): boolean {
  const config = getLogConfig();

  if (config.excludeActions?.includes(action)) {
    return false;
  }

  if (config.excludeResources?.includes(resourceType)) {
    return false;
  }

  return true;
}

// 민감 데이터 마스킹
export function maskSensitiveData(data: any): any {
  const config = getLogConfig();

  if (!config.sensitiveDataMask) {
    return data;
  }

  const sensitiveFields = [
    "password",
    "email",
    "phone",
    "ip_address",
    "user_agent",
    "token",
    "api_key",
    "secret",
    "ssn",
    "credit_card",
  ];

  function maskValue(value: string): string {
    if (value.length <= 4) return "***";
    return value.substring(0, 2) + "***" + value.substring(value.length - 2);
  }

  function maskObject(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;

    const masked = { ...obj };

    for (const [key, value] of Object.entries(masked)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        if (typeof value === "string") {
          masked[key] = maskValue(value);
        } else if (value) {
          masked[key] = "***";
        }
      } else if (typeof value === "object") {
        masked[key] = maskObject(value);
      }
    }

    return masked;
  }

  return maskObject(data);
}
