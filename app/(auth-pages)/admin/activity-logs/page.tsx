"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
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
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Users,
  Activity,
  TrendingUp,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/contexts/auth-context";
import {
  getActivityLogs,
  getUserActivityStats,
} from "@/services/activityLogService";

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
  user?: {
    id: string;
    email: string;
    name: string;
    user_metadata?: any;
  };
}

interface LogFilter {
  action?: string;
  resourceType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

const ACTION_COLORS = {
  create: "#10B981",
  update: "#F59E0B",
  delete: "#EF4444",
  view: "#6B7280",
  publish: "#3B82F6",
  unpublish: "#8B5CF6",
};

const RESOURCE_COLORS = {
  board_post: "#3B82F6",
  calendar_event: "#10B981",
  comment: "#F59E0B",
  draft: "#8B5CF6",
  file: "#6B7280",
};

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<LogFilter>({});
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState("7days");

  const pageSize = 20;

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/";
      return;
    }
  }, [isAdmin]);

  // 로그 데이터 로드
  const loadLogs = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const data = await getActivityLogs({
        ...(filters as any),
        limit: pageSize,
        offset,
      });

      setLogs(data);
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error("로그 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      // 최근 7일간 통계
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      // 일별 활동 통계 계산
      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayLogs = await getActivityLogs({
          limit: 1000,
        } as any);

        dailyStats.push({
          date: format(date, "MM/dd", { locale: ko }),
          count: dayLogs.length,
          creates: dayLogs.filter((log: ActivityLog) => log.action === "create")
            .length,
          updates: dayLogs.filter((log: ActivityLog) => log.action === "update")
            .length,
          deletes: dayLogs.filter((log: ActivityLog) => log.action === "delete")
            .length,
        });
      }

      // 리소스 타입별 통계
      const allLogs: ActivityLog[] = (await getActivityLogs({
        limit: 1000,
      })) as ActivityLog[];
      const resourceStats = Object.entries(
        allLogs.reduce((acc: any, log: ActivityLog) => {
          acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]: any) => ({ name, value }));

      // 액션별 통계
      const actionStats = Object.entries(
        allLogs.reduce((acc: any, log: ActivityLog) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]: any) => ({ name, value }));

      setStats({
        daily: dailyStats,
        resources: resourceStats,
        actions: actionStats,
        total: allLogs.length,
        todayCount: dailyStats[6]?.count || 0,
        users: new Set(allLogs.map((log: any) => log.user_id)).size,
      });
    } catch (error) {
      console.error("통계 로드 실패:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [currentPage, filters, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  // 필터 적용
  const applyFilters = (newFilters: LogFilter) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // CSV 내보내기
  const exportToCsv = () => {
    const headers = [
      "날짜",
      "사용자",
      "액션",
      "리소스 타입",
      "리소스 제목",
      "IP 주소",
    ];

    const csvData = logs.map((log: any) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.user?.name || log.user?.email || "알 수 없음",
      log.action,
      log.resource_type,
      log.resource_title || "",
      log.ip_address || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row: any) => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `activity_logs_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 액션 한글 변환
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "생성",
      update: "수정",
      delete: "삭제",
      view: "조회",
      publish: "발행",
      unpublish: "발행취소",
    };
    return labels[action] || action;
  };

  // 리소스 타입 한글 변환
  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      board_post: "게시글",
      calendar_event: "일정",
      comment: "댓글",
      draft: "임시저장",
      file: "파일",
    };
    return labels[type] || type;
  };

  // 필드명 한글 변환
  const getFieldDisplayName = (field: string) => {
    const labels: Record<string, string> = {
      title: "제목",
      content: "내용",
      allow_comments: "댓글 허용",
      thumbnail_image: "썸네일 이미지",
      files: "첨부파일",
      is_notice: "공지사항 여부",
      description: "설명",
      status: "상태",
    };
    return labels[field] || field;
  };

  if (!isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">활동 로그 관리</h1>
          <p className="text-gray-600 mt-1">
            사용자 활동을 모니터링하고 분석합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={exportToCsv} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 활동</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">오늘 활동</p>
                  <p className="text-2xl font-bold">{stats.todayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    활성 사용자
                  </p>
                  <p className="text-2xl font-bold">{stats.users}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">최근 7일</p>
                  <p className="text-2xl font-bold">
                    {stats.daily.reduce(
                      (sum: number, day: any) => sum + day.count,
                      0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>일별 활동 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>리소스별 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.resources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${getResourceTypeLabel(name as string)} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.resources.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          Object.values(RESOURCE_COLORS)[
                            index % Object.values(RESOURCE_COLORS).length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Input
              placeholder="제목 검색..."
              value={filters.search || ""}
              onChange={(e) =>
                applyFilters({ ...filters, search: e.target.value })
              }
            />

            <Select
              value={filters.action || "all"}
              onValueChange={(value) =>
                applyFilters({
                  ...filters,
                  action: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="액션" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 액션</SelectItem>
                <SelectItem value="create">생성</SelectItem>
                <SelectItem value="update">수정</SelectItem>
                <SelectItem value="delete">삭제</SelectItem>
                <SelectItem value="publish">발행</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.resourceType || "all"}
              onValueChange={(value) =>
                applyFilters({
                  ...filters,
                  resourceType: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="리소스" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 리소스</SelectItem>
                <SelectItem value="board_post">게시글</SelectItem>
                <SelectItem value="calendar_event">일정</SelectItem>
                <SelectItem value="comment">댓글</SelectItem>
                <SelectItem value="draft">임시저장</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) =>
                applyFilters({ ...filters, startDate: e.target.value })
              }
            />

            <Input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) =>
                applyFilters({ ...filters, endDate: e.target.value })
              }
            />

            <Button
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
              variant="outline"
            >
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i: any) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>액션</TableHead>
                    <TableHead>리소스</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "MM/dd HH:mm", {
                          locale: ko,
                        })}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {log.user?.name || "알 수 없음"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {log.user?.email}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor:
                              ACTION_COLORS[
                                log.action as keyof typeof ACTION_COLORS
                              ] || "#6B7280",
                            color: "white",
                          }}
                        >
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor:
                              RESOURCE_COLORS[
                                log.resource_type as keyof typeof RESOURCE_COLORS
                              ] || "#6B7280",
                            color:
                              RESOURCE_COLORS[
                                log.resource_type as keyof typeof RESOURCE_COLORS
                              ] || "#6B7280",
                          }}
                        >
                          {getResourceTypeLabel(log.resource_type)}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">
                          {log.resource_title || "-"}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-gray-500">
                        {log.ip_address || "-"}
                      </TableCell>

                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>활동 로그 상세</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      사용자
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {selectedLog.user?.name || "알 수 없음"}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      시간
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {format(
                                        new Date(selectedLog.created_at),
                                        "yyyy-MM-dd HH:mm:ss",
                                        { locale: ko }
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      액션
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {getActionLabel(selectedLog.action)}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      리소스 타입
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {getResourceTypeLabel(
                                        selectedLog.resource_type
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      IP 주소
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {selectedLog.ip_address || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      리소스 ID
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {selectedLog.resource_id || "-"}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    리소스 제목
                                  </label>
                                  <p className="text-sm text-gray-600">
                                    {selectedLog.resource_title || "-"}
                                  </p>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    User Agent
                                  </label>
                                  <p className="text-sm text-gray-600 break-all">
                                    {selectedLog.user_agent || "-"}
                                  </p>
                                </div>

                                {selectedLog.details && (
                                  <div>
                                    <label className="text-sm font-medium">
                                      상세 정보
                                    </label>
                                    <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto max-h-40">
                                      {JSON.stringify(
                                        selectedLog.details,
                                        null,
                                        2
                                      )}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    페이지 {currentPage} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
