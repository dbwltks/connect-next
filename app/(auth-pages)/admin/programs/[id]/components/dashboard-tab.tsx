"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Settings,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Edit3,
  Check,
} from "lucide-react";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { formatDateTimeToKorean } from "@/lib/time-format";
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
import { createClient } from "@/utils/supabase/client";

interface DashboardTabProps {
  programId: string;
  onNavigateToTab: (tab: string) => void;
}

interface Program {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  teams?: any[];
}

interface DashboardCard {
  id: string;
  title: string;
  component: React.ReactNode;
}

// 기본 카드 순서
const DEFAULT_CARD_ORDER = [
  "schedule",
  "participants",
  "teams",
  "program-period",
  "finance",
  "checklist",
  "attendance",
  "important-checklist",
];

export default function DashboardTab({
  programId,
  onNavigateToTab,
}: DashboardTabProps) {
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [program, setProgram] = useState<Program | null>(null);

  // 카드 순서 커스터마이징 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARD_ORDER);

  // localStorage에서 카드 순서 로드
  useEffect(() => {
    const savedOrder = localStorage.getItem(
      `dashboard-card-order-${programId}`
    );
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setCardOrder(parsedOrder);
      } catch (error) {
        console.error("Failed to parse saved card order:", error);
        setCardOrder(DEFAULT_CARD_ORDER);
      }
    }
  }, [programId]);

  // 카드 순서 저장
  const saveCardOrder = (newOrder: string[]) => {
    setCardOrder(newOrder);
    localStorage.setItem(
      `dashboard-card-order-${programId}`,
      JSON.stringify(newOrder)
    );
  };

  // 기본값으로 복원
  const resetToDefault = () => {
    saveCardOrder(DEFAULT_CARD_ORDER);
  };

  // 카드 이동 함수들
  const moveCard = (
    cardId: string,
    direction: "left" | "right" | "up" | "down"
  ) => {
    const currentIndex = cardOrder.indexOf(cardId);
    if (currentIndex === -1) return;

    let newIndex: number;

    // 데스크톱에서는 좌우, 모바일에서는 위아래
    if (direction === "left" || direction === "up") {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(cardOrder.length - 1, currentIndex + 1);
    }

    if (newIndex !== currentIndex) {
      const newOrder = [...cardOrder];
      const [movedCard] = newOrder.splice(currentIndex, 1);
      newOrder.splice(newIndex, 0, movedCard);
      saveCardOrder(newOrder);
    }
  };

  const canMoveLeft = (cardId: string) => cardOrder.indexOf(cardId) > 0;
  const canMoveRight = (cardId: string) =>
    cardOrder.indexOf(cardId) < cardOrder.length - 1;

  // 데이터 로드
  const loadAllData = async () => {
    try {
      setLoading(true);

      // 프로그램 정보 로드
      const supabase = createClient();
      const { data: programData } = await supabase
        .from("programs")
        .select("id, name, start_date, end_date, status, teams")
        .eq("id", programId)
        .single();

      const [
        participantsData,
        financesData,
        eventsData,
        checklistsData,
        attendancesData,
      ] = await Promise.all([
        participantsApi.getAll(programId).catch(() => []),
        financeApi.getAll(programId).catch(() => []),
        eventsApi.getAll(programId).catch(() => []),
        checklistApi.getAll(programId).catch(() => []),
        attendanceApi.getAll(programId).catch(() => []),
      ]);

      setProgram(programData);
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
    byStatus: participants.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byGender: (() => {
      const genderGroups = participants.reduce(
        (acc, p) => {
          const gender = p.gender || "미입력";
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // 실제 데이터 확인을 위해 로그 추가
      console.log("Gender groups:", genderGroups);
      console.log(
        "Participants:",
        participants.map((p) => ({ name: p.name, gender: p.gender }))
      );

      // 실제 데이터에 맞춰 매핑
      const orderedGenderGroups: Record<string, number> = {};

      // 실제 저장된 성별 값들을 확인하고 표준화
      Object.keys(genderGroups).forEach((originalGender) => {
        let displayGender = originalGender;

        // 다양한 성별 표기를 표준화
        if (
          originalGender === "male" ||
          originalGender === "M" ||
          originalGender === "남성"
        ) {
          displayGender = "남자";
        } else if (
          originalGender === "female" ||
          originalGender === "F" ||
          originalGender === "여성"
        ) {
          displayGender = "여자";
        }

        orderedGenderGroups[displayGender] =
          (orderedGenderGroups[displayGender] || 0) +
          genderGroups[originalGender];
      });

      // 기본 항목들 0으로 설정 (미입력 제외)
      ["남자", "여자"].forEach((gender) => {
        if (!orderedGenderGroups[gender]) {
          orderedGenderGroups[gender] = 0;
        }
      });

      return orderedGenderGroups;
    })(),
    byAge: (() => {
      const ageGroups = participants.reduce(
        (acc, p) => {
          if (p.birth_date) {
            const age =
              new Date().getFullYear() - new Date(p.birth_date).getFullYear();
            let ageGroup = "미입력";
            if (age < 20) ageGroup = "10대";
            else if (age < 30) ageGroup = "20대";
            else if (age < 40) ageGroup = "30대";
            else ageGroup = "40대+";
            acc[ageGroup] = (acc[ageGroup] || 0) + 1;
          } else {
            acc["미입력"] = (acc["미입력"] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // 지정된 순서로 정렬 (0인 것도 표시, 미입력 제외)
      const orderedAgeGroups: Record<string, number> = {};
      const order = ["10대", "20대", "30대", "40대+"];
      order.forEach((ageGroup) => {
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
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )
    .slice(0, 3);

  const todayEvents = events
    .filter((e) => {
      const eventDate = new Date(e.start_date);
      return (
        eventDate.getDate() === now.getDate() &&
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

  // 체크리스트 통계
  const checklistStats = {
    total: checklists.length,
    completed: checklists.filter((c) => c.is_completed).length,
    overdue: checklists.filter(
      (c) =>
        c.due_date && !c.is_completed && isBefore(new Date(c.due_date), now)
    ).length,
    highPriority: checklists.filter(
      (c) => c.priority === "high" && !c.is_completed
    ).length,
  };

  const completionRate =
    checklistStats.total > 0
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

  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round((attendanceStats.present / recentAttendance.length) * 100)
      : 0;

  // 개별 카드 렌더링 함수들
  const renderScheduleCard = () => {
    if (todayEvents.length > 0) {
      return (
        <div
          className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
            isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
          }`}
          onClick={isEditMode ? undefined : () => onNavigateToTab("calendar")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-bl-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg transition-all">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {todayEvents.length}
                </div>
                <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-full">
                  오늘 일정
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <h3 className="font-bold text-slate-900 mb-3">오늘의 일정</h3>
              <div className="space-y-2">
                {todayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 bg-indigo-50/50 rounded-lg"
                  >
                    {/* <Clock className="h-3 w-3 text-indigo-600 mt-1" /> */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs text-slate-900 truncate">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {event.start_date &&
                        !isNaN(new Date(event.start_date).getTime())
                          ? formatDateTimeToKorean(event.start_date)
                          : "--:--"}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
                {todayEvents.length > 3 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    외 {todayEvents.length - 3}개 더
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (upcomingEvents.length > 0) {
      return (
        <div
          className="bg-white cursor-pointer overflow-hidden border-gray-100 border rounded-lg hover:shadow-md widget-scale block p-4 group relative h-full"
          onClick={isEditMode ? undefined : () => onNavigateToTab("calendar")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-bl-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg transition-all">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">
                  {upcomingEvents.length}
                </div>
                <div className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full">
                  다가오는 일정
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <h3 className="font-bold text-slate-900 mb-3">다가오는 일정</h3>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 3).map((event) => {
                  const daysUntil = Math.ceil(
                    (new Date(event.start_date).getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 bg-orange-50/50 rounded-lg"
                    >
                      <div className="flex flex-col items-center">
                        <Badge
                          variant={daysUntil <= 3 ? "destructive" : "secondary"}
                          className="text-xs h-5"
                        >
                          D-{daysUntil}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-slate-900 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {event.start_date &&
                          !isNaN(new Date(event.start_date).getTime())
                            ? `${format(new Date(event.start_date), "M.d", { locale: ko })} ${formatDateTimeToKorean(event.start_date)}`
                            : "--/-- --:--"}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {upcomingEvents.length > 3 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    외 {upcomingEvents.length - 3}개 더
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className="bg-white cursor-pointer overflow-hidden border-gray-100 border rounded-lg hover:shadow-md widget-scale block p-4 group relative h-full"
          onClick={isEditMode ? undefined : () => onNavigateToTab("calendar")}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-500/10 to-gray-600/5 rounded-bl-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg transition-all">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">0</div>
                <div className="text-xs text-gray-600 font-semibold bg-gray-50 px-2 py-1 rounded-full">
                  일정 없음
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-bold text-slate-900 mb-3">예정된 일정</h3>
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30 text-gray-400" />
                <p className="text-xs text-slate-400">등록된 일정이 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderParticipantsCard = () => {
    return (
      <div
        className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
          isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
        }`}
        onClick={isEditMode ? undefined : () => onNavigateToTab("participants")}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-900">
                {participants.length}
              </div>
              <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                총 참가자
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900 mb-2">
              참가자 현황 및 분포
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">
                  상태별
                </h4>
                <div className="space-y-2">
                  {Object.entries(participantStats.byStatus)
                    .slice(0, 4)
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <Badge variant="outline" className="text-xs">
                          {status}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900">
                          {count}명
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">
                  성별
                </h4>
                <div className="space-y-2">
                  {Object.entries(participantStats.byGender)
                    .slice(0, 4)
                    .map(([gender, count]) => (
                      <div
                        key={gender}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                      >
                        <Badge variant="outline" className="text-xs">
                          {gender}
                        </Badge>
                        <span className="text-sm font-medium text-slate-900">
                          {count}명
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamsCard = () => {
    return (
      <div
        className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
          isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
        }`}
        onClick={isEditMode ? undefined : () => onNavigateToTab("participants")}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {program?.teams && Array.isArray(program.teams)
                  ? program.teams.length
                  : 0}
              </div>
              <div className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-full">
                개 팀
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900">구성된 팀</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              프로그램 참여 팀 수
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderProgramPeriodCard = () => {
    return (
      <div className="bg-white cursor-pointer overflow-hidden border-gray-100 widget-scale border rounded-lg hover:shadow-md block p-4 group relative h-full">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-amber-500/25 transition-all">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                {(() => {
                  if (program?.start_date && program?.end_date) {
                    const start = new Date(program.start_date);
                    const end = new Date(program.end_date);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );
                    return `${diffDays}일`;
                  }
                  return "--";
                })()}
              </div>
              <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full">
                운영 기간
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900 mb-2">프로그램 기간</h3>
            {(() => {
              if (program?.start_date && program?.end_date) {
                const startDate = format(
                  parseISO(program.start_date),
                  "yy.MM.dd",
                  { locale: ko }
                );
                const endDate = format(parseISO(program.end_date), "yy.MM.dd", {
                  locale: ko,
                });

                return (
                  <div className="text-sm font-semibold text-slate-700">
                    {startDate} ~ {endDate}
                  </div>
                );
              } else if (program?.start_date) {
                const startDate = format(
                  parseISO(program.start_date),
                  "yy.MM.dd",
                  { locale: ko }
                );

                return (
                  <div className="text-sm font-semibold text-slate-700">
                    {startDate} ~ <span className="text-slate-400">미정</span>
                  </div>
                );
              } else {
                return (
                  <div className="text-sm font-semibold text-slate-400">
                    기간 미정
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderFinanceCard = () => {
    return (
      <div
        className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
          isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
        }`}
        onClick={isEditMode ? undefined : () => onNavigateToTab("finance")}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg transition-all">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${balance.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                순이익 CAD
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900">재정 현황</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              수입 ${financeStats.totalIncome.toLocaleString()} - 지출 $
              {financeStats.totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderChecklistCard = () => {
    return (
      <div
        className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
          isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
        }`}
        onClick={isEditMode ? undefined : () => onNavigateToTab("checklist")}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg transition-all">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {completionRate}%
              </div>
              <div className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-1 rounded-full">
                완료율
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900 mb-2">체크리스트</h3>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-slate-500">
              {checklistStats.completed}/{checklistStats.total} 완료
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderAttendanceCard = () => {
    return (
      <div
        className={`bg-white overflow-hidden border-gray-100 widget-scale border rounded-lg block p-4 group relative h-full ${
          isEditMode ? "cursor-default" : "cursor-pointer hover:shadow-md"
        }`}
        onClick={isEditMode ? undefined : () => onNavigateToTab("attendance")}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg group-hover:shadow-cyan-500/25 transition-all">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">
                {attendanceRate}%
              </div>
              <div className="text-xs text-cyan-600 font-semibold bg-cyan-50 px-2 py-1 rounded-full">
                출석률
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-slate-900">최근 출석률</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              출석 {attendanceStats.present} / 지각 {attendanceStats.late} /
              결석 {attendanceStats.absent}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderImportantChecklistCard = () => {
    return (
      <div className="bg-white cursor-pointer overflow-hidden border-gray-100 widget-scale border rounded-lg hover:shadow-md block p-4 group relative h-full">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-bl-full"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg transition-all">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900">중요 체크리스트</h3>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {checklistStats.overdue > 0 && (
              <div className="p-3 bg-red-50 border-red-200 border rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    연체된 항목 {checklistStats.overdue}개
                  </span>
                </div>
              </div>
            )}

            {checklistStats.highPriority > 0 && (
              <div className="p-3 bg-orange-50 border-orange-200 border rounded-lg">
                <div className="flex items-center gap-2 text-orange-800">
                  <Target className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    높은 우선순위 {checklistStats.highPriority}개
                  </span>
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">전체 진행률</span>
                <span className="text-sm text-slate-500">
                  {completionRate}%
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {checklistStats.overdue === 0 &&
              checklistStats.highPriority === 0 && (
                <div className="text-center py-4 text-slate-400">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">긴급한 항목이 없습니다.</p>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 카드 매핑 함수
  const getCardComponent = (cardId: string) => {
    switch (cardId) {
      case "schedule":
        return renderScheduleCard();
      case "participants":
        return renderParticipantsCard();
      case "teams":
        return renderTeamsCard();
      case "program-period":
        return renderProgramPeriodCard();
      case "finance":
        return renderFinanceCard();
      case "checklist":
        return renderChecklistCard();
      case "attendance":
        return renderAttendanceCard();
      case "important-checklist":
        return renderImportantChecklistCard();
      default:
        return null;
    }
  };

  const getCardColSpan = (cardId: string) => {
    return "col-span-1"; // 모든 카드가 1칸씩 차지
  };

  return (
    <div className="space-y-6">
      {/* 모바일: 편집 모드일 때만 상단에 표시 */}
      {isEditMode && (
        <div className="flex items-center gap-2 sm:hidden">
          <Edit3 className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold text-blue-600">편집 모드</span>
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cardOrder.map((cardId, index) => {
          const component = getCardComponent(cardId);
          if (!component) return null;

          return (
            <div
              key={cardId}
              className={`${getCardColSpan(cardId)} transition-all duration-200 h-full ${
                isEditMode ? "hover:shadow-lg" : ""
              }`}
            >
              {/* 카드 컨테이너 */}
              <div
                className={`relative h-full ${
                  isEditMode
                    ? "ring-2 ring-blue-200 ring-opacity-50 hover:ring-blue-300 rounded-lg"
                    : ""
                }`}
              >
                {/* 편집 모드 컨트롤 버튼들 */}
                {isEditMode && (
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {/* 데스크톱: 좌우 버튼 */}
                    <div className="hidden sm:flex gap-1">
                      <button
                        onClick={() => moveCard(cardId, "left")}
                        disabled={!canMoveLeft(cardId)}
                        className={`p-1 rounded-full shadow-sm border transition-all duration-200 ${
                          canMoveLeft(cardId)
                            ? "bg-white/90 border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                            : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                        }`}
                        title="왼쪽으로 이동"
                      >
                        <ChevronLeft className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveCard(cardId, "right")}
                        disabled={!canMoveRight(cardId)}
                        className={`p-1 rounded-full shadow-sm border transition-all duration-200 ${
                          canMoveRight(cardId)
                            ? "bg-white/90 border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                            : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                        }`}
                        title="오른쪽으로 이동"
                      >
                        <ChevronRight className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>

                    {/* 모바일: 위아래 버튼 */}
                    <div className="flex sm:hidden flex-col gap-1">
                      <button
                        onClick={() => moveCard(cardId, "up")}
                        disabled={!canMoveLeft(cardId)}
                        className={`p-1 rounded-full shadow-sm border transition-all duration-200 ${
                          canMoveLeft(cardId)
                            ? "bg-white/90 border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                            : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                        }`}
                        title="위로 이동"
                      >
                        <ChevronUp className="h-3 w-3 text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveCard(cardId, "down")}
                        disabled={!canMoveRight(cardId)}
                        className={`p-1 rounded-full shadow-sm border transition-all duration-200 ${
                          canMoveRight(cardId)
                            ? "bg-white/90 border-gray-300 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                            : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"
                        }`}
                        title="아래로 이동"
                      >
                        <ChevronDown className="h-3 w-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
                {component}
              </div>
            </div>
          );
        })}
      </div>

      {/* 편집 모드 안내 */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded">
              <div className="hidden sm:block">
                <ChevronLeft className="h-4 w-4 text-blue-600" />
              </div>
              <div className="block sm:hidden">
                <ChevronUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                카드 순서 편집 모드
              </h4>
              <p className="text-sm text-blue-700">
                <span className="hidden sm:inline">
                  카드 오른쪽 상단의 좌우 화살표 버튼을 클릭하여
                </span>
                <span className="inline sm:hidden">
                  카드 오른쪽 상단의 위아래 화살표 버튼을 클릭하여
                </span>{" "}
                카드 순서를 변경할 수 있습니다. 변경된 순서는 자동으로
                저장됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 플로팅 편집 버튼 */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* 기본값 복원 버튼 (편집 모드일 때만) */}
        {isEditMode && (
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl"
            title="기본값 복원"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm font-medium">기본값 복원</span>
          </button>
        )}

        {/* 메인 편집 버튼 */}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 ${
            isEditMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
          title={isEditMode ? "편집 완료" : "카드 순서 편집"}
        >
          {isEditMode ? (
            <>
              <Check className="h-5 w-5" />
              <span className="font-medium">완료</span>
            </>
          ) : (
            <>
              <Settings className="h-5 w-5" />
              <span className="font-medium">편집</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
