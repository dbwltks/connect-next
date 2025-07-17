"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Plus,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  eventsApi,
  financeApi,
} from "@/app/(auth-pages)/admin/programs/[id]/utils/api";
import { createClient } from "@/utils/supabase/client";

interface Program {
  id: string;
  name: string;
  category: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  program_id: string;
  team_id?: string;
}

interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  status: string;
  registered_at: string;
  category?: string;
  notes?: string;
  program_id: string;
  team_id?: string;
}

interface FinanceRecord {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  date: string;
  program_id: string;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  member_count: number;
  program_id: string;
  color?: string;
}

interface ProgramsWidgetProps {
  programs?: Program[];
  selectedProgramId?: string;
  widget?: {
    title?: string;
    settings?: {
      selected_program?: string;
      subtitle?: string;
      common_tabs?: string[];
      team_tabs?: string[];
      default_main_tab?: string;
      selected_teams?: string[];
      permission_mode?: "widget_settings" | "user_permission";
      tab_permissions?: {
        [key: string]: string[];
      };
    };
  };
}

export default function ProgramsWidget({
  programs = [],
  selectedProgramId,
  widget,
}: ProgramsWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>(
    widget?.settings?.selected_program || selectedProgramId || ""
  );
  const [selectedProgramData, setSelectedProgramData] =
    useState<Program | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>(programs);
  const [activeTab, setActiveTab] = useState<string>("calendar");
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventData, setEditingEventData] = useState<Event | null>(null);
  const [userRole, setUserRole] = useState<string>("guest"); // admin, team_leader, member, guest
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    program_id: "",
    team_id: "",
  });

  // 전체 프로그램 목록 로드 (programs가 비어있는 경우)
  useEffect(() => {
    const loadAllPrograms = async () => {
      if (programs.length === 0) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("programs")
            .select("id, name, category, status, start_date, end_date")
            .order("created_at", { ascending: false });

          if (!error && data) {
            setAllPrograms(data);
          }
        } catch (error) {
          console.error("프로그램 목록 로드 실패:", error);
        }
      } else {
        setAllPrograms(programs);
      }
    };

    loadAllPrograms();
  }, [programs]);

  // 사용자 권한 확인
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole("guest");
          return;
        }

        // users 테이블에서 역할 확인
        const { data: userData, error } = await supabase
          .from("users")
          .select("role, email, id")
          .eq("id", user.id)
          .single();

        if (error || !userData) {
          // 사용자 데이터가 없으면 관리자 권한으로 가정 (admin 페이지에서 사용하는 경우)
          console.log("사용자 데이터를 찾을 수 없습니다. 관리자 권한으로 설정합니다.");
          setUserRole("admin");
          return;
        }

        // 역할 설정 (기본값: member)
        const userRole = userData.role || "member";
        setUserRole(userRole);

        // 팀 리더인지 확인 (team_roles의 tier를 기반으로 확인)
        if (selectedProgram) {
          try {
            const { data: programData } = await supabase
              .from("programs")
              .select("team_members, participants, team_roles")
              .eq("id", selectedProgram)
              .single();

            if (programData && programData.team_members && programData.team_roles) {
              console.log("프로그램 데이터:", {
                programId: selectedProgram,
                userDataEmail: userData.email,
                participantsCount: programData.participants?.length,
                teamMembersCount: programData.team_members?.length,
                teamRolesCount: programData.team_roles?.length
              });
              
              // 현재 사용자의 participant ID를 찾기 (users 테이블의 이메일로 매칭)
              const participants = programData.participants || [];
              const userParticipant = participants.find((p: any) => 
                p.email === userData.email
              );
              
              console.log("사용자 participant 찾기:", {
                userDataEmail: userData.email,
                participantEmails: participants.map((p: any) => p.email),
                foundParticipant: userParticipant
              });

              if (userParticipant) {
                // team_members에서 이 사용자의 역할 찾기
                const teamMembers = programData.team_members || [];
                const userMembership = teamMembers.find((tm: any) => 
                  tm.participantId === userParticipant.id
                );

                if (userMembership) {
                  setUserTeamId(userMembership.teamId);
                  
                  // team_roles에서 tier 확인
                  const teamRoles = programData.team_roles || [];
                  const userTeamRole = teamRoles.find((role: any) => 
                    role.id === userMembership.roleId
                  );

                  if (userTeamRole) {
                    // tier를 그대로 권한으로 사용
                    const tierRole = `tier${userTeamRole.tier}`;
                    setUserRole(tierRole);
                    console.log("Tier 권한 설정 - 역할:", userTeamRole.name, "tier:", userTeamRole.tier, "권한:", tierRole);
                  }
                }
              }
            }
          } catch (teamError) {
            console.log("팀 권한 확인 중 오류:", teamError);
          }
        }

        console.log("사용자 권한:", userRole, "사용자 ID:", user.id);
      } catch (error) {
        console.error("사용자 권한 확인 실패:", error);
        // 오류 시 관리자 권한으로 가정 (admin 페이지에서 사용하는 경우)
        setUserRole("admin");
      }
    };

    checkUserRole();
  }, [selectedProgram]); // selectedProgram이 변경될 때마다 권한 재확인

  // 프로그램 데이터 로드
  useEffect(() => {
    const loadProgramData = async () => {
      if (!selectedProgram) {
        setSelectedProgramData(null);
        setParticipants([]);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .eq("id", selectedProgram)
          .single();

        if (error) {
          console.error("프로그램 데이터 로드 오류:", error);
          setSelectedProgramData(null);
          setParticipants([]);
        } else {
          setSelectedProgramData(data);
          // participants JSON 필드에서 직접 가져오기
          setParticipants(
            Array.isArray(data.participants) ? data.participants : []
          );
          // teams JSON 필드에서 직접 가져오기
          const allTeams = Array.isArray(data.teams) ? data.teams : [];
          
          // 선택된 팀들만 필터링 (설정이 있는 경우)
          let filteredTeams = widget?.settings?.selected_teams?.length 
            ? allTeams.filter((team: any) => widget?.settings?.selected_teams?.includes(team.id))
            : allTeams;
          
            
          setTeams(filteredTeams);
          // events JSON 필드에서 직접 가져오기
          setEvents(Array.isArray(data.events) ? data.events : []);

          // 재정 데이터 별도 로드 (별도 테이블이므로)
          try {
            const programFinances = await financeApi.getAll(selectedProgram);
            setFinances(programFinances || []);
          } catch (financeError) {
            console.error("재정 데이터 로드 실패:", financeError);
            setFinances([]);
          }
        }
      } catch (error) {
        console.error("프로그램 데이터 로드 실패:", error);
        setSelectedProgramData(null);
        setParticipants([]);
        setTeams([]);
        setEvents([]);
        setFinances([]);
      } finally {
        setLoading(false);
      }
    };

    loadProgramData();
  }, [selectedProgram]);

  // 팀 필터에 따른 데이터 필터링
  const filteredEvents = (() => {
    let baseEvents = events;

    // 팀 필터 적용
    if (selectedTeamFilter !== "all") {
      baseEvents = baseEvents.filter(
        (event) => event.team_id === selectedTeamFilter
      );
    }

    return baseEvents;
  })();

  const filteredParticipants = participants;
  const filteredFinances = finances;

  // 주간 보기 날짜 계산
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
  });

  // 월간 보기 날짜 계산
  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
  });

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter((event) => {
      const eventDate = parseISO(event.start_date);
      return isSameDay(eventDate, date);
    });
  };

  // 팀별 색상
  const getTeamColor = (teamId?: string) => {
    if (!teamId) {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }

    const team = teams.find((t) => t.id === teamId);
    if (team?.color) {
      // hex 색상을 CSS 스타일로 변환
      return "";
    }

    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-yellow-100 text-yellow-800 border-yellow-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-red-100 text-red-800 border-red-200",
    ];
    const index = parseInt(teamId) % colors.length;
    return colors[index];
  };

  // 팀별 스타일 (hex 색상용)
  const getTeamStyle = (teamId?: string) => {
    if (!teamId) {
      return {};
    }

    const team = teams.find((t) => t.id === teamId);
    if (team?.color) {
      return {
        backgroundColor: team.color + "20", // 투명도 추가
        borderColor: team.color,
        color: team.color,
      };
    }

    return {};
  };

  // 날짜 네비게이션
  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate((prev) => addDays(prev, direction === "next" ? 7 : -7));
    } else if (viewMode === "month") {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
        return newDate;
      });
    }
    // list 모드에서는 날짜 네비게이션 없음
  };

  // 재정 통계 계산
  const totalIncome = filteredFinances
    .filter((f) => f.type === "income")
    .reduce((acc, f) => acc + f.amount, 0);
  const totalExpense = filteredFinances
    .filter((f) => f.type === "expense")
    .reduce((acc, f) => acc + f.amount, 0);
  const balance = totalIncome - totalExpense;

  // 일정 시간대 판단 함수
  const getEventTimeStatus = (eventDate: Date, endDate?: Date | null) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );

    if (eventDay < today) {
      return {
        status: "past",
        label: "지난 일정",
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        icon: "",
      };
    } else if (eventDay.getTime() === today.getTime()) {
      if (endDate && endDate < now) {
        return {
          status: "past",
          label: "완료",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          icon: "",
        };
      } else if (eventDate <= now && (!endDate || endDate >= now)) {
        return {
          status: "ongoing",
          label: "진행중",
          color: "text-green-700",
          bgColor: "bg-green-100",
          icon: "",
        };
      } else {
        return {
          status: "today",
          label: "오늘",
          color: "text-blue-700",
          bgColor: "bg-blue-100",
          icon: "",
        };
      }
    } else {
      return {
        status: "upcoming",
        label: "예정",
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        icon: "",
      };
    }
  };

  // 권한에 따른 탭 표시 결정
  const getVisibleTabs = () => {
    const availableTabs = [
      { key: "calendar", label: "일정" },
      { key: "participants", label: "참가자" },
      { key: "finance", label: "재정" },
      { key: "overview", label: "개요" },
    ];

    const tabPermissions = widget?.settings?.tab_permissions || {};
    
    // 탭별 권한 설정이 있는 경우 해당 권한을 확인
    if (Object.keys(tabPermissions).length > 0) {
      // 서브 탭 권한 확인
      const filteredTabs = availableTabs.filter(tab => {
        const tabPermission = tabPermissions[tab.key];
        return !tabPermission || tabPermission.includes(userRole);
      });
      
      return {
        availableTabs: filteredTabs,
      };
    }
    
    // 탭별 권한 설정이 없는 경우 모든 탭 접근 가능
    return {
      availableTabs: availableTabs,
    };
  };

  const tabConfig = getVisibleTabs();

  // 권한에 따른 기본 탭 설정
  useEffect(() => {
    // 권한에 없는 탭이 선택되어 있으면 첫 번째 가능한 탭으로 변경
    if (!tabConfig.availableTabs.some(tab => tab.key === activeTab)) {
      if (tabConfig.availableTabs.length > 0) {
        setActiveTab(tabConfig.availableTabs[0].key);
      }
    }
  }, [userRole, tabConfig, activeTab]);

  // 일정 추가 함수
  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.start_date) {
        alert("제목과 시작 날짜는 필수입니다.");
        return;
      }

      const eventToCreate = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date || undefined,
        location: newEvent.location || undefined,
        program_id: selectedProgram,
        team_id: newEvent.team_id || undefined,
      };

      console.log("생성할 이벤트:", eventToCreate);
      await eventsApi.create(eventToCreate);

      // 프로그램 데이터 새로고침하여 최신 events 가져오기
      if (eventToCreate.program_id) {
        const supabase = createClient();
        const { data } = await supabase
          .from("programs")
          .select("events")
          .eq("id", eventToCreate.program_id)
          .single();

        if (data) {
          setEvents(Array.isArray(data.events) ? data.events : []);
        }
      }

      // 모달 닫기 및 폼 초기화
      setIsEventModalOpen(false);
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        program_id: "",
        team_id: "",
      });

      alert("일정이 추가되었습니다.");
    } catch (error) {
      console.error("일정 추가 실패:", error);
      console.error("에러 상세:", JSON.stringify(error, null, 2));
      alert(
        `일정 추가에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedProgram) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground mb-2">
              프로그램이 선택되지 않았습니다
            </div>
            <div className="text-sm text-gray-500">
              위젯 설정에서 프로그램을 선택해주세요
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {widget?.title || "프로그램 위젯"}
          </h2>
          <p className="text-gray-600">
            {widget?.settings?.subtitle ||
              "프로그램별 주요 정보를 한눈에 확인하세요"}
          </p>
        </div>

        {programs.length > 0 && !widget?.settings?.selected_program && (
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="프로그램 선택" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 참가자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedProgramData?.name || "선택된 프로그램"} 참가자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">프로그램 기간</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              if (
                selectedProgramData?.start_date &&
                selectedProgramData?.end_date
              ) {
                const startDate = format(
                  parseISO(selectedProgramData.start_date),
                  "yyyy.MM.dd",
                  { locale: ko }
                );
                const endDate = format(
                  parseISO(selectedProgramData.end_date),
                  "yyyy.MM.dd",
                  { locale: ko }
                );

                return (
                  <>
                    <div className="text-lg font-bold">
                      {startDate} ~ {endDate}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      프로그램 운영 기간
                    </p>
                  </>
                );
              } else if (selectedProgramData?.start_date) {
                const startDate = format(
                  parseISO(selectedProgramData.start_date),
                  "yyyy.MM.dd",
                  { locale: ko }
                );

                return (
                  <>
                    <div className="text-lg font-bold">
                      {startDate} ~{" "}
                      <span className="text-gray-400">종료일 미정</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      프로그램 시작일
                    </p>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="text-lg font-bold text-gray-400">
                      기간 미정
                    </div>
                    <p className="text-xs text-muted-foreground">
                      프로그램 기간이 설정되지 않았습니다
                    </p>
                  </>
                );
              }
            })()}
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨텐츠 */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full grid-cols-${tabConfig.availableTabs.length}`}
          >
            {tabConfig.availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-2"
              >
                {tab.key === "calendar" && <Calendar size={16} />}
                {tab.key === "participants" && <Users size={16} />}
                {tab.key === "finance" && <DollarSign size={16} />}
                {tab.key === "overview" && <Eye size={16} />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

              {/* 일정 탭 */}
              {tabConfig.availableTabs.some(tab => tab.key === "calendar") && (
                <TabsContent value="calendar" className="space-y-4">
                <div className="space-y-4 p-4">
                  {/* 상단 컨트롤 바 */}
                  <div className="flex justify-between items-center">
                    {/* 뷰 모드 탭 선택 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode("list")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          viewMode === "list"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        목록
                      </button>
                      <button
                        onClick={() => setViewMode("week")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          viewMode === "week"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        주간
                      </button>
                      <button
                        onClick={() => setViewMode("month")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          viewMode === "month"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        월간
                      </button>
                    </div>

                    {/* 일정 추가 버튼 - 탭별 권한 설정 확인 */}
                    {(() => {
                      const tabPermissions = widget?.settings?.tab_permissions || {};
                      const calendarPermission = tabPermissions.calendar;
                      
                      // 일정 탭 권한이 없거나 사용자가 접근 가능한 경우 버튼 표시
                      if (!calendarPermission || calendarPermission.includes(userRole)) {
                        // 추가로 관리자나 고위 tier만 일정 추가 가능하도록 제한
                        return userRole === "admin" || userRole === "tier0" || userRole === "tier1";
                      }
                      
                      return false;
                    })() && (
                      <Dialog
                        open={isEventModalOpen}
                        onOpenChange={setIsEventModalOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <Plus size={16} className="mr-2" />
                            일정 추가
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>새 일정 추가</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">제목 *</Label>
                            <Input
                              id="title"
                              value={newEvent.title}
                              onChange={(e) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              placeholder="일정 제목을 입력하세요"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                              id="description"
                              value={newEvent.description}
                              onChange={(e) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="일정 설명을 입력하세요"
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="start_date">시작 일시 *</Label>
                            <Input
                              id="start_date"
                              type="datetime-local"
                              value={newEvent.start_date}
                              onChange={(e) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  start_date: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="end_date">종료 일시</Label>
                            <Input
                              id="end_date"
                              type="datetime-local"
                              value={newEvent.end_date}
                              onChange={(e) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  end_date: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="location">장소</Label>
                            <Input
                              id="location"
                              value={newEvent.location}
                              onChange={(e) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="장소를 입력하세요"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="team">진행팀</Label>
                            <Select
                              value={newEvent.team_id}
                              onValueChange={(value) =>
                                setNewEvent((prev) => ({
                                  ...prev,
                                  team_id: value === "none" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="진행팀을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">팀 없음</SelectItem>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEventModalOpen(false)}
                          >
                            취소
                          </Button>
                          <Button onClick={handleAddEvent}>추가</Button>
                        </div>
                      </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {/* 팀 필터 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTeamFilter("all")}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTeamFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      전체
                    </button>
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamFilter(team.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTeamFilter === team.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                    {teams.length === 0 && (
                      <span className="text-sm text-gray-500">
                        등록된 팀이 없습니다
                      </span>
                    )}
                  </div>

                  {/* 일정 상세보기 모달 */}
                  <Dialog
                    open={isEventDetailModalOpen}
                    onOpenChange={setIsEventDetailModalOpen}
                  >
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>일정 상세보기</DialogTitle>
                      </DialogHeader>
                      {selectedEvent && (
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                              {selectedEvent.title}
                            </h3>
                            {selectedEvent.description && (
                              <p className="text-gray-600">
                                {selectedEvent.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-500" />
                              <span className="text-sm">
                                일시:{" "}
                                {format(
                                  parseISO(selectedEvent.start_date),
                                  "yyyy년 MM월 dd일 (EEE)",
                                  { locale: ko }
                                )}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-500" />
                              <span className="text-sm">
                                시간:{" "}
                                {format(
                                  parseISO(selectedEvent.start_date),
                                  "HH:mm"
                                )}
                                {selectedEvent.end_date &&
                                  ` - ${format(parseISO(selectedEvent.end_date), "HH:mm")}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <MapPin size={16} className="text-gray-500" />
                              <span className="text-sm">
                                장소: {selectedEvent.location || "미정"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-gray-500" />
                              <span className="text-sm">
                                팀:{" "}
                                {selectedEvent.team_id
                                  ? teams.find(
                                      (t) => t.id === selectedEvent.team_id
                                    )?.name
                                  : "팀 없음"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="text-xs text-gray-500">
                              프로그램:{" "}
                              {allPrograms.find(
                                (p) => p.id === selectedEvent.program_id
                              )?.name || "알 수 없음"}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEventDetailModalOpen(false)}
                        >
                          닫기
                        </Button>
                        {/* 관리자만 수정 가능 - 여기서는 항상 표시하도록 설정 */}
                        <Button
                          onClick={() => {
                            if (selectedEvent) {
                              setEditingEventData({
                                ...selectedEvent,
                                start_date: selectedEvent.start_date
                                  ? format(
                                      parseISO(selectedEvent.start_date),
                                      "yyyy-MM-dd'T'HH:mm"
                                    )
                                  : "",
                                end_date: selectedEvent.end_date
                                  ? format(
                                      parseISO(selectedEvent.end_date),
                                      "yyyy-MM-dd'T'HH:mm"
                                    )
                                  : "",
                              });
                              setIsEditingEvent(true);
                              setIsEventDetailModalOpen(false);
                            }
                          }}
                        >
                          수정
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* 일정 수정 모달 */}
                  <Dialog
                    open={isEditingEvent}
                    onOpenChange={setIsEditingEvent}
                  >
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>일정 수정</DialogTitle>
                      </DialogHeader>
                      {editingEventData && (
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-title">제목 *</Label>
                            <Input
                              id="edit-title"
                              value={editingEventData.title || ""}
                              onChange={(e) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? { ...prev, title: e.target.value }
                                    : null
                                )
                              }
                              placeholder="일정 제목을 입력하세요"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-description">설명</Label>
                            <Textarea
                              id="edit-description"
                              value={editingEventData.description || ""}
                              onChange={(e) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? { ...prev, description: e.target.value }
                                    : null
                                )
                              }
                              placeholder="일정 설명을 입력하세요"
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-start-date">시작 일시 *</Label>
                            <Input
                              id="edit-start-date"
                              type="datetime-local"
                              value={editingEventData.start_date || ""}
                              onChange={(e) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? { ...prev, start_date: e.target.value }
                                    : null
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-end-date">종료 일시</Label>
                            <Input
                              id="edit-end-date"
                              type="datetime-local"
                              value={editingEventData.end_date || ""}
                              onChange={(e) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? { ...prev, end_date: e.target.value }
                                    : null
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-location">장소</Label>
                            <Input
                              id="edit-location"
                              value={editingEventData.location || ""}
                              onChange={(e) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? { ...prev, location: e.target.value }
                                    : null
                                )
                              }
                              placeholder="장소를 입력하세요"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-team">진행팀</Label>
                            <Select
                              value={editingEventData.team_id || ""}
                              onValueChange={(value) =>
                                setEditingEventData((prev: Event | null) =>
                                  prev
                                    ? {
                                        ...prev,
                                        team_id: value === "none" ? "" : value,
                                      }
                                    : null
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="진행팀을 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">팀 없음</SelectItem>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingEvent(false)}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              // 수정된 데이터로 업데이트
                              const supabase = createClient();
                              const { data: program } = await supabase
                                .from("programs")
                                .select("events")
                                .eq("id", selectedProgram)
                                .single();

                              if (program) {
                                const currentEvents = Array.isArray(
                                  program.events
                                )
                                  ? program.events
                                  : [];
                                const updatedEvents = currentEvents.map(
                                  (e: Event) =>
                                    e.id === editingEventData?.id
                                      ? editingEventData
                                      : e
                                );

                                await supabase
                                  .from("programs")
                                  .update({ events: updatedEvents })
                                  .eq("id", selectedProgram);

                                setEvents(updatedEvents);
                                setIsEditingEvent(false);
                                setEditingEventData(null);
                                alert("일정이 수정되었습니다.");
                              }
                            } catch (error) {
                              console.error("일정 수정 실패:", error);
                              alert("일정 수정에 실패했습니다.");
                            }
                          }}
                        >
                          저장
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* 날짜 네비게이션 */}
                  {viewMode !== "list" && (
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate("prev")}
                      >
                        <ChevronLeft size={16} />
                      </Button>

                      <h3 className="text-lg font-semibold">
                        {viewMode === "month"
                          ? format(currentDate, "yyyy년 MM월", { locale: ko })
                          : `${format(weekDays[0], "MM월 dd일", { locale: ko })} - ${format(weekDays[6], "MM월 dd일", { locale: ko })}`}
                      </h3>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateDate("next")}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  {/* 목록 보기 */}
                  {viewMode === "list" && (
                    <div className="space-y-6">
                      {(() => {
                        // 일정을 시간대별로 그룹핑
                        const groupedEvents = filteredEvents
                          .sort(
                            (a, b) =>
                              new Date(a.start_date).getTime() -
                              new Date(b.start_date).getTime()
                          )
                          .reduce(
                            (groups, event) => {
                              const eventDate = parseISO(event.start_date);
                              const endDate = event.end_date
                                ? parseISO(event.end_date)
                                : null;
                              const timeStatus = getEventTimeStatus(
                                eventDate,
                                endDate
                              );

                              if (!groups[timeStatus.status]) {
                                groups[timeStatus.status] = [];
                              }
                              groups[timeStatus.status].push(event);
                              return groups;
                            },
                            {} as Record<string, typeof filteredEvents>
                          );

                        // 정렬 순서 정의
                        const statusOrder = [
                          "ongoing",
                          "today",
                          "upcoming",
                          "past",
                        ];

                        return statusOrder.map((status) => {
                          const events = groupedEvents[status];
                          if (!events || events.length === 0) return null;

                          const statusInfo = {
                            ongoing: {
                              label: "진행중인 일정",
                              icon: "",
                              color: "text-green-700",
                            },
                            today: {
                              label: "오늘 일정",
                              icon: "",
                              color: "text-blue-700",
                            },
                            upcoming: {
                              label: "다가오는 일정",
                              icon: "",
                              color: "text-orange-700",
                            },
                            past: {
                              label: "지난 일정",
                              icon: "",
                              color: "text-gray-500",
                            },
                          }[status];

                          return (
                            <div key={status} className="space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b">
                                <span className="text-lg">
                                  {statusInfo?.icon}
                                </span>
                                <h4
                                  className={`font-semibold text-sm ${statusInfo?.color}`}
                                >
                                  {statusInfo?.label} ({events.length})
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {events.map((event) => {
                                  const program = programs.find(
                                    (p) => p.id === event.program_id
                                  );
                                  const team = teams.find(
                                    (t) => t.id === event.team_id
                                  );
                                  const eventDate = parseISO(event.start_date);
                                  const endDate = event.end_date
                                    ? parseISO(event.end_date)
                                    : null;
                                  const timeStatus = getEventTimeStatus(
                                    eventDate,
                                    endDate
                                  );

                                  return (
                                    <div
                                      key={event.id}
                                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                                        timeStatus.status === "past"
                                          ? "opacity-75"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        setSelectedEvent(event);
                                        setIsEventDetailModalOpen(true);
                                      }}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h3
                                              className={`font-semibold ${timeStatus.status === "past" ? "text-gray-600" : ""}`}
                                            >
                                              {event.title}
                                            </h3>
                                            <span
                                              className={`text-xs px-2 py-1 rounded-full font-medium ${timeStatus.bgColor} ${timeStatus.color}`}
                                            >
                                              {timeStatus.icon}{" "}
                                              {timeStatus.label}
                                            </span>
                                            {team && (
                                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {team.name}
                                              </span>
                                            )}
                                            {program && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {program.name}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center gap-4">
                                              <span className="flex items-center">
                                                <Calendar
                                                  size={14}
                                                  className="mr-1"
                                                />
                                                {format(
                                                  eventDate,
                                                  "yyyy년 MM월 dd일 (EEE)",
                                                  { locale: ko }
                                                )}
                                              </span>
                                              <span className="flex items-center">
                                                <Clock
                                                  size={14}
                                                  className="mr-1"
                                                />
                                                {format(eventDate, "HH:mm")}
                                                {endDate &&
                                                  ` - ${format(endDate, "HH:mm")}`}
                                              </span>
                                              {event.location && (
                                                <span className="flex items-center">
                                                  <MapPin
                                                    size={14}
                                                    className="mr-1"
                                                  />
                                                  {event.location}
                                                </span>
                                              )}
                                            </div>
                                            {team && (
                                              <div className="flex items-center">
                                                <Users
                                                  size={14}
                                                  className="mr-1"
                                                />
                                                담당팀: {team.name}
                                              </div>
                                            )}
                                            {event.description && (
                                              <p className="text-gray-500">
                                                {event.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                          <div
                                            className={`w-3 h-3 rounded-full ${getTeamColor(event.team_id)}`}
                                            title={
                                              team
                                                ? `${team.name} 팀`
                                                : "팀 없음"
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                      {filteredEvents.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          등록된 일정이 없습니다.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 주간 보기 */}
                  {viewMode === "week" && (
                    <div>
                      {/* 요일 헤더 */}
                      <div
                        className="grid border-b"
                        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
                      >
                        <div className="p-2 text-center text-sm font-medium text-gray-500">
                          시간
                        </div>
                        {weekDays.map((day, index) => (
                          <div
                            key={day.toISOString()}
                            className={`p-3 text-center border-l ${
                              isSameDay(day, new Date()) ? "bg-blue-50" : ""
                            }`}
                          >
                            <div
                              className={`text-xs font-medium ${
                                index === 0
                                  ? "text-red-600"
                                  : index === 6
                                    ? "text-blue-600"
                                    : "text-gray-500"
                              }`}
                            >
                              {format(day, "EEE", { locale: ko })}
                            </div>
                            <div className="text-lg font-medium">
                              {format(day, "d")}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 시간별 그리드 */}
                      <div className="relative">
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div
                            key={hour}
                            className="grid border-b"
                            style={{
                              height: "60px",
                              gridTemplateColumns: "60px repeat(7, 1fr)",
                            }}
                          >
                            <div className="p-1 text-xs text-gray-500 border-r flex items-center justify-center">
                              {hour.toString().padStart(2, "0")}:00
                            </div>
                            {weekDays.map((_, dayIndex) => (
                              <div key={dayIndex} className="border-l"></div>
                            ))}
                          </div>
                        ))}

                        {/* 이벤트 표시 */}
                        {weekDays.map((day, dayIndex) => {
                          const dayEvents = getEventsForDay(day);

                          return dayEvents.map((event) => {
                            const startTime = parseISO(event.start_date);
                            const endTime = event.end_date
                              ? parseISO(event.end_date)
                              : new Date(startTime.getTime() + 60 * 60 * 1000);
                            const startHour = startTime.getHours();
                            const startMinute = startTime.getMinutes();
                            const duration = event.end_date
                              ? (endTime.getTime() - startTime.getTime()) /
                                (1000 * 60 * 60)
                              : 1;

                            // 간단한 겹침 처리: 같은 시간에 시작하는 이벤트들만 처리
                            const sameTimeEvents = dayEvents.filter(
                              (e) =>
                                e.start_date.substring(0, 13) ===
                                event.start_date.substring(0, 13) // 같은 시간(시까지)
                            );

                            const totalOverlapping = sameTimeEvents.length;
                            const eventIndexInOverlap =
                              sameTimeEvents.findIndex(
                                (e) => e.id === event.id
                              );

                            // 시간 컬럼 60px 이후 계산 (calc 사용)
                            const dayWidth = `calc((100% - 60px) / 7)`; // 각 날짜 컬럼의 폭
                            const eventWidth =
                              totalOverlapping > 1
                                ? `calc(${dayWidth} / ${totalOverlapping})`
                                : dayWidth;
                            const eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + ${eventIndexInOverlap} * ${eventWidth})`;

                            const program = programs.find(
                              (p) => p.id === event.program_id
                            );

                            return (
                              <div
                                key={event.id}
                                className={`absolute p-1 border rounded cursor-pointer hover:shadow-md transition-shadow ${getTeamColor(
                                  event.team_id
                                )}`}
                                style={{
                                  left: eventLeft,
                                  top: `${startHour * 60 + (startMinute / 60) * 60}px`,
                                  width: eventWidth,
                                  height: `${Math.max(duration * 60 - 4, 30)}px`,
                                  fontSize: "10px",
                                  zIndex: 10 + eventIndexInOverlap,
                                  ...getTeamStyle(event.team_id),
                                }}
                                title={`${event.title} - ${program?.name || "프로그램"}`}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setIsEventDetailModalOpen(true);
                                }}
                              >
                                <div
                                  className="font-medium text-xs leading-tight overflow-hidden"
                                  style={{
                                    wordBreak: "break-word",
                                    display: "-webkit-box",
                                    WebkitLineClamp: Math.max(
                                      Math.floor(duration * 3),
                                      1
                                    ),
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {event.title}
                                </div>
                                {program &&
                                  totalOverlapping === 1 &&
                                  duration > 1 && (
                                    <div
                                      className="opacity-75 text-xs leading-tight overflow-hidden mt-1"
                                      style={{
                                        wordBreak: "break-word",
                                        display: "-webkit-box",
                                        WebkitLineClamp: Math.max(
                                          Math.floor(duration * 2),
                                          1
                                        ),
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {program.name}
                                    </div>
                                  )}
                                {event.location && duration > 0.5 && (
                                  <div
                                    className="opacity-60 text-xs leading-tight overflow-hidden mt-1"
                                    style={{
                                      wordBreak: "break-word",
                                      display: "-webkit-box",
                                      WebkitLineClamp: Math.max(
                                        Math.floor(duration * 1.5),
                                        1
                                      ),
                                      WebkitBoxOrient: "vertical",
                                    }}
                                  >
                                    📍 {event.location}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  )}

                  {/* 월간 보기 */}
                  {viewMode === "month" && (
                    <div>
                      {/* 요일 헤더 */}
                      <div className="grid grid-cols-7 border-b">
                        {["일", "월", "화", "수", "목", "금", "토"].map(
                          (day, index) => (
                            <div
                              key={day}
                              className={`p-3 text-center text-sm font-medium border-r last:border-r-0 ${
                                index === 0
                                  ? "text-red-600"
                                  : index === 6
                                    ? "text-blue-600"
                                    : "text-gray-700"
                              }`}
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>

                      {/* 날짜 그리드 */}
                      <div className="grid grid-cols-7">
                        {monthDays.map((day, index) => {
                          const dayEvents = getEventsForDay(day);
                          const isCurrentMonth = isSameMonth(day, currentDate);
                          const isToday = isSameDay(day, new Date());

                          return (
                            <div
                              key={day.toISOString()}
                              className={`min-h-[80px] p-2 border-b border-r last:border-r-0 ${
                                !isCurrentMonth ? "bg-gray-50 opacity-50" : ""
                              } ${isToday ? "bg-blue-50" : ""}`}
                            >
                              <div
                                className={`text-sm font-medium mb-1 ${
                                  index % 7 === 0
                                    ? "text-red-600"
                                    : index % 7 === 6
                                      ? "text-blue-600"
                                      : "text-gray-700"
                                }`}
                              >
                                {format(day, "d")}
                              </div>

                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event) => {
                                  const program = programs.find(
                                    (p) => p.id === event.program_id
                                  );
                                  return (
                                    <div
                                      key={event.id}
                                      className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getTeamColor(
                                        event.team_id
                                      )}`}
                                      style={{
                                        ...getTeamStyle(event.team_id),
                                      }}
                                      title={`${event.title} - ${program?.name || "프로그램"}`}
                                      onClick={() => {
                                        setSelectedEvent(event);
                                        setIsEventDetailModalOpen(true);
                                      }}
                                    >
                                      <div className="font-medium truncate">
                                        {event.title}
                                      </div>
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    +{dayEvents.length - 2}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </TabsContent>
              )}

              {/* 참가자 탭 */}
              {tabConfig.availableTabs.some(tab => tab.key === "participants") && (
                <TabsContent value="participants" className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">최근 등록 참가자</h3>
                    <Badge variant="outline">
                      총 {filteredParticipants.length}명
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {filteredParticipants
                      .sort(
                        (a, b) =>
                          new Date(b.registered_at).getTime() -
                          new Date(a.registered_at).getTime()
                      )
                      .slice(0, 10)
                      .map((participant) => {
                        return (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium">
                                {participant.name}
                              </h4>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span>{participant.email}</span>
                                {selectedProgramData && (
                                  <Badge variant="outline" className="text-xs">
                                    {selectedProgramData.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  participant.status === "승인"
                                    ? "default"
                                    : participant.status === "신청"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {participant.status}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {format(
                                  parseISO(participant.registered_at),
                                  "MM/dd"
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                </TabsContent>
              )}

              {/* 재정 탭 */}
              {tabConfig.availableTabs.some(tab => tab.key === "finance") && (
                <TabsContent value="finance" className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">총 수입</div>
                        <div className="text-2xl font-bold text-green-600">
                          ₩{totalIncome.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">총 지출</div>
                        <div className="text-2xl font-bold text-red-600">
                          ₩{totalExpense.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">잔액</div>
                        <div
                          className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}
                        >
                          ₩{balance.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      최근 거래 내역
                    </h3>
                    <div className="space-y-2">
                      {filteredFinances
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .slice(0, 10)
                        .map((finance) => {
                          const program = programs.find(
                            (p) => p.id === finance.program_id
                          );
                          return (
                            <div
                              key={finance.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <h4 className="font-medium">
                                  {finance.description}
                                </h4>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                  <span>{finance.category}</span>
                                  {program && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {program.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-medium ${
                                    finance.type === "income"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {finance.type === "income" ? "+" : "-"}₩
                                  {finance.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(parseISO(finance.date), "MM/dd")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
                </TabsContent>
              )}

              {/* 개요 탭 */}
              {tabConfig.availableTabs.some(tab => tab.key === "overview") && (
                <TabsContent value="overview" className="p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      프로그램별 현황
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {programs.map((program) => {
                        const programParticipants = participants.filter(
                          (p) => p.program_id === program.id
                        );
                        const programEvents = events.filter(
                          (e) => e.program_id === program.id
                        );
                        const programFinances = finances.filter(
                          (f) => f.program_id === program.id
                        );
                        const programBalance = programFinances.reduce(
                          (acc, f) =>
                            acc + (f.type === "income" ? f.amount : -f.amount),
                          0
                        );

                        return (
                          <Card key={program.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-semibold">
                                  {program.name}
                                </h4>
                                <Badge
                                  variant={
                                    program.status === "진행중"
                                      ? "default"
                                      : program.status === "계획중"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {program.status}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">참가자</span>
                                  <span className="font-medium">
                                    {programParticipants.length}명
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">일정</span>
                                  <span className="font-medium">
                                    {programEvents.length}개
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">예산</span>
                                  <span
                                    className={`font-medium ${programBalance >= 0 ? "text-blue-600" : "text-red-600"}`}
                                  >
                                    ₩{programBalance.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      다가오는 일정
                    </h3>
                    <div className="space-y-2">
                      {filteredEvents
                        .filter(
                          (event) => new Date(event.start_date) >= new Date()
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.start_date).getTime() -
                            new Date(b.start_date).getTime()
                        )
                        .slice(0, 5)
                        .map((event) => {
                          const program = programs.find(
                            (p) => p.id === event.program_id
                          );
                          const eventDate = parseISO(event.start_date);
                          const daysUntil = Math.ceil(
                            (eventDate.getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          );

                          return (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{event.title}</h4>
                                  {program && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {program.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {format(eventDate, "MM월 dd일 (EEE) HH:mm", {
                                    locale: ko,
                                  })}
                                  {event.location && ` • ${event.location}`}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-blue-600">
                                D-{daysUntil}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
                </TabsContent>
              )}
        </Tabs>
      </Card>
    </div>
  );
}
