"use client";

import { useState, useEffect } from "react";
import CalendarTab from "@/app/(auth-pages)/admin/programs/[id]/components/calendar-tab";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Users,
  UserCheck,
  DollarSign,
  CheckCircle,
  BarChart3,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import ChecklistTab from "@/app/(auth-pages)/admin/programs/[id]/components/checklist-tab";
import FinanceTab from "@/app/(auth-pages)/admin/programs/[id]/components/finance-tab";
import AttendanceTab from "@/app/(auth-pages)/admin/programs/[id]/components/attendance-tab";
import ParticipantsTab from "@/app/(auth-pages)/admin/programs/[id]/components/participants-tab";
import DashboardTab from "@/app/(auth-pages)/admin/programs/[id]/components/dashboard-tab";
import WordTab from "@/app/(auth-pages)/admin/programs/[id]/components/word-tab";
import { createClient } from "@/utils/supabase/client";

interface Program {
  id: string;
  name: string;
  category: string;
  status: string;
  start_date?: string;
  end_date?: string;
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
      view_permissions?: {
        [key: string]: string[];
      };
      edit_permissions?: {
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>(
    widget?.settings?.selected_program || selectedProgramId || ""
  );
  const [selectedProgramData, setSelectedProgramData] =
    useState<Program | null>(null);
  const [allPrograms, setAllPrograms] = useState<Program[]>(programs);

  // 레이아웃 매니저에서 설정한 권한 구조
  const viewPermissions = widget?.settings?.view_permissions || {};
  const managePermissions = widget?.settings?.edit_permissions || {};

  // props 변경 시 상태 업데이트
  useEffect(() => {
    setAllPrograms(programs);
  }, [programs]);

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("guest");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Alert 다이얼로그 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // 관리자 권한 확인 함수 - 권한 기반으로 수정
  const hasAdminPermission = () => {
    // 권한 기반 체크 우선
    const hasManagePermission = hasAnyPermission([
      "create_programs",
      "update_programs",
      "delete_programs",
      "manage_all",
    ]);

    // 레거시 역할 기반 체크 (하위 호환성)
    const adminRoles = ["admin", "tier0", "tier1"];
    const hasAdminRole =
      adminRoles.some((role) => userRoles.includes(role)) ||
      adminRoles.includes(userRole);

    const result = hasManagePermission || hasAdminRole;

    return result;
  };

  // 게스트 포함 읽기 권한 확인 함수 - 권한 기반으로 수정
  const hasViewPermission = () => {
    // 권한 기반 체크 우선
    const hasReadPermission = hasAnyPermission(["view_programs", "read_all"]);

    // 레거시 역할 기반 체크 (하위 호환성)
    const viewRoles = ["admin", "tier0", "tier1", "tier2", "tier3", "guest"];
    const hasViewRole =
      viewRoles.some((role) => userRoles.includes(role)) ||
      viewRoles.includes(userRole);

    const result = hasReadPermission || hasViewRole;

    return result;
  };

  // 특정 역할 권한 확인 함수 (혼합 권한 시스템)
  const hasRolePermission = (allowedRoles: string[]) => {
    if (allowedRoles.length === 0) return false;

    // 계층적 역할 (guest → member → admin)
    const hierarchicalRoles = ["guest", "member", "admin"];
    const roleHierarchy: { [key: string]: number } = {
      guest: 0, // 비회원 (최하위)
      member: 1, // 교인 (로그인 사용자)
      admin: 2, // 관리자 (최고 권한)
    };

    // 허용된 역할 중 계층적 역할과 특별 역할 분리
    const allowedHierarchicalRoles = allowedRoles.filter((role) =>
      hierarchicalRoles.includes(role)
    );
    const allowedSpecialRoles = allowedRoles.filter(
      (role) => !hierarchicalRoles.includes(role)
    );

    // 현재 사용자의 역할 분석
    const allUserRoles = [...userRoles, userRole].filter(Boolean);
    const userHierarchicalRoles = allUserRoles.filter((role) =>
      hierarchicalRoles.includes(role)
    );
    const userSpecialRoles = allUserRoles.filter(
      (role) => !hierarchicalRoles.includes(role)
    );

    // 사용자의 계층적 레벨 결정
    let userHierarchicalLevel = 0; // 기본값: guest
    if (userRole === "guest" && userRoles.length <= 1) {
      userHierarchicalLevel = 0; // 비회원
    } else if (userHierarchicalRoles.length > 0) {
      // 가장 높은 계층적 역할의 레벨
      userHierarchicalLevel = Math.max(
        ...userHierarchicalRoles.map((role) => roleHierarchy[role] || 0)
      );
    } else {
      // 로그인했지만 특별한 계층적 역할이 없는 경우 member로 처리
      userHierarchicalLevel = 1; // member
    }

    let hasAccess = false;

    // 1. 계층적 역할 체크
    if (allowedHierarchicalRoles.length > 0) {
      const maxAllowedLevel = Math.max(
        ...allowedHierarchicalRoles.map((role) => roleHierarchy[role] || 0)
      );
      if (userHierarchicalLevel >= maxAllowedLevel) {
        hasAccess = true;
      }
    }

    // 2. 특별 역할 체크 (정확한 매칭)
    if (!hasAccess && allowedSpecialRoles.length > 0) {
      hasAccess = allowedSpecialRoles.some((role) =>
        userSpecialRoles.includes(role)
      );
    }

    return hasAccess;
  };

  // 특정 권한 확인 함수
  const hasPermission = (permission: string) => {
    const result = userPermissions.includes(permission);
    return result;
  };

  // 여러 권한 중 하나라도 있는지 확인
  const hasAnyPermission = (permissions: string[]) => {
    const result = permissions.some((permission) =>
      userPermissions.includes(permission)
    );
    return result;
  };

  // CRUD 권한 확인 함수들
  const canView = (resource: string = "programs") =>
    hasPermission(`view_${resource}`) || hasPermission("view_all");
  const canCreate = (resource: string = "programs") =>
    hasPermission(`create_${resource}`) || hasPermission("create_all");
  const canUpdate = (resource: string = "programs") =>
    hasPermission(`update_${resource}`) || hasPermission("update_all");
  const canDelete = (resource: string = "programs") =>
    hasPermission(`delete_${resource}`) || hasPermission("delete_all");

  // Alert 다이얼로그 표시 함수
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setUserRole("guest");
          setUserRoles(["guest"]);
          setUserPermissions([]);
          return;
        }

        // users 테이블에서 역할 및 권한 확인 (다중 역할 포함)
        const { data: userData, error } = await supabase
          .from("users")
          .select(
            `
            role, 
            roles,
            email, 
            id
          `
          )
          .eq("id", user.id)
          .single();

        if (error || !userData) {
          // 사용자 데이터가 없으면 관리자 권한으로 가정 (admin 페이지에서 사용하는 경우)
          setUserRole("admin");
          return;
        }

        // JSON roles 필드 사용 (간단한 방식)
        let userRole = "member"; // 기본값 (하위 호환성)
        let allUserRoles: string[] = []; // 모든 역할 저장
        let allUserPermissions: string[] = []; // 권한은 일단 빈 배열 (필요시 추가)

        // roles JSON 배열 사용
        if (
          userData.roles &&
          Array.isArray(userData.roles) &&
          userData.roles.length > 0
        ) {
          allUserRoles = userData.roles;
          userRole = userData.roles[0]; // 첫 번째 역할을 주 역할로 설정
        } else if (userData.role) {
          // 레거시 단일 role 필드 사용
          userRole = userData.role;
          allUserRoles = [userData.role];
        } else {
          // 기본값
          userRole = "member";
          allUserRoles = ["member"];
        }

        setUserRole(userRole);
        setUserRoles(allUserRoles);
        setUserPermissions(allUserPermissions);

        // members 테이블에서 사용자의 팀 정보만 확인 (권한은 DB roles만 사용)
        if (selectedProgram) {
          try {
            // members 테이블에서 현재 사용자의 팀 정보 조회
            const { data: memberData } = await supabase
              .from("members")
              .select("team_id")
              .eq("user_id", user.id)
              .single();

            if (memberData) {
              setUserTeamId(memberData.team_id);
            }
          } catch (teamError) {
            console.log("팀 정보 확인 중 오류:", teamError);
          }
        }
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
            ? allTeams.filter((team: any) =>
                widget?.settings?.selected_teams?.includes(team.id)
              )
            : allTeams;

          setTeams(filteredTeams);
        }
      } catch (error) {
        console.error("프로그램 데이터 로드 실패:", error);
        setSelectedProgramData(null);
        setParticipants([]);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadProgramData();
  }, [selectedProgram]);

  const filteredParticipants = participants;

  // 권한에 따른 탭 표시 결정
  const getVisibleTabs = () => {
    const availableTabs = [
      { key: "dashboard", label: "대시보드" },
      { key: "calendar", label: "일정" },
      { key: "participants", label: "참가자" },
      { key: "attendance", label: "출석" },
      { key: "finance", label: "재정" },
      { key: "checklist", label: "확인사항" },
      { key: "word", label: "문서" },
    ];

    // 권한 확인 로직 - 레이아웃 매니저의 view_permissions 기반으로 수정
    const filteredTabs = availableTabs.filter((tab) => {
      const tabViewPermissions = viewPermissions[tab.key] || [];

      // 레이아웃 매니저의 로직과 일치시킴
      // 권한 설정이 있는 위젯의 경우
      if (Object.keys(viewPermissions).length > 0) {
        // 해당 탭에 권한이 설정되지 않았으면 접근 불가 (레이아웃 매니저와 동일)
        if (!tabViewPermissions || tabViewPermissions.length === 0) {
          return false;
        }

        // 권한이 설정된 탭은 해당 권한 확인
        const hasAccess = hasRolePermission(tabViewPermissions);

        return hasAccess;
      }

      // 권한 설정이 전혀 없는 위젯은 모든 탭 표시
      return true;
    });

    return {
      availableTabs: filteredTabs,
    };
  };

  const tabConfig = getVisibleTabs();

  // 권한에 따른 기본 탭 설정
  useEffect(() => {
    // 권한에 없는 탭이 선택되어 있으면 첫 번째 가능한 탭으로 변경
    if (!tabConfig.availableTabs.some((tab) => tab.key === activeTab)) {
      if (tabConfig.availableTabs.length > 0) {
        setActiveTab(tabConfig.availableTabs[0].key);
      }
    }
  }, [userRole, userRoles, userPermissions, tabConfig, activeTab]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground dark:text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedProgram) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-muted-foreground dark:text-gray-400 mb-2">
              프로그램이 선택되지 않았습니다
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              위젯 설정에서 프로그램을 선택해주세요
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-0 sm:p-6 sm:space-y-4">
      {/* 헤더 영역 */}
      <div className="flex flex-col p-4 sm:p-0 ">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {widget?.title || "프로그램 대시보드"}
            </h2>
            <p className="text-slate-600 dark:text-gray-400 text-sm">
              {widget?.settings?.subtitle ||
                "프로그램별 주요 정보를 한눈에 확인하세요"}
            </p>
          </div>

          {programs.length > 0 && !widget?.settings?.selected_program && (
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger className="w-full sm:w-[220px] h-11 bg-white dark:bg-gray-800 border-gray-200/60 dark:border-gray-700 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all dark:text-white">
                <SelectValue placeholder="📋 프로그램 선택" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
                {programs.map((program) => (
                  <SelectItem
                    key={program.id}
                    value={program.id}
                    className="rounded-lg"
                  >
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="bg-white dark:bg-gray-800 sm:rounded-2xl sm:border sm:border-gray-200/60 dark:border-gray-700 sm:shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-gray-50/50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200/60 dark:border-gray-700">
            <div className="flex overflow-x-auto scrollbar-hide gap-2">
              {tabConfig.availableTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700"
                  }`}
                  title={tab.label}
                >
                  {tab.key === "calendar" && <Calendar size={16} />}
                  {tab.key === "participants" && <Users size={16} />}
                  {tab.key === "attendance" && <UserCheck size={16} />}
                  {tab.key === "finance" && <DollarSign size={16} />}
                  {tab.key === "checklist" && <CheckCircle size={16} />}
                  {tab.key === "dashboard" && <BarChart3 size={16} />}
                  {tab.key === "word" && <FileText size={16} />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 일정 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "calendar") && (
            <TabsContent value="calendar">
              <CalendarTab
                programId={selectedProgram || ""}
                hasEditPermission={hasAdminPermission()}
              />
            </TabsContent>
          )}

          {/* 참가자 탭 */}
          {tabConfig.availableTabs.some(
            (tab) => tab.key === "participants"
          ) && (
            <TabsContent value="participants" className="p-0">
              <ParticipantsTab
                programId={selectedProgram || ""}
                hasEditPermission={(() => {
                  const participantsManagePermissions =
                    managePermissions.participants || [];

                  // 관리 권한이 있는 위젯의 경우
                  if (Object.keys(managePermissions).length > 0) {
                    // 참가자 관리 권한이 설정되지 않았으면 접근 불가
                    if (participantsManagePermissions.length === 0) {
                      return false;
                    }

                    return hasRolePermission(participantsManagePermissions);
                  }

                  // 위젯에 관리 권한 설정이 전혀 없으면 기본 관리자 권한으로 체크
                  return hasAdminPermission();
                })()}
              />
            </TabsContent>
          )}

          {/* 출석 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "attendance") && (
            <TabsContent value="attendance" className="p-4">
              <AttendanceTab programId={selectedProgram || ""} />
            </TabsContent>
          )}

          {/* 재정 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "finance") && (
            <TabsContent value="finance" className="p-0">
              <FinanceTab
                programId={selectedProgram || ""}
                hasEditPermission={(() => {
                  const financeManagePermissions =
                    managePermissions.finance || [];

                  // 관리 권한이 있는 위젯의 경우
                  if (Object.keys(managePermissions).length > 0) {
                    // 재정 관리 권한이 설정되지 않았으면 접근 불가
                    if (financeManagePermissions.length === 0) {
                      return false;
                    }

                    const result = hasRolePermission(financeManagePermissions);
                    return result;
                  }

                  // 위젯에 관리 권한 설정이 전혀 없으면 기본 관리자 권한으로 체크
                  const adminResult = hasAdminPermission();
                  return adminResult;
                })()}
              />
            </TabsContent>
          )}

          {/* 확인사항 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "checklist") && (
            <TabsContent value="checklist" className="p-4">
              {allPrograms.map((program) => (
                <ChecklistTab
                  key={program.id}
                  programId={selectedProgram || ""}
                  hasEditPermission={(() => {
                    const checklistManagePermissions =
                      managePermissions.checklist || [];

                    // 관리 권한이 있는 위젯의 경우
                    if (Object.keys(managePermissions).length > 0) {
                      // 확인사항 관리 권한이 설정되지 않았으면 접근 불가
                      if (checklistManagePermissions.length === 0) {
                        return false;
                      }

                      return hasRolePermission(checklistManagePermissions);
                    }

                    // 위젯에 관리 권한 설정이 전혀 없으면 기본 관리자 권한으로 체크
                    return hasAdminPermission();
                  })()}
                />
              ))}
              {allPrograms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <CheckCircle
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>등록된 프로그램이 없습니다.</p>
                </div>
              )}
            </TabsContent>
          )}

          {/* 대시보드 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "dashboard") && (
            <TabsContent
              value="dashboard"
              className="px-4 py-2 sm:py-4 sm:px-6"
            >
              <DashboardTab
                programId={selectedProgram || ""}
                onNavigateToTab={setActiveTab}
              />
            </TabsContent>
          )}

          {/* 문서 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "word") && (
            <TabsContent value="word" className="p-0">
              <WordTab
                programId={selectedProgram || ""}
                onNavigateToTab={setActiveTab}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Alert 다이얼로그 */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
