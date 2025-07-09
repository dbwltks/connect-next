"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Zap,
  Clock,
  Server,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/contexts/auth-context";
import { RealTimeLogsComponent } from "@/components/admin/real-time-logs";
import { getActivityLogs } from "@/services/activityLogService";
import {
  getPerformanceMetrics,
  getErrorMetrics,
  logBatchProcessor,
} from "@/services/logBatchProcessor";
import { getSecurityAlerts } from "@/services/securityLogger";
import { getLogConfig } from "@/services/logConfig";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_title?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  level?: number;
  user?: {
    id: string;
    email: string;
    name: string;
    user_metadata?: any;
  };
}

interface DashboardStats {
  totalLogs: number;
  todayLogs: number;
  errorRate: number;
  activeUsers: number;
  securityAlerts: number;
  systemHealth: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [stats, setStats] = useState<DashboardStats>({
    totalLogs: 0,
    todayLogs: 0,
    errorRate: 0,
    activeUsers: 0,
    securityAlerts: 0,
    systemHealth: 100,
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [logLevelData, setLogLevelData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/";
      return;
    }
  }, [isAdmin]);

  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    try {
      // 최근 로그 데이터
      const recentLogs: ActivityLog[] = (await getActivityLogs({
        limit: 1000,
      })) as ActivityLog[];
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      const todayLogs = recentLogs.filter(
        (log) => new Date(log.created_at) >= todayStart
      );

      // 보안 알림
      const securityAlerts = getSecurityAlerts().filter(
        (alert: any) => !alert.acknowledged
      );

      // 성능 메트릭
      const perfMetrics = getPerformanceMetrics();
      const errorMetrics = getErrorMetrics();

      // 배치 상태
      const batch = logBatchProcessor.getBatchStatus();
      setBatchStatus(batch);

      // 로그 설정
      const logConfig = getLogConfig();
      setConfig(logConfig);

      // 통계 계산
      const errorRate =
        errorMetrics.length > 0
          ? (errorMetrics.length / recentLogs.length) * 100
          : 0;

      const activeUsers = new Set(
        recentLogs
          .filter(
            (log: ActivityLog) => new Date(log.created_at) >= subDays(today, 1)
          )
          .map((log: any) => log.user_id)
      ).size;

      setStats({
        totalLogs: recentLogs.length,
        todayLogs: todayLogs.length,
        errorRate: Math.round(errorRate * 100) / 100,
        activeUsers,
        securityAlerts: securityAlerts.length,
        systemHealth: errorRate < 5 ? 100 : 100 - Math.min(errorRate * 2, 50),
      });

      // 일별 활동 데이터
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayLogs = recentLogs.filter((log: ActivityLog) => {
          const logDate = new Date(log.created_at);
          return logDate >= dayStart && logDate < dayEnd;
        });

        last7Days.push({
          date: format(date, "MM/dd", { locale: ko }),
          logs: dayLogs.length,
          errors: dayLogs.filter((log: ActivityLog) => log.level === 3).length,
          creates: dayLogs.filter((log: ActivityLog) => log.action === "create")
            .length,
          updates: dayLogs.filter((log: ActivityLog) => log.action === "update")
            .length,
          deletes: dayLogs.filter((log: ActivityLog) => log.action === "delete")
            .length,
        });
      }
      setActivityData(last7Days);

      // 로그 레벨별 데이터
      const levelCounts = recentLogs.reduce((acc: any, log: ActivityLog) => {
        const level = log.level || 1;
        const levelName =
          ["DEBUG", "INFO", "WARN", "ERROR", "OFF"][level] || "UNKNOWN";
        acc[levelName] = (acc[levelName] || 0) + 1;
        return acc;
      }, {});

      setLogLevelData(
        Object.entries(levelCounts).map(([name, value]: any) => ({ name, value }))
      );

      // 성능 데이터 (최근 20개)
      setPerformanceData(
        perfMetrics.slice(-20).map((metric: any) => ({
          time: format(new Date(metric.timestamp), "HH:mm"),
          processingTime: metric.processing_time,
          throughput: metric.throughput,
          batchSize: metric.batch_size,
        }))
      );
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();

      // 5분마다 데이터 새로고침
      const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // 강제 배치 플러시
  const forceBatchFlush = async () => {
    await logBatchProcessor.forceBatch();
    setBatchStatus(logBatchProcessor.getBatchStatus());
  };

  if (!isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">시스템 대시보드</h1>
          <p className="text-gray-600 mt-1">
            실시간 로그 모니터링 및 시스템 상태
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            새로고침
          </Button>
          {config?.enableBatching && (
            <Button onClick={forceBatchFlush} variant="outline" size="sm">
              배치 플러시
            </Button>
          )}
        </div>
      </div>

      {/* 시스템 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 로그</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 로그</p>
                <p className="text-2xl font-bold">{stats.todayLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오류율</p>
                <p className="text-2xl font-bold">{stats.errorRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">보안 알림</p>
                <p className="text-2xl font-bold">{stats.securityAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Server className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">시스템 상태</p>
                <p className="text-2xl font-bold">{stats.systemHealth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 배치 상태 */}
      {batchStatus && config?.enableBatching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              배치 처리 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">대기 중:</span>
                <Badge
                  variant={
                    batchStatus.queueLength > 50 ? "destructive" : "secondary"
                  }
                >
                  {batchStatus.queueLength}개
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">처리 상태:</span>
                <Badge
                  variant={batchStatus.isProcessing ? "default" : "secondary"}
                >
                  {batchStatus.isProcessing ? "처리 중" : "대기"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">타이머:</span>
                <Badge variant={batchStatus.hasTimer ? "default" : "secondary"}>
                  {batchStatus.hasTimer ? "활성" : "비활성"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">배치 크기:</span>
                <Badge variant="outline">{config.batchSize}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 차트 및 실시간 로그 */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">통계 차트</TabsTrigger>
          <TabsTrigger value="realtime">실시간 로그</TabsTrigger>
          <TabsTrigger value="performance">성능 모니터링</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 일별 활동 */}
            <Card>
              <CardHeader>
                <CardTitle>일별 활동 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="logs" fill="#3B82F6" name="총 로그" />
                    <Bar dataKey="errors" fill="#EF4444" name="오류" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 로그 레벨 분포 */}
            <Card>
              <CardHeader>
                <CardTitle>로그 레벨 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={logLevelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {logLevelData.map((entry, index: any) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 액션별 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>액션별 활동</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="creates" fill="#10B981" name="생성" />
                    <Bar dataKey="updates" fill="#F59E0B" name="수정" />
                    <Bar dataKey="deletes" fill="#EF4444" name="삭제" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime">
          <RealTimeLogsComponent />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* 성능 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>배치 처리 성능</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="processingTime"
                    stroke="#8884d8"
                    name="처리 시간 (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="throughput"
                    stroke="#82ca9d"
                    name="처리량 (logs/sec)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 시스템 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>현재 로그 설정</CardTitle>
            </CardHeader>
            <CardContent>
              {config && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">로그 레벨</span>
                    <Badge>
                      {["DEBUG", "INFO", "WARN", "ERROR", "OFF"][config.level]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">배치 처리</span>
                    <Badge
                      variant={config.enableBatching ? "default" : "secondary"}
                    >
                      {config.enableBatching ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">배치 크기</span>
                    <Badge variant="outline">{config.batchSize}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">실시간 스트림</span>
                    <Badge
                      variant={config.enableRealtime ? "default" : "secondary"}
                    >
                      {config.enableRealtime ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">보안 로그</span>
                    <Badge
                      variant={
                        config.enableSecurityLog ? "default" : "secondary"
                      }
                    >
                      {config.enableSecurityLog ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="font-medium">성능 로그</span>
                    <Badge
                      variant={
                        config.enablePerformanceLog ? "default" : "secondary"
                      }
                    >
                      {config.enablePerformanceLog ? "활성" : "비활성"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
