"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  UserCheck,
  DollarSign,
  Eye,
  Plus,
  Trash2,
  Edit,
  Settings,
  CheckCircle,
  Filter,
  BarChart3,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import {
  format,
  addDays,
  addHours,
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
import { formatHourToKorean, formatDateTimeToKorean, formatFullDateTimeToKorean } from "@/lib/time-format";
import ChecklistTab from "@/app/(auth-pages)/admin/programs/[id]/components/checklist-tab";
import FinanceTab from "@/app/(auth-pages)/admin/programs/[id]/components/finance-tab";
import AttendanceTab from "@/app/(auth-pages)/admin/programs/[id]/components/attendance-tab";
import ParticipantsTab from "@/app/(auth-pages)/admin/programs/[id]/components/participants-tab";
import DashboardTab from "@/app/(auth-pages)/admin/programs/[id]/components/dashboard-tab";
import {
  eventsApi,
  type Event,
} from "@/app/(auth-pages)/admin/programs/[id]/utils/api";
import { createClient } from "@/utils/supabase/client";
import {
  initializeGoogleAPI,
  authenticateUser,
  syncMultipleEvents,
  createOrUpdateEvent,
  deleteAllConnectNextEvents,
} from "@/utils/google-calendar-api";

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
  google_calendar_color_id?: string;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");
  const [events, setEvents] = useState<Event[]>([]);
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

  // 디버깅용 로그
  console.log("ProgramsWidget - props.programs:", programs);
  console.log("ProgramsWidget - allPrograms:", allPrograms);

  // props 변경 시 상태 업데이트
  useEffect(() => {
    setAllPrograms(programs);
  }, [programs]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventData, setEditingEventData] = useState<Event | null>(null);
  const [userRole, setUserRole] = useState<string>("guest"); // admin, team_leader, member, guest
  const [userRoles, setUserRoles] = useState<string[]>([]); // 다중 역할 지원
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // 사용자 권한 목록
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Google Calendar API 관련 상태
  const [isGoogleAPIInitialized, setIsGoogleAPIInitialized] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Google Calendar API 초기화
  const initGoogleAPI = async () => {
    try {
      const initialized = await initializeGoogleAPI();
      setIsGoogleAPIInitialized(initialized);
      return initialized;
    } catch (error) {
      console.error("Google API 초기화 실패:", error);
      return false;
    }
  };

  // Google Calendar 인증
  const authenticateGoogle = async () => {
    try {
      if (!isGoogleAPIInitialized) {
        const initialized = await initGoogleAPI();
        if (!initialized) {
          throw new Error("Google API 초기화 실패");
        }
      }

      const authenticated = await authenticateUser();
      setIsGoogleAuthenticated(authenticated);

      if (authenticated) {
        showAlert("성공", "Google Calendar에 연결되었습니다!");
      } else {
        showAlert("오류", "Google Calendar 인증에 실패했습니다.");
      }

      return authenticated;
    } catch (error) {
      console.error("Google Calendar 인증 실패:", error);
      showAlert("오류", "Google Calendar 인증 중 오류가 발생했습니다.");
      return false;
    }
  };

  // 팀 색상을 Google Calendar 색상 ID로 변환
  const getGoogleCalendarColorId = (teamId: string): string => {
    const team = teams.find((t) => t.id === teamId);

    // 팀에 구글 캘린더 색상 ID가 설정되어 있으면 우선 사용
    if (team?.google_calendar_color_id) {
      return team.google_calendar_color_id;
    }

    // 구글 캘린더 색상 ID가 없으면 기존 hex 색상을 매핑
    if (team?.color) {
      const colorMap: { [key: string]: string } = {
        "#a4bdfc": "1", // 라벤더
        "#7ae7bf": "2", // 세이지
        "#dbadff": "3", // 그레이프
        "#ff887c": "4", // 플라밍고
        "#fbd75b": "5", // 바나나
        "#ffb878": "6", // 탠저린
        "#46d6db": "7", // 피콕
        "#e1e1e1": "8", // 그래파이트
        "#5484ed": "9", // 블루베리
        "#51b749": "10", // 바질
        "#dc2127": "11", // 토마토
        // 기존 색상들도 호환성을 위해 유지
        "#3B82F6": "9", // 파란색
        "#EF4444": "11", // 빨간색
        "#10B981": "10", // 초록색
        "#F59E0B": "5", // 노란색
        "#8B5CF6": "3", // 보라색
        "#06B6D4": "7", // 청록색
        "#F97316": "6", // 주황색
        "#EC4899": "4", // 핑크색
      };

      return colorMap[team.color] || "9"; // 기본 블루베리
    }

    // 팀 정보가 없으면 기본 블루베리 색상
    return "9";
  };

  // 스마트 동기화 (생성/업데이트)
  const syncEventsToGoogle = async () => {
    try {
      if (!isGoogleAuthenticated) {
        const authenticated = await authenticateGoogle();
        if (!authenticated) return;
      }

      setIsSyncing(true);

      const calendarEvents = filteredEvents.map((event) => ({
        title: event.title,
        startDate: parseISO(event.start_date),
        endDate: event.end_date
          ? parseISO(event.end_date)
          : addHours(parseISO(event.start_date), 1),
        description: event.description || "",
        location: event.location || "",
        connectId: `connect_${event.id}`,
        colorId: getGoogleCalendarColorId(event.team_id || ""), // 팀별 색상
      }));

      const results = await syncMultipleEvents(calendarEvents);

      showAlert(
        "동기화 완료",
        `생성: ${results.created}개, 업데이트: ${results.updated}개${results.errors > 0 ? `, 오류: ${results.errors}개` : ""}`
      );
    } catch (error) {
      console.error("Google Calendar 동기화 실패:", error);
      showAlert("오류", "Google Calendar 동기화 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Next 일정들만 삭제
  const deleteConnectNextEventsFromGoogle = async () => {
    try {
      if (!isGoogleAuthenticated) {
        const authenticated = await authenticateGoogle();
        if (!authenticated) return;
      }

      setIsSyncing(true);

      const results = await deleteAllConnectNextEvents();

      showAlert(
        "삭제 완료",
        `삭제: ${results.deleted}개${results.errors > 0 ? `, 오류: ${results.errors}개` : ""}`
      );
    } catch (error) {
      console.error("Google Calendar 삭제 실패:", error);
      showAlert("오류", "Google Calendar 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsSyncing(false);
    }
  };

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

    console.log("🔍 hasAdminPermission:", {
      hasManagePermission,
      hasAdminRole,
      result,
      userPermissions,
      userRoles,
      userRole,
    });

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

    console.log("🔍 hasViewPermission:", {
      hasReadPermission,
      hasViewRole,
      result,
      userPermissions,
      userRoles,
      userRole,
    });

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
    console.log("🔍 hasPermission:", {
      permission,
      userPermissions,
      result,
    });
    return result;
  };

  // 여러 권한 중 하나라도 있는지 확인
  const hasAnyPermission = (permissions: string[]) => {
    const result = permissions.some((permission) =>
      userPermissions.includes(permission)
    );
    console.log("🔍 hasAnyPermission:", {
      permissions,
      userPermissions,
      result,
    });
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

  // 일정 삭제 확인 후 실행
  const confirmDeleteEvent = async () => {
    if (!eventToDeleteConfirm) return;

    try {
      await eventsApi.delete(eventToDeleteConfirm.id, selectedProgram);

      // 프로그램 데이터 새로고침
      if (selectedProgram) {
        const supabase = createClient();
        const { data } = await supabase
          .from("programs")
          .select("events")
          .eq("id", selectedProgram)
          .single();

        if (data) {
          setEvents(Array.isArray(data.events) ? data.events : []);
        }
      }
      // 모달 닫기
      setIsEventDetailModalOpen(false);
      setSelectedEvent(null);

      showAlert("삭제 완료", "일정이 삭제되었습니다.");
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      showAlert(
        "삭제 실패",
        `일정 삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    } finally {
      setDeleteConfirmOpen(false);
      setEventToDeleteConfirm(null);
    }
  };


  // 장소 관리 상태
  const [isLocationSettingsOpen, setIsLocationSettingsOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  const [editingLocationIndex, setEditingLocationIndex] = useState<
    number | null
  >(null);
  const [editingLocationValue, setEditingLocationValue] = useState("");
  // 날짜별 일정 보기 모달 상태
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);


  // 반복 일정 삭제 옵션 모달 상태
  const [isRecurringDeleteModalOpen, setIsRecurringDeleteModalOpen] =
    useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  // 반복 일정 수정 옵션 모달 상태
  const [isRecurringEditModalOpen, setIsRecurringEditModalOpen] =
    useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);

  // Alert 다이얼로그 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // 삭제 확인 다이얼로그 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDeleteConfirm, setEventToDeleteConfirm] = useState<any>(null);








  // events_settings 구조: { locations: string[], defaultDuration: number, ... }
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    location: "",
    program_id: "",
    team_id: "",
    isRecurring: false,
    recurringEndDate: "",
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

        console.log("🔍 사용자 데이터 조회 결과:", { userData, error });

        if (error || !userData) {
          // 사용자 데이터가 없으면 관리자 권한으로 가정 (admin 페이지에서 사용하는 경우)
          console.log(
            "사용자 데이터를 찾을 수 없습니다. 관리자 권한으로 설정합니다."
          );
          setUserRole("admin");
          return;
        }

        // JSON roles 필드 사용 (간단한 방식)
        let userRole = "member"; // 기본값 (하위 호환성)
        let allUserRoles: string[] = []; // 모든 역할 저장
        let allUserPermissions: string[] = []; // 권한은 일단 빈 배열 (필요시 추가)

        console.log("🔍 사용자 roles 데이터:", userData.roles);

        // roles JSON 배열 사용
        if (
          userData.roles &&
          Array.isArray(userData.roles) &&
          userData.roles.length > 0
        ) {
          allUserRoles = userData.roles;
          userRole = userData.roles[0]; // 첫 번째 역할을 주 역할로 설정
          console.log("🔍 JSON roles 사용:", { userRole, allUserRoles });
        } else if (userData.role) {
          // 레거시 단일 role 필드 사용
          userRole = userData.role;
          allUserRoles = [userData.role];
          console.log("🔍 레거시 단일 role 사용:", { userRole, allUserRoles });
        } else {
          // 기본값
          userRole = "member";
          allUserRoles = ["member"];
          console.log("🔍 기본값 사용:", { userRole, allUserRoles });
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
              console.log("Members 테이블에서 팀 정보 확인:", {
                userId: user.id,
                teamId: memberData.team_id,
              });

              setUserTeamId(memberData.team_id);
            } else {
              console.log("Members 테이블에서 사용자 정보를 찾을 수 없음");
            }
          } catch (teamError) {
            console.log("팀 정보 확인 중 오류:", teamError);
          }
        }

        console.log("🔍 사용자 권한 디버깅:", {
          primaryRole: userRole,
          allRoles: allUserRoles,
          allPermissions: allUserPermissions,
          userId: user.id,
          legacyRole: userData.role,
          rawUserData: userData,
          userRolesData: userData.user_roles,
          activeRoleDetails: userData.user_roles
            ?.filter((ur: any) => ur.is_active)
            .map((ur: any) => ({
              roleId: ur.role_id,
              roleName: ur.roles?.name,
              roleDisplayName: ur.roles?.display_name,
              roleLevel: ur.roles?.level,
            })),
        });
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
          // events JSON 필드에서 직접 가져오기
          setEvents(Array.isArray(data.events) ? data.events : []);

        }
      } catch (error) {
        console.error("프로그램 데이터 로드 실패:", error);
        setSelectedProgramData(null);
        setParticipants([]);
        setTeams([]);
        setEvents([]);
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

  // 특정 날짜의 이벤트 가져오기 (시간 순서대로 정렬)
  const getEventsForDay = (date: Date) => {
    return filteredEvents
      .filter((event) => {
        const eventDate = parseISO(event.start_date);
        return isSameDay(eventDate, date);
      })
      .sort((a, b) => {
        const timeA = parseISO(a.start_date);
        const timeB = parseISO(b.start_date);
        return timeA.getTime() - timeB.getTime();
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

  // 팀별 스타일 (hex 색상용) - Google Calendar 스타일
  const getTeamStyle = (teamId?: string) => {
    if (!teamId) {
      // 팀이 선택되지 않았을 때 그래파이트 색상 사용
      return {
        backgroundColor: "#616161",
        borderColor: "#616161",
        color: "#ffffff",
      };
    }

    const team = teams.find((t) => t.id === teamId);
    if (team?.color) {
      return {
        backgroundColor: team.color,
        borderColor: team.color,
        color: "#ffffff",
      };
    }

    // 팀은 있지만 색상이 없을 때도 그래파이트 색상 사용
    return {
      backgroundColor: "#616161",
      borderColor: "#616161",
      color: "#ffffff",
    };
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


  // 일정 시간대 판단 함수
  const getEventTimeStatus = (eventDate: Date, endDate?: Date | null) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );

    // 디데이 계산 (일 단위 차이)
    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
          label: "D-Day",
          color: "text-red-700",
          bgColor: "bg-red-100",
          icon: "",
        };
      }
    } else {
      // 디데이 표시
      const getDDayColor = (days: number) => {
        if (days <= 3) {
          return {
            color: "text-red-700",
            bgColor: "bg-red-100",
          };
        } else if (days <= 7) {
          return {
            color: "text-orange-700",
            bgColor: "bg-orange-100",
          };
        } else {
          return {
            color: "text-blue-700",
            bgColor: "bg-blue-100",
          };
        }
      };

      const colors = getDDayColor(diffDays);
      
      return {
        status: "upcoming",
        label: `D-${diffDays}`,
        color: colors.color,
        bgColor: colors.bgColor,
        icon: "",
      };
    }
  };

  // 권한에 따른 탭 표시 결정
  const getVisibleTabs = () => {
    const availableTabs = [
      { key: "dashboard", label: "대시보드" },
      { key: "calendar", label: "일정" },
      { key: "participants", label: "참가자" },
      { key: "attendance", label: "출석" },
      { key: "finance", label: "재정" },
      { key: "checklist", label: "확인사항" },
    ];

    // 권한은 컴포넌트 레벨에서 이미 정의됨

    console.log("🔍 탭 권한 디버깅:", {
      viewPermissions,
      managePermissions,
      userRole,
      userRoles,
      userPermissions,
      widgetSettings: widget?.settings,
      calendarViewPermissions: viewPermissions.calendar,
      userHasCalendarAccess: viewPermissions.calendar
        ? hasRolePermission(viewPermissions.calendar)
        : "no_settings",
    });

    // 권한 확인 로직 - 레이아웃 매니저의 view_permissions 기반으로 수정
    const filteredTabs = availableTabs.filter((tab) => {
      const tabViewPermissions = viewPermissions[tab.key] || [];

      console.log(`🔍 탭 '${tab.key}' 권한 확인:`, {
        tabViewPermissions,
        hasPermissionSettings: Object.keys(viewPermissions).length > 0,
        userRole,
        userRoles,
        userPermissions,
      });

      // 레이아웃 매니저의 로직과 일치시킴
      // 권한 설정이 있는 위젯의 경우
      if (Object.keys(viewPermissions).length > 0) {
        // 해당 탭에 권한이 설정되지 않았으면 접근 불가 (레이아웃 매니저와 동일)
        if (!tabViewPermissions || tabViewPermissions.length === 0) {
          console.log(`❌ 탭 '${tab.key}': 권한 설정 없음 - 접근 불가`);
          return false;
        }

        // 권한이 설정된 탭은 해당 권한 확인
        const hasAccess = hasRolePermission(tabViewPermissions);

        console.log(
          `${hasAccess ? "✅" : "❌"} 탭 '${tab.key}': 권한 확인 - 접근 ${hasAccess ? "허용" : "거부"}`,
          {
            allowedPermissions: tabViewPermissions,
            userHasPermissions: tabViewPermissions.filter((p: string) =>
              userPermissions.includes(p)
            ),
            userHasRoles: tabViewPermissions.filter(
              (r: string) => userRoles.includes(r) || userRole === r
            ),
          }
        );

        return hasAccess;
      }

      // 권한 설정이 전혀 없는 위젯은 모든 탭 표시
      console.log(
        `✅ 탭 '${tab.key}': 위젯에 권한 설정 없음 - 모든 사용자 접근 가능`
      );
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

  // 일정 추가/수정 함수
  const handleSaveEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.start_date) {
        showAlert("입력 오류", "제목과 시작 날짜는 필수입니다.");
        return;
      }

      if (newEvent.isRecurring && !newEvent.recurringEndDate) {
        showAlert("입력 오류", "반복 일정의 종료일을 설정해주세요.");
        return;
      }

      // 수정 모드인 경우
      if (isEditingEvent && editingEventData) {
        // 단일 일정을 반복으로 수정하는 경우
        if (!editingEventData.is_recurring && newEvent.isRecurring) {
          setEventToEdit(editingEventData);
          setIsRecurringEditModalOpen(true);
          return;
        }

        // 반복 일정을 수정하는 경우
        if (editingEventData.is_recurring && newEvent.isRecurring) {
          setEventToEdit(editingEventData);
          setIsRecurringEditModalOpen(true);
          return;
        }

        const updatedEvent = {
          ...editingEventData,
          title: newEvent.title,
          description: newEvent.description,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          location: newEvent.location,
          team_id: newEvent.team_id,
          is_recurring: newEvent.isRecurring,
          recurring_end_date: newEvent.isRecurring
            ? newEvent.recurringEndDate
            : undefined,
        };

        await eventsApi.update(
          editingEventData.id,
          updatedEvent,
          selectedProgram
        );

        // 이벤트 목록 업데이트
        const updatedEvents = events.map((event) =>
          event.id === editingEventData.id ? updatedEvent : event
        );
        setEvents(updatedEvents);
        setIsEditingEvent(false);
        setEditingEventData(null);
        setIsEventModalOpen(false);

        // 폼 초기화
        setNewEvent({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          location: "",
          program_id: "",
          team_id: "",
          isRecurring: false,
          recurringEndDate: "",
        });

        showAlert("수정 완료", "일정이 수정되었습니다.");
        return;
      }

      if (newEvent.isRecurring) {
        // 반복 일정 생성
        const baseStartDate = new Date(newEvent.start_date);
        const baseEndDate = newEvent.end_date
          ? new Date(newEvent.end_date)
          : null;
        const recurringEndDate = new Date(newEvent.recurringEndDate);

        // 기본 일정의 요일 계산 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        const targetDayOfWeek = baseStartDate.getDay();

        // 반복 그룹 ID 생성 (타임스탬프 + 랜덤)
        const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 시작일부터 종료일까지 해당 요일에 맞는 모든 날짜 생성
        const eventsToCreate = [];
        let currentDate = new Date(baseStartDate);

        // 종료일까지 매주 해당 요일에 일정 생성
        while (currentDate <= recurringEndDate) {
          const eventStartDate = new Date(currentDate);
          const eventEndDate = baseEndDate ? new Date(currentDate) : undefined;

          // 시작 시간 설정
          eventStartDate.setHours(
            baseStartDate.getHours(),
            baseStartDate.getMinutes(),
            baseStartDate.getSeconds()
          );

          // 종료 시간 설정 (있는 경우)
          if (eventEndDate && baseEndDate) {
            eventEndDate.setHours(
              baseEndDate.getHours(),
              baseEndDate.getMinutes(),
              baseEndDate.getSeconds()
            );
          }

          eventsToCreate.push({
            title: newEvent.title,
            description: newEvent.description || undefined,
            start_date: eventStartDate.toISOString(),
            end_date: eventEndDate ? eventEndDate.toISOString() : undefined,
            location: newEvent.location || undefined,
            program_id: selectedProgram,
            team_id: newEvent.team_id || undefined,
            recurring_group_id: recurringGroupId, // 반복 그룹 ID 추가
            is_recurring: true, // 반복 일정 표시
          });

          // 다음 주 같은 요일로 이동
          currentDate.setDate(currentDate.getDate() + 7);
        }

        console.log(
          `${eventsToCreate.length}개의 반복 일정 생성 (그룹 ID: ${recurringGroupId}):`,
          eventsToCreate
        );

        // 모든 반복 일정 생성
        for (const event of eventsToCreate) {
          await eventsApi.create(event);
        }

        showAlert(
          "추가 완료",
          `${eventsToCreate.length}개의 반복 일정이 추가되었습니다.`
        );
      } else {
        // 단일 일정 생성
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
        showAlert("추가 완료", "일정이 추가되었습니다.");
      }

      // 프로그램 데이터 새로고침하여 최신 events 가져오기
      if (selectedProgram) {
        const supabase = createClient();
        const { data } = await supabase
          .from("programs")
          .select("events")
          .eq("id", selectedProgram)
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
        isRecurring: false,
        recurringEndDate: "",
      });
    } catch (error) {
      console.error("일정 추가 실패:", error);
      console.error("에러 상세:", JSON.stringify(error, null, 2));
      showAlert(
        "추가 실패",
        `일정 추가에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    }
  };

  // 일정 삭제 함수
  const handleDeleteEvent = async (eventId: string) => {
    // 먼저 해당 일정이 반복 일정인지 확인
    const eventToCheck = events.find((event) => event.id === eventId);

    if (eventToCheck && (eventToCheck as any).recurring_group_id) {
      // 반복 일정인 경우 삭제 옵션 선택 모달 표시
      setEventToDelete(eventToCheck);
      setIsRecurringDeleteModalOpen(true);
      return;
    }

    // 일반 일정인 경우 삭제 확인 다이얼로그 표시
    setEventToDeleteConfirm(eventToCheck);
    setDeleteConfirmOpen(true);
    return;
  };

  // 반복 일정 삭제 처리 함수
  const handleRecurringEventDelete = async (
    deleteOption: "single" | "future" | "all"
  ) => {
    if (!eventToDelete) return;

    try {
      if (deleteOption === "single") {
        // 이 일정만 삭제
        const remainingEvents = events.filter(
          (event) => event.id !== eventToDelete.id
        );

        // 프로그램 업데이트
        const supabase = createClient();
        const { error } = await supabase
          .from("programs")
          .update({ events: remainingEvents })
          .eq("id", selectedProgram);

        if (error) throw error;

        setEvents(remainingEvents);
        showAlert("삭제 완료", "선택한 일정이 삭제되었습니다.");
      } else if (deleteOption === "future") {
        // 이번 및 향후 일정 삭제 - 현재 events 배열에서 필터링
        const eventDate = new Date(eventToDelete.start_date);

        // 같은 그룹의 이번 및 향후 일정들 찾기
        const futureEvents = events.filter(
          (event) =>
            (event as any).recurring_group_id ===
              (eventToDelete as any).recurring_group_id &&
            new Date(event.start_date) >= eventDate
        );

        if (futureEvents.length > 0) {
          // 삭제할 이벤트 ID들 수집
          const eventIdsToDelete = futureEvents.map((event) => event.id);

          // 남은 이벤트들만 필터링
          const remainingEvents = events.filter(
            (event) => !eventIdsToDelete.includes(event.id)
          );

          // 프로그램 업데이트
          const supabase = createClient();
          const { error } = await supabase
            .from("programs")
            .update({ events: remainingEvents })
            .eq("id", selectedProgram);

          if (error) throw error;

          setEvents(remainingEvents);
          showAlert(
            "삭제 완료",
            `${futureEvents.length}개의 향후 일정이 삭제되었습니다.`
          );
        }
      } else if (deleteOption === "all") {
        // 모든 반복 일정 삭제 - 현재 events 배열에서 필터링
        const allEvents = events.filter(
          (event) =>
            (event as any).recurring_group_id ===
            (eventToDelete as any).recurring_group_id
        );

        if (allEvents.length > 0) {
          // 삭제할 이벤트 ID들 수집
          const eventIdsToDelete = allEvents.map((event) => event.id);

          // 남은 이벤트들만 필터링
          const remainingEvents = events.filter(
            (event) => !eventIdsToDelete.includes(event.id)
          );

          // 프로그램 업데이트
          const supabase = createClient();
          const { error } = await supabase
            .from("programs")
            .update({ events: remainingEvents })
            .eq("id", selectedProgram);

          if (error) throw error;

          setEvents(remainingEvents);
          showAlert(
            "삭제 완료",
            `${allEvents.length}개의 모든 반복 일정이 삭제되었습니다.`
          );
        }
      }

      // 모달들 닫기
      setIsRecurringDeleteModalOpen(false);
      setIsEventDetailModalOpen(false);
      setSelectedEvent(null);
      setEventToDelete(null);
    } catch (error) {
      console.error("반복 일정 삭제 실패:", error);
      showAlert(
        "삭제 실패",
        `삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`
      );
    }
  };

  // 반복 일정 수정 처리
  const handleRecurringEdit = async (
    editOption: "single" | "future" | "all" | "convert"
  ) => {
    if (!eventToEdit) return;

    try {
      if (editOption === "convert") {
        // 단일 일정을 반복으로 변환
        // 기존 단일 일정 삭제
        await eventsApi.delete(eventToEdit.id, selectedProgram);

        // 새로운 반복 일정들 생성
        const baseStartDate = new Date(newEvent.start_date);
        const baseEndDate = newEvent.end_date
          ? new Date(newEvent.end_date)
          : undefined;
        const recurringEndDate = new Date(newEvent.recurringEndDate);

        // 기본 일정의 요일 계산
        const targetDayOfWeek = baseStartDate.getDay();

        // 반복 그룹 ID 생성
        const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 시작일부터 종료일까지 해당 요일에 맞는 모든 날짜 생성
        const eventsToCreate = [];
        let currentDate = new Date(baseStartDate);

        while (currentDate <= recurringEndDate) {
          const eventStartDate = new Date(currentDate);

          if (eventStartDate.getDay() === targetDayOfWeek) {
            let eventEndDate: Date | undefined = undefined;
            if (baseEndDate) {
              eventEndDate = new Date(eventStartDate);
              const duration = baseEndDate.getTime() - baseStartDate.getTime();
              eventEndDate.setTime(eventStartDate.getTime() + duration);
            }

            const eventData = {
              title: newEvent.title,
              description: newEvent.description,
              start_date: eventStartDate.toISOString(),
              end_date: eventEndDate ? eventEndDate.toISOString() : undefined,
              location: newEvent.location,
              program_id: selectedProgram || "",
              team_id: newEvent.team_id || undefined,
              is_recurring: true,
              recurring_end_date: newEvent.recurringEndDate,
              recurring_group_id: recurringGroupId,
            };

            eventsToCreate.push(eventData);
          }

          // 다음 주로 이동
          currentDate.setDate(currentDate.getDate() + 7);
        }

        // 모든 반복 일정 생성
        for (const eventData of eventsToCreate) {
          await eventsApi.create(eventData);
        }

        // 프로그램 데이터 새로고침하여 최신 events 가져오기
        if (selectedProgram) {
          const supabase = createClient();
          const { data } = await supabase
            .from("programs")
            .select("events")
            .eq("id", selectedProgram)
            .single();

          if (data) {
            const updatedEvents = Array.isArray(data.events) ? data.events : [];
            setEvents(updatedEvents);

            // 실제 저장된 이벤트 개수 확인
            const recurringEvents = updatedEvents.filter(
              (e: any) => e.is_recurring
            );
            if (recurringEvents.length === 0) {
              showAlert(
                "오류",
                "반복 일정이 저장되지 않았습니다. 다시 시도해주세요."
              );
              return;
            }
          }
        }

        showAlert(
          "변환 완료",
          `${eventsToCreate.length}개의 반복 일정이 생성되었습니다.`
        );
      } else if (editOption === "single") {
        // 이 일정만 수정
        const updatedEvent = {
          ...eventToEdit,
          title: newEvent.title,
          description: newEvent.description,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          location: newEvent.location,
          team_id: newEvent.team_id,
          is_recurring: newEvent.isRecurring,
          recurring_end_date: newEvent.isRecurring
            ? newEvent.recurringEndDate
            : undefined,
        };

        await eventsApi.update(eventToEdit.id, updatedEvent, selectedProgram);

        // 프로그램 데이터 새로고침
        if (selectedProgram) {
          const supabase = createClient();
          const { data } = await supabase
            .from("programs")
            .select("events")
            .eq("id", selectedProgram)
            .single();

          if (data) {
            setEvents(Array.isArray(data.events) ? data.events : []);
          }
        }

        showAlert("수정 완료", "선택한 일정이 수정되었습니다.");
      } else if (editOption === "future") {
        // 이번 및 향후 일정 수정
        const eventDate = new Date(eventToEdit.start_date);
        const futureEvents = events.filter(
          (event) =>
            (event as any).recurring_group_id ===
              (eventToEdit as any).recurring_group_id &&
            new Date(event.start_date) >= eventDate
        );

        for (const event of futureEvents) {
          const timeDiff =
            new Date(event.start_date).getTime() -
            new Date(eventToEdit.start_date).getTime();
          const newStartDate = new Date(
            new Date(newEvent.start_date).getTime() + timeDiff
          );

          let newEndDate = undefined;
          if (newEvent.end_date && event.end_date) {
            const originalDuration =
              new Date(
                eventToEdit.end_date || eventToEdit.start_date
              ).getTime() - new Date(eventToEdit.start_date).getTime();
            newEndDate = new Date(
              newStartDate.getTime() + originalDuration
            ).toISOString();
          }

          const updatedEvent = {
            ...event,
            title: newEvent.title,
            description: newEvent.description,
            start_date: newStartDate.toISOString(),
            end_date: newEndDate,
            location: newEvent.location,
            team_id: newEvent.team_id,
            recurring_end_date: newEvent.recurringEndDate,
          };

          await eventsApi.update(event.id, updatedEvent, selectedProgram);
        }

        // 프로그램 데이터 새로고침
        if (selectedProgram) {
          const supabase = createClient();
          const { data } = await supabase
            .from("programs")
            .select("events")
            .eq("id", selectedProgram)
            .single();

          if (data) {
            setEvents(Array.isArray(data.events) ? data.events : []);
          }
        }

        showAlert(
          "수정 완료",
          `${futureEvents.length}개의 향후 일정이 수정되었습니다.`
        );
      } else if (editOption === "all") {
        // 모든 반복 일정 수정
        const allEvents = events.filter(
          (event) =>
            (event as any).recurring_group_id ===
            (eventToEdit as any).recurring_group_id
        );

        for (const event of allEvents) {
          const timeDiff =
            new Date(event.start_date).getTime() -
            new Date(eventToEdit.start_date).getTime();
          const newStartDate = new Date(
            new Date(newEvent.start_date).getTime() + timeDiff
          );

          let newEndDate = undefined;
          if (newEvent.end_date && event.end_date) {
            const originalDuration =
              new Date(
                eventToEdit.end_date || eventToEdit.start_date
              ).getTime() - new Date(eventToEdit.start_date).getTime();
            newEndDate = new Date(
              newStartDate.getTime() + originalDuration
            ).toISOString();
          }

          const updatedEvent = {
            ...event,
            title: newEvent.title,
            description: newEvent.description,
            start_date: newStartDate.toISOString(),
            end_date: newEndDate,
            location: newEvent.location,
            team_id: newEvent.team_id,
            recurring_end_date: newEvent.recurringEndDate,
          };

          await eventsApi.update(event.id, updatedEvent, selectedProgram);
        }

        // 프로그램 데이터 새로고침
        if (selectedProgram) {
          const supabase = createClient();
          const { data } = await supabase
            .from("programs")
            .select("events")
            .eq("id", selectedProgram)
            .single();

          if (data) {
            setEvents(Array.isArray(data.events) ? data.events : []);
          }
        }

        showAlert(
          "수정 완료",
          `${allEvents.length}개의 모든 반복 일정이 수정되었습니다.`
        );
      }

      setIsRecurringEditModalOpen(false);
      setEventToEdit(null);
      setIsEditingEvent(false);
      setEditingEventData(null);
      setIsEventModalOpen(false);

      // 폼 초기화
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        location: "",
        program_id: "",
        team_id: "",
        isRecurring: false,
        recurringEndDate: "",
      });
    } catch (error) {
      console.error("반복 일정 수정 실패:", error);
      showAlert("오류", "반복 일정 수정 중 오류가 발생했습니다.");
    }
  };

  // events_settings에서 장소 로드
  const loadLocationsFromProgram = async () => {
    if (!selectedProgram) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("programs")
        .select("events_settings")
        .eq("id", selectedProgram)
        .single();

      if (error) throw error;

      const eventsSettings = data?.events_settings || {};
      setSavedLocations(eventsSettings.locations || []);
    } catch (error) {
      console.error("장소 데이터 로드 실패:", error);
    }
  };

  // 장소 추가 함수
  const addLocation = async () => {
    if (
      !newLocation.trim() ||
      !selectedProgram ||
      savedLocations.includes(newLocation.trim())
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const updatedLocations = [...savedLocations, newLocation.trim()];

      // 현재 events_settings 가져오기
      const { data: currentData, error: fetchError } = await supabase
        .from("programs")
        .select("events_settings")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = currentData?.events_settings || {};
      const updatedSettings = {
        ...currentSettings,
        locations: updatedLocations,
      };

      // events_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ events_settings: updatedSettings })
        .eq("id", selectedProgram);

      if (error) throw error;

      setSavedLocations(updatedLocations);
      setNewLocation("");
    } catch (error) {
      console.error("장소 추가 실패:", error);
      showAlert("추가 실패", "장소 추가에 실패했습니다.");
    }
  };

  // 장소 삭제 함수
  const removeLocation = async (location: string) => {
    if (!selectedProgram) return;

    try {
      const supabase = createClient();
      const updatedLocations = savedLocations.filter((loc) => loc !== location);

      // 현재 events_settings 가져오기
      const { data: currentData, error: fetchError } = await supabase
        .from("programs")
        .select("events_settings")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = currentData?.events_settings || {};
      const updatedSettings = {
        ...currentSettings,
        locations: updatedLocations,
      };

      // events_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ events_settings: updatedSettings })
        .eq("id", selectedProgram);

      if (error) throw error;

      setSavedLocations(updatedLocations);
    } catch (error) {
      console.error("장소 삭제 실패:", error);
      showAlert("삭제 실패", "장소 삭제에 실패했습니다.");
    }
  };

  // 장소 수정 시작
  const startEditLocation = (index: number, location: string) => {
    setEditingLocationIndex(index);
    setEditingLocationValue(location);
  };

  // 장소 수정 취소
  const cancelEditLocation = () => {
    setEditingLocationIndex(null);
    setEditingLocationValue("");
  };

  // 장소 수정 저장
  const saveEditLocation = async () => {
    if (
      !selectedProgram ||
      editingLocationIndex === null ||
      !editingLocationValue.trim()
    ) {
      return;
    }

    // 중복 체크 (자기 자신 제외)
    const isDuplicate = savedLocations.some(
      (loc, index) =>
        index !== editingLocationIndex && loc === editingLocationValue.trim()
    );

    if (isDuplicate) {
      showAlert("입력 오류", "이미 존재하는 장소명입니다.");
      return;
    }

    try {
      const supabase = createClient();
      const updatedLocations = [...savedLocations];
      updatedLocations[editingLocationIndex] = editingLocationValue.trim();

      // 현재 events_settings 가져오기
      const { data: currentData, error: fetchError } = await supabase
        .from("programs")
        .select("events_settings")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = currentData?.events_settings || {};
      const updatedSettings = {
        ...currentSettings,
        locations: updatedLocations,
      };

      // events_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ events_settings: updatedSettings })
        .eq("id", selectedProgram);

      if (error) throw error;

      setSavedLocations(updatedLocations);
      setEditingLocationIndex(null);
      setEditingLocationValue("");
    } catch (error) {
      console.error("장소 수정 실패:", error);
      showAlert("수정 실패", "장소 수정에 실패했습니다.");
    }
  };

  // 프로그램 변경 시 장소 데이터 로드
  useEffect(() => {
    if (selectedProgram) {
      loadLocationsFromProgram();
    }
  }, [selectedProgram]);










  // 날짜 클릭 시 해당 날짜의 모든 일정 보기
  const handleDateClick = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
    setIsDayEventsModalOpen(true);
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
    <div className="space-y-4">
      {/* 컨트롤 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 lg:px-0 lg:pt-0 pt-4 px-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            className={`grid w-full ${
              tabConfig.availableTabs.length === 1
                ? "grid-cols-1"
                : tabConfig.availableTabs.length === 2
                  ? "grid-cols-2"
                  : tabConfig.availableTabs.length === 3
                    ? "grid-cols-3"
                    : tabConfig.availableTabs.length === 4
                      ? "grid-cols-4"
                      : tabConfig.availableTabs.length === 5
                        ? "grid-cols-5"
                        : "grid-cols-6"
            }`}
          >
            {tabConfig.availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="flex items-center gap-2"
                title={tab.label} // 호버 시 툴팁으로 표시
              >
                {tab.key === "calendar" && <Calendar size={16} />}
                {tab.key === "participants" && <Users size={16} />}
                {tab.key === "attendance" && <UserCheck size={16} />}
                {tab.key === "finance" && <DollarSign size={16} />}
                {tab.key === "checklist" && <CheckCircle size={16} />}
                {tab.key === "dashboard" && <BarChart3 size={16} />}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 일정 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "calendar") && (
            <TabsContent value="calendar" className="space-y-4">
              <div className="space-y-4 px-2 sm:px-4">
                {/* 상단 컨트롤 바 */}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex items-center gap-2">
                    {/* 뷰 모드 탭 선택 */}
                    <div className="relative flex bg-gray-100 rounded-lg p-1">
                      {/* 슬라이딩 백그라운드 */}
                      <div 
                        className="absolute top-1 bottom-1 left-1 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out"
                        style={{
                          width: "calc((100% - 8px) / 3)",
                          transform: `translateX(${
                            viewMode === "list" ? "0%" : 
                            viewMode === "week" ? "100%" : 
                            "200%"
                          })`,
                        }}
                      />
                      <Button
                        onClick={() => setViewMode("list")}
                        variant="ghost"
                        size="sm"
                        className={`relative z-10 flex-1 ${viewMode === "list" ? "text-black" : "text-gray-600"} hover:text-gray-800 hover:bg-transparent`}
                      >
                        목록
                      </Button>
                      <Button
                        onClick={() => setViewMode("week")}
                        variant="ghost" 
                        size="sm"
                        className={`relative z-10 flex-1 ${viewMode === "week" ? "text-black" : "text-gray-600"} hover:text-gray-800 hover:bg-transparent`}
                      >
                        주간
                      </Button>
                      <Button
                        onClick={() => setViewMode("month")}
                        variant="ghost"
                        size="sm"
                        className={`relative z-10 flex-1 ${viewMode === "month" ? "text-black" : "text-gray-600"} hover:text-gray-800 hover:bg-transparent`}
                      >
                        월간
                      </Button>
                    </div>

                    {/* 팀별 필터 드롭다운 */}
                    <Select
                      value={selectedTeamFilter}
                      onValueChange={setSelectedTeamFilter}
                    >
                      <SelectTrigger className="w-30">
                        <SelectValue placeholder="팀 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 팀</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 구글 캘린더 드롭다운 */}
                    {filteredEvents.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <img
                            src="https://www.gstatic.com/marketing-cms/assets/images/cf/3c/0d56042f479fac9ad22d06855578/calender.webp"
                            alt="Google Calendar"
                            className="w-8 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity object-contain"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={syncEventsToGoogle}
                            disabled={isSyncing}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            구글캘린더 동기화
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={deleteConnectNextEventsFromGoogle}
                            disabled={isSyncing}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            동기화 삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* 일정 추가 버튼 - manage_permissions 기반으로 수정 */}
                  {(() => {
                    const calendarManagePermissions =
                      managePermissions.calendar || [];

                    // 관리 권한이 있는 위젯의 경우
                    if (Object.keys(managePermissions).length > 0) {
                      // 일정 관리 권한이 설정되지 않았으면 접근 불가
                      if (calendarManagePermissions.length === 0) {
                        return false;
                      }

                      const hasManageAccess = hasRolePermission(
                        calendarManagePermissions
                      );
                      return hasManageAccess;
                    }

                    // 위젯에 관리 권한 설정이 전혀 없으면 기본 관리자 권한으로 체크
                    return hasAdminPermission();
                  })() && (
                    <div className="flex items-center gap-2 justify-end sm:justify-start">
                      {/* 장소 설정 버튼 */}
                      <Dialog
                        open={isLocationSettingsOpen}
                        onOpenChange={setIsLocationSettingsOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
                          <DialogHeader>
                            <DialogTitle>장소 설정</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>새 장소 추가</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={newLocation}
                                  onChange={(e) =>
                                    setNewLocation(e.target.value)
                                  }
                                  placeholder="장소명을 입력하세요"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      addLocation();
                                    }
                                  }}
                                />
                                <Button
                                  onClick={addLocation}
                                  disabled={!newLocation.trim()}
                                >
                                  추가
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>저장된 장소</Label>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {savedLocations.length === 0 ? (
                                  <p className="text-sm text-gray-500 py-2">
                                    저장된 장소가 없습니다.
                                  </p>
                                ) : (
                                  savedLocations.map((location, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                      {editingLocationIndex === index ? (
                                        <>
                                          <Input
                                            value={editingLocationValue}
                                            onChange={(e) =>
                                              setEditingLocationValue(
                                                e.target.value
                                              )
                                            }
                                            className="text-sm flex-1 mr-2"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                saveEditLocation();
                                              } else if (e.key === "Escape") {
                                                cancelEditLocation();
                                              }
                                            }}
                                            autoFocus
                                          />
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={saveEditLocation}
                                              className="h-6 w-6 p-0 text-green-500 hover:text-green-700"
                                            >
                                              ✓
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={cancelEditLocation}
                                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                            >
                                              ×
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-sm flex-1">
                                            {location}
                                          </span>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                startEditLocation(
                                                  index,
                                                  location
                                                )
                                              }
                                              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                                            >
                                              ✏
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                removeLocation(location)
                                              }
                                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            >
                                              ×
                                            </Button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* 일정 추가 모달 */}
                      <Dialog
                        open={isEventModalOpen}
                        onOpenChange={(open) => {
                          setIsEventModalOpen(open);
                          if (open && !isEditingEvent) {
                            // 모달이 열릴 때 기본 시간 설정 (현재 시간, 1시간 후) - 추가 모드만
                            const now = new Date();
                            const oneHourLater = addHours(now, 1);
                            setNewEvent({
                              title: "",
                              description: "",
                              start_date: format(now, "yyyy-MM-dd'T'HH:mm"),
                              end_date: format(
                                oneHourLater,
                                "yyyy-MM-dd'T'HH:mm"
                              ),
                              location: "",
                              program_id: selectedProgram || "",
                              team_id: "",
                              isRecurring: false,
                              recurringEndDate: "",
                            });
                          } else if (!open) {
                            // 모달이 닫힐 때 폼 초기화
                            setNewEvent({
                              title: "",
                              description: "",
                              start_date: "",
                              end_date: "",
                              location: "",
                              program_id: "",
                              team_id: "",
                              isRecurring: false,
                              recurringEndDate: "",
                            });
                            // 수정 모드 초기화
                            setIsEditingEvent(false);
                            setEditingEventData(null);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setIsEditingEvent(false);
                              setEditingEventData(null);
                              // 폼 완전 초기화
                              setNewEvent({
                                title: "",
                                description: "",
                                start_date: "",
                                end_date: "",
                                location: "",
                                program_id: "",
                                team_id: "",
                                isRecurring: false,
                                recurringEndDate: "",
                              });
                            }}
                          >
                            일정 추가
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {isEditingEvent ? "일정 수정" : "새 일정 추가"}
                            </DialogTitle>
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
                                onChange={(e) => {
                                  const startDateTime = e.target.value;
                                  // 시작 일시가 변경되면 자동으로 종료 일시를 1시간 후로 설정
                                  let endDateTime = "";
                                  if (startDateTime) {
                                    const startDate = new Date(startDateTime);
                                    const endDate = addHours(startDate, 1);
                                    endDateTime = format(
                                      endDate,
                                      "yyyy-MM-dd'T'HH:mm"
                                    );
                                  }

                                  setNewEvent((prev) => ({
                                    ...prev,
                                    start_date: startDateTime,
                                    end_date: endDateTime,
                                  }));
                                }}
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
                              <Select
                                value={newEvent.location}
                                onValueChange={(value) => {
                                  if (value === "custom") {
                                    // Custom option selected, clear the location to show input
                                    setNewEvent((prev) => ({
                                      ...prev,
                                      location: "",
                                    }));
                                  } else {
                                    // Pre-saved location selected
                                    setNewEvent((prev) => ({
                                      ...prev,
                                      location: value,
                                    }));
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="장소를 선택하거나 직접 입력하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                  {savedLocations.map((location) => (
                                    <SelectItem key={location} value={location}>
                                      {location}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="custom">
                                    직접 입력
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Show input field when custom is selected or when location is not in saved locations */}
                              {(newEvent.location === "" ||
                                !savedLocations.includes(
                                  newEvent.location
                                )) && (
                                <Input
                                  id="location-custom"
                                  value={newEvent.location}
                                  onChange={(e) =>
                                    setNewEvent((prev) => ({
                                      ...prev,
                                      location: e.target.value,
                                    }))
                                  }
                                  placeholder="장소를 입력하세요"
                                  className="mt-2"
                                />
                              )}
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

                            {/* 반복 설정 */}
                            <div className="grid gap-3 pt-4 border-t">
                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor="recurring"
                                  className="text-sm font-medium"
                                >
                                  매주 반복
                                </Label>
                                <Switch
                                  id="recurring"
                                  checked={newEvent.isRecurring}
                                  onCheckedChange={(checked) =>
                                    setNewEvent((prev) => ({
                                      ...prev,
                                      isRecurring: checked,
                                      recurringEndDate: checked
                                        ? prev.recurringEndDate
                                        : "",
                                    }))
                                  }
                                />
                              </div>

                              {newEvent.isRecurring && (
                                <div className="grid gap-3 pl-6 space-y-2">
                                  <div className="grid gap-2">
                                    <Label htmlFor="recurring-end">
                                      반복 종료일
                                    </Label>
                                    <Input
                                      id="recurring-end"
                                      type="date"
                                      value={newEvent.recurringEndDate}
                                      onChange={(e) =>
                                        setNewEvent((prev) => ({
                                          ...prev,
                                          recurringEndDate: e.target.value,
                                        }))
                                      }
                                      min={
                                        newEvent.start_date
                                          ? new Date(newEvent.start_date)
                                              .toISOString()
                                              .split("T")[0]
                                          : new Date()
                                              .toISOString()
                                              .split("T")[0]
                                      }
                                    />
                                  </div>

                                  <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                    💡 위에 설정한 시작일부터 종료일까지 매주
                                    같은 요일, 같은 시간에 반복됩니다.
                                    <br />
                                    예: 월요일 오전 10시~오후 12시 → 매주 월요일
                                    오전 10시~오후 12시 반복
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsEventModalOpen(false)}
                            >
                              취소
                            </Button>
                            <Button onClick={handleSaveEvent}>
                              {isEditingEvent ? "수정" : "추가"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                {/* 팀 필터 */}
                {/* <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setSelectedTeamFilter("all")}
                    variant={
                      selectedTeamFilter === "all" ? "default" : "secondary"
                    }
                    size="sm"
                    className="rounded-full"
                  >
                    전체
                  </Button>
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      onClick={() => setSelectedTeamFilter(team.id)}
                      variant={
                        selectedTeamFilter === team.id ? "default" : "secondary"
                      }
                      size="sm"
                      className="rounded-full"
                    >
                      {team.name}
                    </Button>
                  ))}
                  {teams.length === 0 && (
                    <span className="text-sm text-gray-500">
                      등록된 팀이 없습니다
                    </span>
                  )}
                </div> */}

                {/* 일정 상세보기 모달 */}
                <Dialog
                  open={isEventDetailModalOpen}
                  onOpenChange={setIsEventDetailModalOpen}
                >
                  <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
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
                              {(() => {
                                const startDate = parseISO(selectedEvent.start_date);
                                return formatFullDateTimeToKorean(startDate, ko);
                              })()}
                              {selectedEvent.end_date &&
                                ` - ${formatDateTimeToKorean(parseISO(selectedEvent.end_date))}`}
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
                      {/* 삭제 버튼 - 권한 기반으로 표시 */}
                      {hasAdminPermission() && selectedEvent && (
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteEvent(selectedEvent.id)}
                        >
                          삭제
                        </Button>
                      )}
                      {/* 수정 버튼 - 권한 기반으로 표시 */}
                      {hasAdminPermission() && (
                        <Button
                          onClick={() => {
                            if (selectedEvent) {
                              setEditingEventData(selectedEvent);
                              setNewEvent({
                                title: selectedEvent.title || "",
                                description: selectedEvent.description || "",
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
                                location: selectedEvent.location || "",
                                program_id: selectedEvent.program_id || "",
                                team_id: selectedEvent.team_id || "",
                                isRecurring:
                                  selectedEvent.is_recurring || false,
                                recurringEndDate:
                                  selectedEvent.recurring_end_date || "",
                              });
                              setIsEditingEvent(true);
                              setIsEventDetailModalOpen(false);
                              setIsEventModalOpen(true);
                            }
                          }}
                        >
                          수정
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* 날짜별 일정 보기 모달 */}
                <Dialog
                  open={isDayEventsModalOpen}
                  onOpenChange={setIsDayEventsModalOpen}
                >
                  <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedDate && (
                          <>
                            {format(selectedDate, "yyyy년 M월 d일 (EEE)", {
                              locale: ko,
                            })}
                            의 일정
                          </>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {selectedDateEvents.length > 0 ? (
                        <div className="space-y-3">
                          {selectedDateEvents
                            .sort(
                              (a, b) =>
                                new Date(a.start_date).getTime() -
                                new Date(b.start_date).getTime()
                            )
                            .map((event) => {
                              const program = allPrograms.find(
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
                                    setIsDayEventsModalOpen(false);
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2 mb-2">
                                        <h3
                                          className={`font-semibold flex-1 ${timeStatus.status === "past" ? "text-gray-600" : ""}`}
                                        >
                                          {event.title}
                                        </h3>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${timeStatus.bgColor} ${timeStatus.color}`}
                                          >
                                            {timeStatus.icon} {timeStatus.label}
                                          </span>
                                          {team && (
                                            <span
                                              className="text-xs px-2 py-1 rounded border whitespace-nowrap"
                                              style={getTeamStyle(event.team_id)}
                                            >
                                              {team.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                          <Clock
                                            size={16}
                                            className="text-gray-600"
                                          />
                                          <span className="font-medium text-sm">
                                            {formatDateTimeToKorean(eventDate)}
                                            {endDate &&
                                              ` - ${formatDateTimeToKorean(endDate)}`}
                                          </span>
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center gap-1">
                                            <MapPin
                                              size={16}
                                              className="text-gray-600"
                                            />
                                            <span className="font-medium text-sm">
                                              {event.location}
                                            </span>
                                          </div>
                                        )}
                                        {event.description && (
                                          <p className="text-gray-500 text-sm mt-2">
                                            {event.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          이 날짜에는 등록된 일정이 없습니다.
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      {hasAdminPermission() && (
                        <Button
                          onClick={() => {
                            // 선택된 날짜의 현재 시간으로 설정
                            if (selectedDate) {
                              const now = new Date();
                              const selectedDateTime = new Date(selectedDate);

                              // 선택된 날짜에 현재 시간 적용
                              selectedDateTime.setHours(now.getHours());
                              selectedDateTime.setMinutes(now.getMinutes());

                              const oneHourLater = addHours(
                                selectedDateTime,
                                1
                              );

                              setNewEvent({
                                title: "",
                                description: "",
                                start_date: format(
                                  selectedDateTime,
                                  "yyyy-MM-dd'T'HH:mm"
                                ),
                                end_date: format(
                                  oneHourLater,
                                  "yyyy-MM-dd'T'HH:mm"
                                ),
                                location: "",
                                program_id: selectedProgram || "",
                                team_id: "",
                                isRecurring: false,
                                recurringEndDate: "",
                              });

                              setIsEditingEvent(false);
                              setEditingEventData(null);
                              setIsDayEventsModalOpen(false);
                              setIsEventModalOpen(true);
                            }
                          }}
                        >
                          일정 추가
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsDayEventsModalOpen(false)}
                      >
                        닫기
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
                        ? format(currentDate, "yyyy년 M월", { locale: ko })
                        : `${format(weekDays[0], "M월 d일", { locale: ko })} - ${format(weekDays[6], "M월 d일", { locale: ko })}`}
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

              <div className="px-2 pb-4">
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
                                        <div className="flex items-start gap-2 mb-2">
                                          <h3
                                            className={`font-semibold flex-1 leading-tight ${timeStatus.status === "past" ? "text-gray-600" : ""}`}
                                          >
                                            {event.title}
                                          </h3>
                                          <div className="flex gap-2 flex-shrink-0">
                                            <span
                                              className={`text-xs px-2 py-1 rounded-full font-medium ${timeStatus.bgColor} ${timeStatus.color}`}
                                            >
                                              {timeStatus.icon}{" "}
                                              {timeStatus.label}
                                            </span>
                                            {team && (
                                              <span
                                                className="text-xs px-2 py-1 rounded border font-medium"
                                                style={getTeamStyle(
                                                  event.team_id
                                                )}
                                              >
                                                {team.name}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1">
                                            <Calendar
                                              size={16}
                                              className="text-gray-600"
                                            />
                                            <span className="font-medium text-sm">
                                              {format(
                                                eventDate,
                                                "yyyy년 M월 d일 (EEE)",
                                                { locale: ko }
                                              )} {formatDateTimeToKorean(eventDate)}
                                              {endDate &&
                                                ` - ${formatDateTimeToKorean(endDate)}`}
                                            </span>
                                          </div>
                                          {event.location && (
                                            <div className="flex items-center gap-1">
                                              <MapPin
                                                size={16}
                                                className="text-gray-600"
                                              />
                                              <span className="font-medium text-sm">
                                                {event.location}
                                              </span>
                                            </div>
                                          )}
                                          {event.description && (
                                            <p className="text-gray-500 text-sm mt-2">
                                              {event.description}
                                            </p>
                                          )}
                                        </div>
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
                      <div className="p-1 text-center text-xs font-medium text-gray-500 border-r">
                      </div>
                      {weekDays.map((day, index) => (
                        <div
                          key={day.toISOString()}
                          className={`p-2 text-center border-l ${
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
                          <div className="text-sm font-medium">
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
                            height: "70px",
                            gridTemplateColumns: "60px repeat(7, 1fr)",
                          }}
                        >
                          <div className="text-xs text-gray-500 border-r border-b-0 flex items-center justify-center relative bg-white" style={{ height: "70px" }}>
                            <div className="absolute" style={{ top: "-10px" }}>
                              {hour === 0 ? "" : formatHourToKorean(hour)}
                            </div>
                          </div>
                          {weekDays.map((day, dayIndex) => (
                            <div 
                              key={dayIndex} 
                              className="border-l cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleDateClick(day)}
                            ></div>
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

                          // 겹침 처리: 중간 시작 이벤트는 양쪽을 모두 겹치게
                          const overlappingEvents = dayEvents.filter((e) => {
                            const eStartTime = parseISO(e.start_date);
                            const eEndTime = e.end_date ? parseISO(e.end_date) : new Date(eStartTime.getTime() + 60 * 60 * 1000);
                            
                            // 시간이 겹치는지 확인
                            return startTime < eEndTime && endTime > eStartTime;
                          });

                          let eventWidth, eventLeft, zIndex;
                          const dayWidth = `calc((100% - 60px) / 7)`; // 각 날짜 컬럼의 폭

                          if (overlappingEvents.length > 2) {
                            // 3개 이상 겹칠 때만 분할 처리
                            const sortedEvents = overlappingEvents.sort((a, b) => 
                              parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
                            );

                            const currentEventIndex = sortedEvents.findIndex(e => e.id === event.id);
                            
                            if (currentEventIndex === 0) {
                              // 첫 번째 이벤트 - 왼쪽 절반
                              eventWidth = `calc((${dayWidth} / 2) - 4px)`;
                              eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                              zIndex = 10;
                            } else if (currentEventIndex === 1) {
                              // 두 번째 이벤트 - 오른쪽 절반
                              eventWidth = `calc((${dayWidth} / 2) - 4px)`;
                              eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + (${dayWidth} / 2) + 2px)`;
                              zIndex = 10;
                            } else {
                              // 중간에 시작하는 이벤트들 - 전체 너비에서 왼쪽 여백만 주고 양쪽 겹치게
                              eventWidth = `calc(${dayWidth} - 8px)`; // 왼쪽 여백 4px
                              eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 6px)`;
                              zIndex = 20; // 위에 보이게
                            }
                          } else if (overlappingEvents.length === 2) {
                            // 2개만 겹칠 때 - 중간에 끼어드는 스타일로 처리
                            const sortedEvents = overlappingEvents.sort((a, b) => 
                              parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
                            );

                            const currentEventIndex = sortedEvents.findIndex(e => e.id === event.id);
                            
                            if (currentEventIndex === 0) {
                              // 첫 번째 이벤트 - 전체 너비
                              eventWidth = `calc(${dayWidth} - 4px)`;
                              eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                              zIndex = 10;
                            } else {
                              // 두 번째 이벤트 - 중간에 끼어드는 스타일
                              eventWidth = `calc(${dayWidth} - 8px)`; // 왼쪽 여백 4px
                              eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 6px)`;
                              zIndex = 20; // 위에 보이게
                            }
                          } else {
                            // 겹치지 않는 이벤트
                            eventWidth = `calc(${dayWidth} - 4px)`;
                            eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                            zIndex = 10;
                          }

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
                                top: `${startHour * 70 + (startMinute / 60) * 70 + 2}px`,
                                width: eventWidth,
                                height: `${Math.max(duration * 70 - 4, 26)}px`,
                                fontSize: "10px",
                                zIndex: zIndex,
                                border: zIndex === 20 ? '1px solid white' : undefined, // 중간 끼어드는 이벤트에 흰색 보더
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
                                overlappingEvents.length === 1 &&
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
                            className={`min-h-[80px] p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                              !isCurrentMonth ? "bg-gray-50 opacity-50" : ""
                            } ${isToday ? "bg-blue-50" : ""}`}
                            onClick={() => handleDateClick(day)}
                            title={
                              dayEvents.length > 0
                                ? `${format(day, "yyyy년 M월 d일", { locale: ko })}\n${dayEvents.length}개의 일정:\n${dayEvents.map((e) => `• ${e.title}`).join("\n")}`
                                : `${format(day, "yyyy년 M월 d일", { locale: ko })}\n등록된 일정이 없습니다.`
                            }
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
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-gray-500 h-6 px-2 py-1 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDateClick(day);
                                  }}
                                >
                                  +{dayEvents.length - 2} 더보기
                                </Button>
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
          {tabConfig.availableTabs.some(
            (tab) => tab.key === "participants"
          ) && (
            <TabsContent value="participants" className="p-0">
              <ParticipantsTab 
                programId={selectedProgram || ""} 
                hasEditPermission={(() => {
                  const participantsManagePermissions =
                    managePermissions.participants || [];

                  console.log("🔍 참가자 편집권한 디버그:", {
                    managePermissions,
                    participantsManagePermissions,
                    userRole,
                    userRoles,
                    userPermissions,
                    hasManagePermissionsSet:
                      Object.keys(managePermissions).length > 0,
                  });

                  // 관리 권한이 있는 위젯의 경우
                  if (Object.keys(managePermissions).length > 0) {
                    // 참가자 관리 권한이 설정되지 않았으면 접근 불가
                    if (participantsManagePermissions.length === 0) {
                      console.log("❌ 참가자 편집권한이 설정되지 않음");
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

                  console.log("🔍 재정 편집권한 디버그:", {
                    managePermissions,
                    financeManagePermissions,
                    userRole,
                    userRoles,
                    userPermissions,
                    hasManagePermissionsSet:
                      Object.keys(managePermissions).length > 0,
                  });

                  // 관리 권한이 있는 위젯의 경우
                  if (Object.keys(managePermissions).length > 0) {
                    // 재정 관리 권한이 설정되지 않았으면 접근 불가
                    if (financeManagePermissions.length === 0) {
                      console.log("❌ 재정 편집권한이 설정되지 않음");
                      return false;
                    }

                    const result = hasRolePermission(financeManagePermissions);
                    console.log(
                      `${result ? "✅" : "❌"} 재정 편집권한 결과:`,
                      result
                    );
                    return result;
                  }

                  // 위젯에 관리 권한 설정이 전혀 없으면 기본 관리자 권한으로 체크
                  const adminResult = hasAdminPermission();
                  console.log("🔍 기본 관리자 권한 결과:", adminResult);
                  return adminResult;
                })()}
              />
            </TabsContent>
          )}

          {/* 확인사항 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "checklist") && (
            <TabsContent value="checklist" className="p-4">
              {/* <div className="space-y-6"> */}
              {allPrograms.map((program) => (
                // <Card key={program.id}>
                <ChecklistTab
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
                // </Card>
              ))}
              {allPrograms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle
                    size={48}
                    className="mx-auto mb-4 text-gray-300"
                  />
                  <p>등록된 프로그램이 없습니다.</p>
                </div>
              )}
              {/* </div> */}
            </TabsContent>
          )}

          {/* 대시보드 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "dashboard") && (
            <TabsContent value="dashboard" className="p-4">
              <DashboardTab 
                programId={selectedProgram || ""} 
                onNavigateToTab={setActiveTab}
              />
            </TabsContent>
          )}

        </Tabs>
      </Card>



      {/* 구글 캘린더 동기화 로딩 모달 */}
      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl min-w-[250px]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium text-center">
              구글 캘린더 작업 중...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              잠시만 기다려주세요
            </p>
          </div>
        </div>
      )}


      {/* 반복 일정 삭제 옵션 다이얼로그 */}
      <AlertDialog
        open={isRecurringDeleteModalOpen}
        onOpenChange={setIsRecurringDeleteModalOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>반복 일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 일정은 반복 일정입니다. 삭제 범위를 선택해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleRecurringEventDelete("single");
                  setIsRecurringDeleteModalOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">이 일정만 삭제</div>
                  <div className="text-sm text-muted-foreground">
                    선택한 일정만 삭제합니다
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleRecurringEventDelete("future");
                  setIsRecurringDeleteModalOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">이번 및 향후 일정 삭제</div>
                  <div className="text-sm text-muted-foreground">
                    이번 일정부터 이후 모든 반복 일정을 삭제합니다
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => {
                  handleRecurringEventDelete("all");
                  setIsRecurringDeleteModalOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">모든 반복 일정 삭제</div>
                  <div className="text-sm text-muted-foreground">
                    이 반복 일정 시리즈의 모든 일정을 삭제합니다
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsRecurringDeleteModalOpen(false)}
            >
              취소
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 반복 일정 수정 옵션 모달 */}
      <AlertDialog
        open={isRecurringEditModalOpen}
        onOpenChange={setIsRecurringEditModalOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {eventToEdit && !eventToEdit.is_recurring
                ? "단일 일정을 반복으로 변환"
                : "반복 일정 수정"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {eventToEdit && !eventToEdit.is_recurring
                ? "이 단일 일정을 반복 일정으로 변환하시겠습니까?"
                : "반복 일정을 어떻게 수정하시겠습니까?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              {eventToEdit && !eventToEdit.is_recurring ? (
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    handleRecurringEdit("convert");
                    setIsRecurringEditModalOpen(false);
                  }}
                >
                  <div>
                    <div className="font-medium">반복 일정으로 변환</div>
                    <div className="text-sm text-muted-foreground">
                      현재 일정을 삭제하고 새로운 반복 일정들을 생성합니다
                    </div>
                  </div>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      handleRecurringEdit("single");
                      setIsRecurringEditModalOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">이 일정만 수정</div>
                      <div className="text-sm text-muted-foreground">
                        선택한 일정만 수정합니다
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      handleRecurringEdit("future");
                      setIsRecurringEditModalOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">이번 및 향후 일정 수정</div>
                      <div className="text-sm text-muted-foreground">
                        현재 일정부터 미래의 모든 반복 일정을 수정합니다
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                    onClick={() => {
                      handleRecurringEdit("all");
                      setIsRecurringEditModalOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">모든 반복 일정 수정</div>
                      <div className="text-sm text-muted-foreground">
                        이 반복 일정 시리즈의 모든 일정을 수정합니다
                      </div>
                    </div>
                  </Button>
                </>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsRecurringEditModalOpen(false)}
            >
              취소
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* 일정 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
