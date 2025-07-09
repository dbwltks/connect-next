"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  Eye, 
  UserCheck, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewUser {
  id: string;
  username: string;
  email: string;
  role: string;
  risk_score: number;
  days_since_review: number;
  review_priority: string;
  last_login?: string;
  permissions_count: number;
  created_at: string;
  last_permission_review?: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_title?: string;
  ip_address?: string;
  created_at: string;
  users?: {
    username: string;
    email: string;
  };
}

export default function AdvancedPermissions() {
  const [reviewUsers, setReviewUsers] = useState<ReviewUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("review");
  const [selectedUser, setSelectedUser] = useState<ReviewUser | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    critical: 0,
    overdue: 0,
    high_risk: 0,
    total: 0,
  });
  const [auditStats, setAuditStats] = useState({
    today: 0,
    permissions: 0,
    failed: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === "review") {
      loadReviewData();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/permissions/review");
      if (response.ok) {
        const data = await response.json();
        setReviewUsers(data.users);
        
        // 통계 계산
        const stats = {
          critical: data.users.filter((u: ReviewUser) => u.review_priority === 'critical').length,
          overdue: data.users.filter((u: ReviewUser) => u.days_since_review >= 90).length,
          high_risk: data.users.filter((u: ReviewUser) => u.risk_score >= 80).length,
          total: data.users.length,
        };
        setReviewStats(stats);
      }
    } catch (error) {
      console.error("리뷰 데이터 로딩 실패:", error);
      toast({
        title: "오류",
        description: "권한 리뷰 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
        
        // 통계 설정
        if (data.statistics) {
          setAuditStats({
            today: data.statistics.total_24h || 0,
            permissions: data.statistics.permission_related || 0,
            failed: 0, // activity_logs에는 실패 정보가 없으므로 0
          });
        }
      }
    } catch (error) {
      console.error("감사 로그 로딩 실패:", error);
      toast({
        title: "오류",
        description: "감사 로그를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionReview = async (userId: string, action: string) => {
    try {
      const response = await fetch("/api/admin/permissions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          reviewer_id: "current-user-id", // 실제로는 현재 로그인한 사용자 ID
          action,
          comments: `권한 리뷰 - ${action}`,
        }),
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: "권한 리뷰가 완료되었습니다.",
        });
        setIsReviewDialogOpen(false);
        loadReviewData();
      } else {
        toast({
          title: "오류",
          description: "권한 리뷰 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("권한 리뷰 실패:", error);
      toast({
        title: "오류",
        description: "권한 리뷰 처리에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      critical: { label: "긴급", className: "bg-red-100 text-red-800" },
      high: { label: "높음", className: "bg-orange-100 text-orange-800" },
      medium: { label: "보통", className: "bg-yellow-100 text-yellow-800" },
      low: { label: "낮음", className: "bg-green-100 text-green-800" },
    };
    
    const { label, className } = config[priority as keyof typeof config] || config.low;
    
    return <Badge className={className}>{label}</Badge>;
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      create: { label: "생성", className: "bg-green-100 text-green-800" },
      update: { label: "수정", className: "bg-blue-100 text-blue-800" },
      delete: { label: "삭제", className: "bg-red-100 text-red-800" },
      view: { label: "조회", className: "bg-gray-100 text-gray-800" },
    };
    
    const config = actionConfig[action as keyof typeof actionConfig] || 
                  { label: action, className: "bg-gray-100 text-gray-800" };
    
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const exportAuditReport = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "성공",
          description: "감사 보고서가 다운로드되었습니다.",
        });
      }
    } catch (error) {
      console.error("보고서 내보내기 실패:", error);
      toast({
        title: "오류",
        description: "보고서 내보내기에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">고급 권한 관리</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">고급 권한 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditReport}>
            <Download className="h-4 w-4 mr-2" />
            감사 보고서
          </Button>
          <Button onClick={() => window.location.reload()}>
            <Filter className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">권한 리뷰</TabsTrigger>
          <TabsTrigger value="audit">감사 로그</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-6">
          {/* 권한 리뷰 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">긴급 리뷰</p>
                    <p className="text-2xl font-bold">
                      {reviewUsers.filter(u => u.review_priority === 'critical').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">90일 이상</p>
                    <p className="text-2xl font-bold">
                      {reviewUsers.filter(u => u.days_since_review >= 90).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">고위험 사용자</p>
                    <p className="text-2xl font-bold">
                      {reviewUsers.filter(u => u.risk_score >= 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">전체 사용자</p>
                    <p className="text-2xl font-bold">{reviewUsers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>권한 리뷰 대상</CardTitle>
              <CardDescription>
                정기적인 권한 검토가 필요한 사용자들을 리스크 점수 순으로 표시합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>리스크 점수</TableHead>
                    <TableHead>마지막 리뷰</TableHead>
                    <TableHead>우선순위</TableHead>
                    <TableHead>권한 수</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-12 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                user.risk_score >= 80 ? 'bg-red-500' :
                                user.risk_score >= 60 ? 'bg-orange-500' :
                                user.risk_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${user.risk_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{user.risk_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.days_since_review === 999 ? (
                          <span className="text-red-600">없음</span>
                        ) : (
                          <span>{user.days_since_review}일 전</span>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(user.review_priority)}</TableCell>
                      <TableCell>{user.permissions_count}</TableCell>
                      <TableCell className="text-right">
                        <Dialog 
                          open={isReviewDialogOpen && selectedUser?.id === user.id} 
                          onOpenChange={setIsReviewDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>권한 리뷰 - {selectedUser?.username}</DialogTitle>
                              <DialogDescription>
                                이 사용자의 권한을 검토하고 필요한 조치를 취하세요.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">리스크 점수</label>
                                  <p className="text-2xl font-bold text-red-600">
                                    {selectedUser?.risk_score}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">마지막 로그인</label>
                                  <p className="text-sm">
                                    {selectedUser?.last_login ? 
                                      new Date(selectedUser.last_login).toLocaleDateString() : 
                                      '없음'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                                취소
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => selectedUser && handlePermissionReview(selectedUser.id, 'approved')}
                              >
                                승인
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => selectedUser && handlePermissionReview(selectedUser.id, 'revoked_permissions')}
                              >
                                권한 회수
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>감사 로그</CardTitle>
              <CardDescription>
                시스템 접근 및 권한 변경 기록을 실시간으로 추적합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>작업</TableHead>
                    <TableHead>리소스</TableHead>
                    <TableHead>결과</TableHead>
                    <TableHead>IP 주소</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.users?.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{log.users?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_title && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {log.resource_title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">성공</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}