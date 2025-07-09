"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellRing,
  Play,
  Pause,
  Trash2,
  Shield,
  Activity,
  AlertTriangle,
  Info,
  Bug,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { logBatchProcessor } from "@/services/logBatchProcessor";
import { getSecurityAlerts } from "@/services/securityLogger";
import { getLogConfig } from "@/services/logConfig";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: number;
  action: string;
  resourceType: string;
  resourceTitle: string;
  userId: string;
  userName?: string;
  details?: any;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: number;
  userId?: string;
  ipAddress?: string;
  details: any;
  timestamp: string;
  acknowledged: boolean;
}

const LOG_LEVEL_CONFIG = {
  0: { name: "DEBUG", color: "bg-gray-500", icon: Bug },
  1: { name: "INFO", color: "bg-blue-500", icon: Info },
  2: { name: "WARN", color: "bg-yellow-500", icon: AlertTriangle },
  3: { name: "ERROR", color: "bg-red-500", icon: Shield },
  4: { name: "OFF", color: "bg-gray-400", icon: X },
};

export function RealTimeLogsComponent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const supabase = createClient();
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 실시간 로그 스트림 시작/중지
  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  // 보안 알림 확인
  const acknowledgeAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((alert: any) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );

    // 로컬 스토리지 업데이트
    const alerts = getSecurityAlerts();
    const updatedAlerts = alerts.map((alert: any) =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    );
    localStorage.setItem("security_alerts", JSON.stringify(updatedAlerts));
  };

  // 모든 알림 삭제
  const clearAllAlerts = () => {
    setSecurityAlerts([]);
    localStorage.removeItem("security_alerts");
  };

  // 실시간 업데이트
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      interval = setInterval(() => {
        // 배치 상태 업데이트
        const status = logBatchProcessor.getBatchStatus();
        setBatchStatus(status);

        // 보안 알림 업데이트
        const alerts = getSecurityAlerts();
        setSecurityAlerts(alerts);

        // 읽지 않은 알림 수 계산
        const unread = alerts.filter(
          (alert: any) => !alert.acknowledged
        ).length;
        setUnreadCount(unread);

        // 실제 환경에서는 여기서 Supabase 실시간 구독을 사용
        // 지금은 로컬 스토리지에서 최신 로그를 가져옴
        try {
          const recentLogs = JSON.parse(
            localStorage.getItem("recent_logs") || "[]"
          );
          if (recentLogs.length > 0) {
            setLogs((prev) => {
              const newLogs = [...recentLogs, ...prev].slice(0, 100); // 최근 100개만 유지
              return newLogs;
            });
          }
        } catch (error) {
          console.error("로그 로드 오류:", error);
        }
      }, 2000); // 2초마다 업데이트
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Supabase 실시간 구독 (실제 운영환경)
  useEffect(() => {
    if (!isStreaming) return;

    const config = getLogConfig();
    if (!config.enableRealtime) return;

    // 보안 알림 실시간 구독
    const securityChannel = supabase
      .channel("security_alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_logs",
          filter: "severity.gte.3", // HIGH 이상만
        },
        (payload: any) => {
          const newAlert = {
            id: payload.new.id,
            type: payload.new.event_type,
            severity: payload.new.severity,
            userId: payload.new.user_id,
            ipAddress: payload.new.ip_address,
            details: payload.new.details,
            timestamp: payload.new.created_at,
            acknowledged: false,
          };

          setSecurityAlerts((prev) => [newAlert, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          // 브라우저 알림 (권한이 있는 경우)
          if (Notification.permission === "granted") {
            new Notification("보안 알림", {
              body: `${newAlert.type} 이벤트가 발생했습니다.`,
              icon: "/icons/security-alert.png",
            });
          }
        }
      )
      .subscribe();

    // 활동 로그 실시간 구독
    const activityChannel = supabase
      .channel("activity_logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_logs",
        },
        (payload: any) => {
          const newLog: LogEntry = {
            id: payload.new.id,
            timestamp: new Date(payload.new.created_at),
            level: payload.new.level || 1,
            action: payload.new.action,
            resourceType: payload.new.resource_type,
            resourceTitle: payload.new.resource_title || "",
            userId: payload.new.user_id,
            details: payload.new.details,
          };

          setLogs((prev) => [newLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      securityChannel.unsubscribe();
      activityChannel.unsubscribe();
    };
  }, [isStreaming, supabase]);

  // 알림 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogLevelConfig = (level: number) => {
    return (
      LOG_LEVEL_CONFIG[level as keyof typeof LOG_LEVEL_CONFIG] ||
      LOG_LEVEL_CONFIG[1]
    );
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return "bg-blue-100 border-blue-300";
      case 2:
        return "bg-yellow-100 border-yellow-300";
      case 3:
        return "bg-red-100 border-red-300";
      case 4:
        return "bg-red-200 border-red-500";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* 제어 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              실시간 로그 모니터링
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleStreaming}
                variant={isStreaming ? "destructive" : "default"}
                size="sm"
              >
                {isStreaming ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    중지
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    시작
                  </>
                )}
              </Button>

              {unreadCount > 0 && (
                <Badge variant="destructive" className="relative">
                  <BellRing className="w-4 h-4 mr-1" />
                  {unreadCount}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 배치 상태 */}
            {batchStatus && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">배치 큐:</div>
                <Badge
                  variant={
                    batchStatus.queueLength > 10 ? "destructive" : "secondary"
                  }
                >
                  {batchStatus.queueLength}개 대기
                </Badge>
                {batchStatus.hasTimer && (
                  <Badge variant="outline">타이머 활성</Badge>
                )}
              </div>
            )}

            {/* 스트리밍 상태 */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">상태:</div>
              <Badge variant={isStreaming ? "default" : "secondary"}>
                {isStreaming ? "실시간" : "중지됨"}
              </Badge>
            </div>

            {/* 로그 수 */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">로그 수:</div>
              <Badge variant="outline">{logs.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 보안 알림 */}
      {securityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                보안 알림
              </div>
              <Button onClick={clearAllAlerts} variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                모두 삭제
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {securityAlerts.slice(0, 10).map((alert: any) => (
                <Alert
                  key={alert.id}
                  className={`${getSeverityColor(alert.severity)} ${
                    alert.acknowledged ? "opacity-50" : ""
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{alert.type}</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(alert.timestamp), "MM/dd HH:mm", {
                          locale: ko,
                        })}
                        {alert.ipAddress && ` - ${alert.ipAddress}`}
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        onClick={() => acknowledgeAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                      >
                        확인
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 실시간 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            실시간 활동 로그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96" ref={logContainerRef}>
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {isStreaming
                  ? "로그를 기다리는 중..."
                  : "스트리밍을 시작하세요"}
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index: any) => {
                  const levelConfig = getLogLevelConfig(log.level);
                  const LevelIcon = levelConfig.icon;

                  return (
                    <div
                      key={`${log.id}-${index}`}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${levelConfig.color} text-white flex-shrink-0`}
                      >
                        <LevelIcon className="w-3 h-3" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {log.resourceType}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(log.timestamp, "HH:mm:ss", { locale: ko })}
                          </span>
                        </div>

                        <div className="text-sm font-medium truncate">
                          {log.resourceTitle || "제목 없음"}
                        </div>

                        {log.details && (
                          <div className="text-xs text-gray-600 mt-1">
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details).substring(0, 100) +
                                "..."}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex-shrink-0">
                        {log.userName || log.userId?.substring(0, 8)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
