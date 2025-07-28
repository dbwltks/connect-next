"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  Activity,
  FileText,
  Mail,
  Phone,
  BarChart3,
} from "lucide-react";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  participantsApi,
  financeApi,
  eventsApi,
  checklistApi,
  attendanceApi,
  type Participant,
  type FinanceRecord,
  type Event,
  type ChecklistItem,
  type AttendanceRecord,
} from "../utils/api";

interface DashboardTabProps {
  programId: string;
}

export default function DashboardTab({ programId }: DashboardTabProps) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);

  // 데이터 로드
  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [participantsData, financesData, eventsData, checklistsData, attendancesData] = await Promise.all([
        participantsApi.getAll(programId).catch(() => []),
        financeApi.getAll(programId).catch(() => []),
        eventsApi.getAll(programId).catch(() => []),
        checklistApi.getAll(programId).catch(() => []),
        attendanceApi.getAll(programId).catch(() => [])
      ]);

      setParticipants(participantsData || []);
      setFinances(financesData || []);
      setEvents(eventsData || []);
      setChecklists(checklistsData || []);
      setAttendances(attendancesData || []);
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programId) {
      loadAllData();
    }
  }, [programId]);

  // 참가자 통계
  const participantStats = {
    total: participants.length,
    byStatus: participants.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byGender: (() => {
      const genderGroups = participants.reduce((acc, p) => {
        const gender = p.gender || '미입력';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 실제 데이터 확인을 위해 로그 추가
      console.log('Gender groups:', genderGroups);
      console.log('Participants:', participants.map(p => ({ name: p.name, gender: p.gender })));

      // 실제 데이터에 맞춰 매핑
      const orderedGenderGroups: Record<string, number> = {};
      
      // 실제 저장된 성별 값들을 확인하고 표준화
      Object.keys(genderGroups).forEach(originalGender => {
        let displayGender = originalGender;
        
        // 다양한 성별 표기를 표준화
        if (originalGender === 'male' || originalGender === 'M' || originalGender === '남성') {
          displayGender = '남자';
        } else if (originalGender === 'female' || originalGender === 'F' || originalGender === '여성') {
          displayGender = '여자';
        }
        
        orderedGenderGroups[displayGender] = (orderedGenderGroups[displayGender] || 0) + genderGroups[originalGender];
      });

      // 기본 항목들 0으로 설정 (미입력 제외)
      ['남자', '여자'].forEach(gender => {
        if (!orderedGenderGroups[gender]) {
          orderedGenderGroups[gender] = 0;
        }
      });

      return orderedGenderGroups;
    })(),
    byAge: (() => {
      const ageGroups = participants.reduce((acc, p) => {
        if (p.birth_date) {
          const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear();
          let ageGroup = '미입력';
          if (age < 20) ageGroup = '10대';
          else if (age < 30) ageGroup = '20대';
          else if (age < 40) ageGroup = '30대';
          else ageGroup = '40대+';
          acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        } else {
          acc['미입력'] = (acc['미입력'] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // 지정된 순서로 정렬 (0인 것도 표시, 미입력 제외)
      const orderedAgeGroups: Record<string, number> = {};
      const order = ['10대', '20대', '30대', '40대+'];
      order.forEach(ageGroup => {
        orderedAgeGroups[ageGroup] = ageGroups[ageGroup] || 0;
      });
      return orderedAgeGroups;
    })(),
  };

  // 재정 통계
  const financeStats = {
    totalIncome: finances
      .filter((f) => f.type === "income")
      .reduce((sum, f) => sum + f.amount, 0),
    totalExpense: finances
      .filter((f) => f.type === "expense")
      .reduce((sum, f) => sum + f.amount, 0),
    recentTransactions: finances
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  };

  const balance = financeStats.totalIncome - financeStats.totalExpense;

  // 일정 통계
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => isAfter(new Date(e.start_date), now))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 3);

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.start_date);
    return (
      eventDate.getDate() === now.getDate() &&
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear()
    );
  });

  // 체크리스트 통계
  const checklistStats = {
    total: checklists.length,
    completed: checklists.filter((c) => c.is_completed).length,
    overdue: checklists.filter((c) => 
      c.due_date && 
      !c.is_completed && 
      isBefore(new Date(c.due_date), now)
    ).length,
    highPriority: checklists.filter((c) => 
      c.priority === "high" && !c.is_completed
    ).length,
  };

  const completionRate = checklists.length > 0 
    ? Math.round((checklistStats.completed / checklistStats.total) * 100) 
    : 0;

  // 최근 출석 통계
  const recentAttendance = attendances
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const attendanceStats = {
    present: recentAttendance.filter((a) => a.status === "present").length,
    absent: recentAttendance.filter((a) => a.status === "absent").length,
    late: recentAttendance.filter((a) => a.status === "late").length,
  };

  const attendanceRate = recentAttendance.length > 0
    ? Math.round((attendanceStats.present / recentAttendance.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 오늘 일정과 다가오는 일정을 나란히 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘 일정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              오늘 일정
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary hover:bg-secondary/80 text-sm text-blue-400">
                {todayEvents.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {event.start_date && !isNaN(new Date(event.start_date).getTime()) ? format(new Date(event.start_date), 'HH:mm', { locale: ko }) : '--:--'}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">오늘 예정된 일정이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 다가오는 일정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              다가오는 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const daysUntil = Math.ceil(
                    (new Date(event.start_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex flex-col items-center">
                        <Badge variant={daysUntil <= 3 ? "destructive" : "secondary"} className="text-xs">
                          D-{daysUntil}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {event.start_date && !isNaN(new Date(event.start_date).getTime()) ? format(new Date(event.start_date), 'MM/dd HH:mm', { locale: ko }) : '--/-- --:--'}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">예정된 일정이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 참가자 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              참가자 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* 상태별 분포 */}
              <div className="space-y-2">
                {Object.entries(participantStats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{status}</Badge>
                    <span className="text-sm font-medium">{count}명</span>
                  </div>
                ))}
              </div>

              {/* 성별 분포 */}
              <div className="space-y-2 border-l pl-4">
                {Object.entries(participantStats.byGender).map(([gender, count]) => (
                  <div key={gender} className="flex items-center justify-between">
                    <span className="text-sm">{gender}</span>
                    <span className="text-sm font-medium">{count}명</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 연령대 분포 */}
            <div className="border-t pt-3 mt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">연령대 분포</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(participantStats.byAge).map(([ageGroup, count]) => (
                  <div key={ageGroup} className="flex items-center justify-between text-sm p-2 rounded-sm bg-gray-50">
                    <span>{ageGroup}</span>
                    <span className="font-medium">{count}명</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 재정 현황 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">재정 현황</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toLocaleString()} CAD
            </div>
            <p className="text-xs text-muted-foreground">
              수입 ${financeStats.totalIncome.toLocaleString()} CAD - 지출 ${financeStats.totalExpense.toLocaleString()} CAD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 하단 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 체크리스트 진행률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">체크리스트</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {checklistStats.completed}/{checklistStats.total} 완료
            </p>
          </CardContent>
        </Card>

        {/* 출석률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 출석률</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              출석 {attendanceStats.present} / 지각 {attendanceStats.late} / 결석 {attendanceStats.absent}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 중요 체크리스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            중요 체크리스트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 연체된 항목 */}
            {checklistStats.overdue > 0 && (
              <div className="p-3 bg-red-50 border-red-200 border rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">연체된 항목 {checklistStats.overdue}개</span>
                </div>
              </div>
            )}

            {/* 높은 우선순위 항목 */}
            {checklistStats.highPriority > 0 && (
              <div className="p-3 bg-orange-50 border-orange-200 border rounded-lg">
                <div className="flex items-center gap-2 text-orange-800">
                  <Target className="h-4 w-4" />
                  <span className="font-medium text-sm">높은 우선순위 {checklistStats.highPriority}개</span>
                </div>
              </div>
            )}

            {/* 진행률 표시 */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">전체 진행률</span>
                <span className="text-sm text-muted-foreground">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {checklistStats.overdue === 0 && checklistStats.highPriority === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">긴급한 항목이 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}