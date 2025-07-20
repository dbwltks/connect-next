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
  DollarSign,
  Eye,
  Plus,
  Trash2,
  Edit,
  Settings,
  CheckCircle,
  Filter,
} from "lucide-react";
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
import ChecklistTab from "@/app/(auth-pages)/admin/programs/[id]/components/checklist-tab";
import FinanceTab from "@/app/(auth-pages)/admin/programs/[id]/components/finance-tab";
import {
  eventsApi,
  financeApi,
  type Event,
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
  vendor?: string;
  itemName?: string;
  amount: number;
  paidBy?: string;
  description?: string;
  date?: string;
  datetime?: string;
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
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");
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

  // 디버깅용 로그
  console.log("ProgramsWidget - props.programs:", programs);
  console.log("ProgramsWidget - allPrograms:", allPrograms);

  // props 변경 시 상태 업데이트
  useEffect(() => {
    setAllPrograms(programs);
  }, [programs]);
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

  // 관리자 권한 확인 함수 (admin, tier0, tier1만 설정/추가/수정/삭제 가능)
  const hasAdminPermission = () => {
    return userRole === "admin" || userRole === "tier0" || userRole === "tier1";
  };

  // 게스트 포함 읽기 권한 확인 함수 (guest 포함 모든 사용자가 볼 수 있음)
  const hasViewPermission = () => {
    return (
      userRole === "admin" ||
      userRole === "tier0" ||
      userRole === "tier1" ||
      userRole === "tier2" ||
      userRole === "tier3" ||
      userRole === "guest"
    );
  };

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

  // 재정 삭제 확인 후 실행
  const confirmDeleteFinance = async () => {
    if (!financeToDeleteConfirm || !selectedProgram) return;

    try {
      await financeApi.delete(financeToDeleteConfirm);
      const updatedFinances = finances.filter(
        (f) => f.id !== financeToDeleteConfirm
      );
      setFinances(updatedFinances);
      showAlert("삭제 완료", "재정 거래가 삭제되었습니다.");
    } catch (error) {
      console.error("재정 삭제 실패:", error);
      showAlert("삭제 실패", "재정 삭제에 실패했습니다.");
    } finally {
      setFinanceDeleteConfirmOpen(false);
      setFinanceToDeleteConfirm(null);
    }
  };

  // 장소 관리 상태
  const [isLocationSettingsOpen, setIsLocationSettingsOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  // 필터 모달 상태
  const [isFinanceFilterModalOpen, setIsFinanceFilterModalOpen] =
    useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<
    number | null
  >(null);
  const [editingLocationValue, setEditingLocationValue] = useState("");
  // 날짜별 일정 보기 모달 상태
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);

  // 재정 추가 모달 상태
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

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

  // 재정 삭제 확인 다이얼로그 상태
  const [financeDeleteConfirmOpen, setFinanceDeleteConfirmOpen] =
    useState(false);
  const [financeToDeleteConfirm, setFinanceToDeleteConfirm] = useState<
    string | null
  >(null);
  const [newFinance, setNewFinance] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    vendor: "",
    itemName: "",
    amount: "",
    paidBy: "",
    description: "",
    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // 재정 카테고리 관리 상태
  const [isFinanceCategorySettingsOpen, setIsFinanceCategorySettingsOpen] =
    useState(false);
  const [financeCategories, setFinanceCategories] = useState<string[]>([
    "교육비",
    "식비",
    "교통비",
    "숙박비",
    "후원금",
    "참가비",
    "기타",
  ]);
  const [newFinanceCategory, setNewFinanceCategory] = useState("");
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<
    number | null
  >(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");

  // 거래처 관리 상태
  const [financeVendors, setFinanceVendors] = useState<string[]>([
    "직접 구매",
    "온라인 주문",
    "현지 업체",
    "협력 업체",
  ]);
  const [newFinanceVendor, setNewFinanceVendor] = useState("");
  const [editingVendorIndex, setEditingVendorIndex] = useState<number | null>(
    null
  );
  const [editingVendorValue, setEditingVendorValue] = useState("");

  // 재정 수정 상태
  const [editingFinance, setEditingFinance] = useState<string | null>(null);
  const [editFinanceData, setEditFinanceData] = useState({
    type: "expense" as "income" | "expense",
    category: "",
    vendor: "",
    itemName: "",
    amount: "",
    paidBy: "",
    description: "",
    date: "",
  });

  // 재정 필터 상태
  const [financeFilters, setFinanceFilters] = useState({
    dateRange: "all" as "all" | "today" | "week" | "month" | "custom",
    customDateType: "single" as "single" | "range",
    selectedDate: undefined as Date | undefined,
    selectedDateRange: undefined as
      | { from: Date | undefined; to: Date | undefined }
      | undefined,
    startDate: "",
    endDate: "",
    type: "all" as "all" | "income" | "expense",
    category: "all",
    vendor: "all",
    paidBy: "all",
  });

  // 캘린더 팝오버 상태
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 활성 필터 개수 계산
  const getActiveFiltersCount = () => {
    let count = 0;
    if (financeFilters.dateRange !== "all") count++;
    if (financeFilters.type !== "all") count++;
    if (financeFilters.category !== "all") count++;
    if (financeFilters.vendor !== "all") count++;
    if (financeFilters.paidBy !== "all") count++;
    return count;
  };

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 선택된 재정 행 상태
  const [selectedFinanceId, setSelectedFinanceId] = useState<string | null>(
    null
  );
  const [isFinanceActionDialogOpen, setIsFinanceActionDialogOpen] =
    useState(false);
  const [selectedFinanceForAction, setSelectedFinanceForAction] =
    useState<any>(null);

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
          console.log(
            "사용자 데이터를 찾을 수 없습니다. 관리자 권한으로 설정합니다."
          );
          setUserRole("admin");
          return;
        }

        // 역할 설정 (기본값: member)
        const userRole = userData.role || "member";
        setUserRole(userRole);

        // members 테이블에서 사용자의 팀 역할 확인
        if (selectedProgram) {
          try {
            // members 테이블에서 현재 사용자의 팀 정보 조회
            const { data: memberData } = await supabase
              .from("members")
              .select("team_role, team_id, team_tier")
              .eq("user_id", user.id)
              .single();

            if (memberData) {
              console.log("Members 테이블에서 팀 역할 찾음:", {
                userId: user.id,
                teamRole: memberData.team_role,
                teamId: memberData.team_id,
                teamTier: memberData.team_tier,
              });

              // team_tier가 있으면 tier 권한으로 설정
              if (
                memberData.team_tier !== null &&
                memberData.team_tier !== undefined
              ) {
                const tierRole = `tier${memberData.team_tier}`;
                setUserRole(tierRole);
                setUserTeamId(memberData.team_id);
                console.log("Tier 권한 설정:", tierRole);
              }
            } else {
              console.log("Members 테이블에서 사용자 정보를 찾을 수 없음");
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
            ? allTeams.filter((team: any) =>
                widget?.settings?.selected_teams?.includes(team.id)
              )
            : allTeams;

          setTeams(filteredTeams);
          // events JSON 필드에서 직접 가져오기
          setEvents(Array.isArray(data.events) ? data.events : []);

          // 재정 데이터 programs 테이블의 finances 필드에서 로드
          setFinances(Array.isArray(data.finances) ? data.finances : []);

          // finance_settings에서 카테고리와 거래처 로드
          const financeSettings = data.finance_settings || {};
          if (Array.isArray(financeSettings.categories)) {
            setFinanceCategories(financeSettings.categories);
          }
          if (Array.isArray(financeSettings.vendors)) {
            setFinanceVendors(financeSettings.vendors);
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

  // 재정 필터링
  const filteredFinances = finances.filter((finance) => {
    // 날짜 필터
    if (financeFilters.dateRange !== "all") {
      if (!finance.datetime && !finance.date) return true;
      const dateStr = finance.datetime || finance.date;
      if (!dateStr) return true;
      const financeDate = parseISO(dateStr);
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      switch (financeFilters.dateRange) {
        case "today":
          const todayEnd = new Date(
            todayStart.getTime() + 24 * 60 * 60 * 1000 - 1
          );
          if (financeDate < todayStart || financeDate > todayEnd) return false;
          break;
        case "week":
          const weekStart = startOfWeek(today, { weekStartsOn: 0 });
          const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
          if (financeDate < weekStart || financeDate > weekEnd) return false;
          break;
        case "month":
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          if (financeDate < monthStart || financeDate > monthEnd) return false;
          break;
        case "custom":
          if (
            financeFilters.customDateType === "single" &&
            financeFilters.selectedDate
          ) {
            const selectedDay = new Date(
              financeFilters.selectedDate.getFullYear(),
              financeFilters.selectedDate.getMonth(),
              financeFilters.selectedDate.getDate()
            );
            const financeDay = new Date(
              financeDate.getFullYear(),
              financeDate.getMonth(),
              financeDate.getDate()
            );
            if (financeDay.getTime() !== selectedDay.getTime()) return false;
          } else if (
            financeFilters.customDateType === "range" &&
            financeFilters.selectedDateRange?.from &&
            financeFilters.selectedDateRange?.to
          ) {
            const rangeStart = financeFilters.selectedDateRange.from;
            const rangeEnd = financeFilters.selectedDateRange.to;
            if (financeDate < rangeStart || financeDate > rangeEnd)
              return false;
          } else if (financeFilters.startDate && financeFilters.endDate) {
            // 백업: 기존 문자열 날짜 사용
            try {
              const customStart = parseISO(financeFilters.startDate);
              const customEnd = parseISO(financeFilters.endDate);
              if (financeDate < customStart || financeDate > customEnd)
                return false;
            } catch (error) {
              console.warn("날짜 파싱 오류:", error);
              return true;
            }
          }
          break;
      }
    }

    // 타입 필터
    if (financeFilters.type !== "all" && finance.type !== financeFilters.type) {
      return false;
    }

    // 카테고리 필터
    if (
      financeFilters.category !== "all" &&
      finance.category !== financeFilters.category
    ) {
      return false;
    }

    // 거래처 필터
    if (
      financeFilters.vendor !== "all" &&
      finance.vendor !== financeFilters.vendor
    ) {
      return false;
    }

    // 거래자 필터
    if (
      financeFilters.paidBy !== "all" &&
      finance.paidBy !== financeFilters.paidBy
    ) {
      return false;
    }

    return true;
  });

  // 페이지네이션된 재정 데이터
  const totalItems = filteredFinances.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFinances = filteredFinances
    .sort((a, b) => {
      // datetime으로 정렬 (기존 데이터 호환성을 위해 date도 체크)
      const aDateTime = new Date(a.datetime || a.date || 0);
      const bDateTime = new Date(b.datetime || b.date || 0);
      return bDateTime.getTime() - aDateTime.getTime();
    })
    .slice(startIndex, endIndex);

  // 필터 변경 시 페이지 리셋
  const resetPageAndSetFilter = (filterUpdate: any) => {
    setCurrentPage(1);
    setFinanceFilters((prev) => ({ ...prev, ...filterUpdate }));
  };

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
      { key: "checklist", label: "확인사항" },
      { key: "overview", label: "개요" },
    ];

    const tabPermissions = widget?.settings?.tab_permissions || {};

    // 권한 확인 로직 - 모든 탭이 권한 설정에 영향을 받음
    const filteredTabs = availableTabs.filter((tab) => {
      const tabPermission = tabPermissions[tab.key];

      // 권한 설정이 있는 경우 해당 권한 확인
      if (Object.keys(tabPermissions).length > 0) {
        // 권한 설정이 없는 탭은 접근 불가
        if (!tabPermission) {
          return false;
        }
        // 권한 설정이 있는 탭은 사용자 역할이 포함되어야 접근 가능
        // guest가 포함되어 있으면 누구나 볼 수 있음
        return (
          tabPermission.includes(userRole) || tabPermission.includes("guest")
        );
      }

      // 전체 권한 설정이 없는 경우 게스트 이상 모든 사용자가 접근 가능
      return hasViewPermission();
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
  }, [userRole, tabConfig, activeTab]);

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
          recurring_end_date: newEvent.isRecurring ? newEvent.recurringEndDate : undefined,
        };

        await eventsApi.update(editingEventData.id, updatedEvent, selectedProgram);

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
        const baseEndDate = newEvent.end_date ? new Date(newEvent.end_date) : undefined;
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
            const recurringEvents = updatedEvents.filter((e: any) => e.is_recurring);
            if (recurringEvents.length === 0) {
              showAlert("오류", "반복 일정이 저장되지 않았습니다. 다시 시도해주세요.");
              return;
            }
          }
        }

        showAlert("변환 완료", `${eventsToCreate.length}개의 반복 일정이 생성되었습니다.`);
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
          recurring_end_date: newEvent.isRecurring ? newEvent.recurringEndDate : undefined,
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
            (event as any).recurring_group_id === (eventToEdit as any).recurring_group_id &&
            new Date(event.start_date) >= eventDate
        );

        for (const event of futureEvents) {
          const timeDiff = new Date(event.start_date).getTime() - new Date(eventToEdit.start_date).getTime();
          const newStartDate = new Date(new Date(newEvent.start_date).getTime() + timeDiff);
          
          let newEndDate = undefined;
          if (newEvent.end_date && event.end_date) {
            const originalDuration = new Date(eventToEdit.end_date || eventToEdit.start_date).getTime() - new Date(eventToEdit.start_date).getTime();
            newEndDate = new Date(newStartDate.getTime() + originalDuration).toISOString();
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

        showAlert("수정 완료", `${futureEvents.length}개의 향후 일정이 수정되었습니다.`);
      } else if (editOption === "all") {
        // 모든 반복 일정 수정
        const allEvents = events.filter(
          (event) =>
            (event as any).recurring_group_id === (eventToEdit as any).recurring_group_id
        );

        for (const event of allEvents) {
          const timeDiff = new Date(event.start_date).getTime() - new Date(eventToEdit.start_date).getTime();
          const newStartDate = new Date(new Date(newEvent.start_date).getTime() + timeDiff);
          
          let newEndDate = undefined;
          if (newEvent.end_date && event.end_date) {
            const originalDuration = new Date(eventToEdit.end_date || eventToEdit.start_date).getTime() - new Date(eventToEdit.start_date).getTime();
            newEndDate = new Date(newStartDate.getTime() + originalDuration).toISOString();
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

        showAlert("수정 완료", `${allEvents.length}개의 모든 반복 일정이 수정되었습니다.`);
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

  // 재정 데이터 추가 함수
  const handleAddFinance = async () => {
    if (!selectedProgram || !newFinance.amount || !newFinance.category) {
      showAlert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const supabase = createClient();

      // 현재 프로그램의 재정 데이터 가져오기
      const { data: programData, error: fetchError } = await supabase
        .from("programs")
        .select("finances")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentFinances = Array.isArray(programData?.finances)
        ? programData.finances
        : [];

      let updatedFinances;

      if (editingFinance) {
        // 수정 모드
        updatedFinances = currentFinances.map((finance: any) => {
          if (finance.id === editingFinance) {
            return {
              ...finance,
              type: newFinance.type,
              category: newFinance.category,
              vendor: newFinance.vendor,
              itemName: newFinance.itemName,
              amount: parseFloat(newFinance.amount),
              paidBy: newFinance.paidBy,
              description: newFinance.description,
              datetime: newFinance.datetime,
              updated_at: new Date().toISOString(),
            };
          }
          return finance;
        });
      } else {
        // 추가 모드
        const newFinanceRecord = {
          id: `finance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: newFinance.type,
          category: newFinance.category,
          vendor: newFinance.vendor,
          itemName: newFinance.itemName,
          amount: parseFloat(newFinance.amount),
          paidBy: newFinance.paidBy,
          description: newFinance.description,
          datetime: newFinance.datetime,
          created_at: new Date().toISOString(),
        };
        updatedFinances = [...currentFinances, newFinanceRecord];
      }

      // programs 테이블의 finances 필드 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ finances: updatedFinances })
        .eq("id", selectedProgram);

      if (error) throw error;

      // 로컬 상태 업데이트
      setFinances(updatedFinances);

      const isEdit = !!editingFinance;

      // 폼 초기화
      setNewFinance({
        type: "expense",
        category: "",
        vendor: "",
        itemName: "",
        amount: "",
        paidBy: "",
        description: "",
        datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
      setEditingFinance(null);

      setIsFinanceModalOpen(false);
      showAlert(
        isEdit ? "수정 완료" : "추가 완료",
        isEdit
          ? "재정 데이터가 수정되었습니다."
          : "재정 데이터가 추가되었습니다."
      );
    } catch (error) {
      console.error("재정 처리 실패:", error);
      showAlert("처리 실패", "재정 처리에 실패했습니다.");
    }
  };

  // finance_settings 업데이트 함수
  const updateFinanceSettings = async (updates: any) => {
    if (!selectedProgram) return;

    try {
      const supabase = createClient();

      // 현재 finance_settings 가져오기
      const { data: currentData, error: fetchError } = await supabase
        .from("programs")
        .select("finance_settings")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = currentData?.finance_settings || {};
      const updatedSettings = {
        ...currentSettings,
        ...updates,
      };

      // finance_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ finance_settings: updatedSettings })
        .eq("id", selectedProgram);

      if (error) throw error;
    } catch (error) {
      console.error("Finance settings 업데이트 실패:", error);
      throw error;
    }
  };

  // 재정 카테고리 추가
  const addFinanceCategory = async () => {
    if (
      !newFinanceCategory.trim() ||
      financeCategories.includes(newFinanceCategory.trim())
    ) {
      return;
    }

    try {
      const updatedCategories = [
        ...financeCategories,
        newFinanceCategory.trim(),
      ];

      // finance_settings 업데이트
      await updateFinanceSettings({ categories: updatedCategories });

      setFinanceCategories(updatedCategories);
      setNewFinanceCategory("");
    } catch (error) {
      console.error("카테고리 추가 실패:", error);
      showAlert("추가 실패", "카테고리 추가에 실패했습니다.");
    }
  };

  // 재정 카테고리 삭제
  const removeFinanceCategory = async (category: string) => {
    if (financeCategories.length <= 1) {
      showAlert("삭제 불가", "최소 하나의 카테고리는 필요합니다.");
      return;
    }

    try {
      const updatedCategories = financeCategories.filter(
        (cat) => cat !== category
      );
      await updateFinanceSettings({ categories: updatedCategories });
      setFinanceCategories(updatedCategories);
    } catch (error) {
      console.error("카테고리 삭제 실패:", error);
      showAlert("삭제 실패", "카테고리 삭제에 실패했습니다.");
    }
  };

  // 카테고리 수정 시작
  const startEditCategory = (index: number, category: string) => {
    setEditingCategoryIndex(index);
    setEditingCategoryValue(category);
  };

  // 카테고리 수정 취소
  const cancelEditCategory = () => {
    setEditingCategoryIndex(null);
    setEditingCategoryValue("");
  };

  // 카테고리 수정 저장
  const saveEditCategory = async () => {
    if (editingCategoryIndex === null || !editingCategoryValue.trim()) {
      return;
    }

    // 중복 체크 (자기 자신 제외)
    const isDuplicate = financeCategories.some(
      (cat, index) =>
        index !== editingCategoryIndex && cat === editingCategoryValue.trim()
    );

    if (isDuplicate) {
      showAlert("입력 오류", "이미 존재하는 카테고리명입니다.");
      return;
    }

    try {
      const updatedCategories = [...financeCategories];
      updatedCategories[editingCategoryIndex] = editingCategoryValue.trim();

      await updateFinanceSettings({ categories: updatedCategories });

      setFinanceCategories(updatedCategories);
      setEditingCategoryIndex(null);
      setEditingCategoryValue("");
    } catch (error) {
      console.error("카테고리 수정 실패:", error);
      showAlert("수정 실패", "카테고리 수정에 실패했습니다.");
    }
  };

  // 거래처 추가
  const addFinanceVendor = async () => {
    if (
      !newFinanceVendor.trim() ||
      financeVendors.includes(newFinanceVendor.trim())
    ) {
      return;
    }

    try {
      const updatedVendors = [...financeVendors, newFinanceVendor.trim()];
      await updateFinanceSettings({ vendors: updatedVendors });
      setFinanceVendors(updatedVendors);
      setNewFinanceVendor("");
    } catch (error) {
      console.error("거래처 추가 실패:", error);
      showAlert("추가 실패", "거래처 추가에 실패했습니다.");
    }
  };

  // 재정 삭제 함수
  const handleDeleteFinance = async (financeId: string) => {
    if (!selectedProgram) {
      return;
    }

    // 삭제 확인 다이얼로그 표시
    setFinanceToDeleteConfirm(financeId);
    setFinanceDeleteConfirmOpen(true);
    return;
  };

  // 재정 수정 시작
  const handleEditFinance = (finance: any) => {
    setEditingFinance(finance.id);
    setNewFinance({
      type: finance.type,
      category: finance.category,
      vendor: finance.vendor || "",
      itemName: finance.itemName || "",
      amount: finance.amount.toString(),
      paidBy: finance.paidBy || "",
      description: finance.description || "",
      datetime: finance.datetime || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    });
    setIsFinanceModalOpen(true);
  };

  // 재정 수정 취소
  const handleCancelEditFinance = () => {
    setEditingFinance(null);
    setSelectedFinanceId(null);
    setEditFinanceData({
      type: "expense",
      category: "",
      vendor: "",
      itemName: "",
      amount: "",
      paidBy: "",
      description: "",
      date: "",
    });
  };

  // 재정 행 클릭 핸들러
  const handleFinanceRowClick = (finance: any) => {
    if (hasAdminPermission()) {
      setSelectedFinanceForAction(finance);
      setIsFinanceActionDialogOpen(true);
    }
  };

  // 재정 수정 저장
  const handleSaveEditFinance = async () => {
    if (
      !selectedProgram ||
      !editingFinance ||
      !editFinanceData.amount ||
      !editFinanceData.category
    ) {
      showAlert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const supabase = createClient();

      // 현재 프로그램의 재정 데이터 가져오기
      const { data: programData, error: fetchError } = await supabase
        .from("programs")
        .select("finances")
        .eq("id", selectedProgram)
        .single();

      if (fetchError) throw fetchError;

      const currentFinances = Array.isArray(programData?.finances)
        ? programData.finances
        : [];

      const updatedFinances = currentFinances.map((finance: any) => {
        if (finance.id === editingFinance) {
          return {
            ...finance,
            type: editFinanceData.type,
            category: editFinanceData.category,
            vendor: editFinanceData.vendor,
            itemName: editFinanceData.itemName,
            amount: parseFloat(editFinanceData.amount),
            paidBy: editFinanceData.paidBy,
            description: editFinanceData.description,
            date: editFinanceData.date,
            updated_at: new Date().toISOString(),
          };
        }
        return finance;
      });

      // programs 테이블의 finances 필드 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ finances: updatedFinances })
        .eq("id", selectedProgram);

      if (error) throw error;

      // 로컬 상태 업데이트
      setFinances(updatedFinances);

      // 수정 모드 종료
      handleCancelEditFinance();

      showAlert("수정 완료", "재정 데이터가 수정되었습니다.");
    } catch (error) {
      console.error("재정 수정 실패:", error);
      showAlert("수정 실패", "재정 수정에 실패했습니다.");
    }
  };

  // 거래처 삭제
  const removeFinanceVendor = async (vendor: string) => {
    if (financeVendors.length <= 1) {
      showAlert("삭제 불가", "최소 하나의 거래처는 필요합니다.");
      return;
    }

    try {
      const updatedVendors = financeVendors.filter((v) => v !== vendor);
      await updateFinanceSettings({ vendors: updatedVendors });
      setFinanceVendors(updatedVendors);
    } catch (error) {
      console.error("거래처 삭제 실패:", error);
      showAlert("삭제 실패", "거래처 삭제에 실패했습니다.");
    }
  };

  // 거래처 수정 시작
  const startEditVendor = (index: number, vendor: string) => {
    setEditingVendorIndex(index);
    setEditingVendorValue(vendor);
  };

  // 거래처 수정 취소
  const cancelEditVendor = () => {
    setEditingVendorIndex(null);
    setEditingVendorValue("");
  };

  // 거래처 수정 저장
  const saveEditVendor = async () => {
    if (editingVendorIndex === null || !editingVendorValue.trim()) {
      return;
    }

    // 중복 체크 (자기 자신 제외)
    const isDuplicate = financeVendors.some(
      (vendor, index) =>
        index !== editingVendorIndex && vendor === editingVendorValue.trim()
    );

    if (isDuplicate) {
      showAlert("입력 오류", "이미 존재하는 거래처명입니다.");
      return;
    }

    try {
      const updatedVendors = [...financeVendors];
      updatedVendors[editingVendorIndex] = editingVendorValue.trim();
      await updateFinanceSettings({ vendors: updatedVendors });
      setFinanceVendors(updatedVendors);
      setEditingVendorIndex(null);
      setEditingVendorValue("");
    } catch (error) {
      console.error("거래처 수정 실패:", error);
      showAlert("수정 실패", "거래처 수정에 실패했습니다.");
    }
  };

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
                {tab.key === "checklist" && <CheckCircle size={16} />}
                {tab.key === "overview" && <Eye size={16} />}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 일정 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "calendar") && (
            <TabsContent value="calendar" className="space-y-4">
              <div className="space-y-4 px-2 sm:px-4">
                {/* 상단 컨트롤 바 */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {/* 뷰 모드 탭 선택 */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <Button
                        onClick={() => setViewMode("list")}
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                      >
                        목록
                      </Button>
                      <Button
                        onClick={() => setViewMode("week")}
                        variant={viewMode === "week" ? "default" : "ghost"}
                        size="sm"
                      >
                        주간
                      </Button>
                      <Button
                        onClick={() => setViewMode("month")}
                        variant={viewMode === "month" ? "default" : "ghost"}
                        size="sm"
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
                  </div>

                  {/* 일정 추가 버튼 - 탭별 권한 설정 확인 */}
                  {(() => {
                    const tabPermissions =
                      widget?.settings?.tab_permissions || {};
                    const calendarPermission = tabPermissions.calendar;

                    // 일정 탭 권한이 없거나 사용자가 접근 가능한 경우 버튼 표시
                    if (
                      !calendarPermission ||
                      calendarPermission.includes(userRole)
                    ) {
                      // 추가로 관리자나 고위 tier만 일정 추가 가능하도록 제한
                      return hasAdminPermission();
                    }

                    return false;
                  })() && (
                    <div className="flex gap-2">
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
                                    예: 월요일 10:00~12:00 → 매주 월요일
                                    10:00~12:00 반복
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
                                isRecurring: selectedEvent.is_recurring || false,
                                recurringEndDate: selectedEvent.recurring_end_date || "",
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
                            {format(selectedDate, "yyyy년 MM월 dd일 (EEE)", {
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
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3
                                          className={`font-semibold ${timeStatus.status === "past" ? "text-gray-600" : ""}`}
                                        >
                                          {event.title}
                                        </h3>
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full font-medium ${timeStatus.bgColor} ${timeStatus.color}`}
                                        >
                                          {timeStatus.icon} {timeStatus.label}
                                        </span>
                                        {team && (
                                          <span
                                            className="text-xs px-2 py-1 rounded border"
                                            style={getTeamStyle(event.team_id)}
                                          >
                                            {team.name}
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                          <Clock
                                            size={16}
                                            className="text-gray-600"
                                          />
                                          <span className="font-medium text-sm">
                                            {format(eventDate, "HH:mm")}
                                            {endDate &&
                                              ` - ${format(endDate, "HH:mm")}`}
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
                                        <div className="flex items-center gap-2 mb-2">
                                          <h3
                                            className={`font-semibold ${timeStatus.status === "past" ? "text-gray-600" : ""}`}
                                          >
                                            {event.title}
                                          </h3>
                                          <span
                                            className={`text-xs px-2 py-1 rounded-full font-medium ${timeStatus.bgColor} ${timeStatus.color}`}
                                          >
                                            {timeStatus.icon} {timeStatus.label}
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
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-1">
                                            <Calendar
                                              size={16}
                                              className="text-gray-600"
                                            />
                                            <span className="font-medium text-sm">
                                              {format(
                                                eventDate,
                                                "yyyy년 MM월 dd일 (EEE)",
                                                { locale: ko }
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock
                                              size={16}
                                              className="text-gray-600"
                                            />
                                            <span className="font-medium text-sm">
                                              {format(eventDate, "HH:mm")}
                                              {endDate &&
                                                ` - ${format(endDate, "HH:mm")}`}
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
                      style={{ gridTemplateColumns: "50px repeat(7, 1fr)" }}
                    >
                      <div className="p-1 text-center text-xs font-medium text-gray-500 border-r">
                        시간
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
                            height: "50px",
                            gridTemplateColumns: "50px repeat(7, 1fr)",
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
                          const eventIndexInOverlap = sameTimeEvents.findIndex(
                            (e) => e.id === event.id
                          );

                          // 시간 컬럼 50px 이후 계산 (calc 사용)
                          const dayWidth = `calc((100% - 50px) / 7)`; // 각 날짜 컬럼의 폭
                          const eventWidth =
                            totalOverlapping > 1
                              ? `calc(${dayWidth} / ${totalOverlapping})`
                              : dayWidth;
                          const eventLeft = `calc(50px + ${dayIndex} * ${dayWidth} + ${eventIndexInOverlap} * ${eventWidth})`;

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
                                top: `${startHour * 50 + (startMinute / 60) * 50}px`,
                                width: eventWidth,
                                height: `${Math.max(duration * 50, 30)}px`,
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
                                ? `${format(day, "yyyy년 MM월 dd일", { locale: ko })}\n${dayEvents.length}개의 일정:\n${dayEvents.map((e) => `• ${e.title}`).join("\n")}`
                                : `${format(day, "yyyy년 MM월 dd일", { locale: ko })}\n등록된 일정이 없습니다.`
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
                            <h4 className="font-medium">{participant.name}</h4>
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
          {tabConfig.availableTabs.some((tab) => tab.key === "finance") && (
            <TabsContent value="finance" className="p-0">
              <FinanceTab programId={selectedProgram || ""} />
            </TabsContent>
          )}

          {/* 확인사항 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "checklist") && (
            <TabsContent value="checklist" className="p-4">
              {/* <div className="space-y-6"> */}
              {allPrograms.map((program) => (
                // <Card key={program.id}>
                <ChecklistTab programId={selectedProgram || ""} />
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

          {/* 개요 탭 */}
          {tabConfig.availableTabs.some((tab) => tab.key === "overview") && (
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
                              <h4 className="font-semibold">{program.name}</h4>
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
                                  ${programBalance.toLocaleString()} CAD
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
                  <h3 className="text-lg font-semibold mb-3">다가오는 일정</h3>
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

      {/* 재정 추가 모달 */}
      <Dialog
        open={isFinanceModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingFinance(null);
          }
          setIsFinanceModalOpen(open);
        }}
      >
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFinance ? "거래 수정" : "거래 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="finance-type">거래 유형 *</Label>
              <Select
                value={newFinance.type}
                onValueChange={(value: "income" | "expense") =>
                  setNewFinance((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">수입</SelectItem>
                  <SelectItem value="expense">지출</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-category">카테고리 *</Label>
              <Select
                value={newFinance.category}
                onValueChange={(value) =>
                  setNewFinance((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {financeCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-vendor">거래처</Label>
              <Select
                value={newFinance.vendor}
                onValueChange={(value) =>
                  setNewFinance((prev) => ({ ...prev, vendor: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래처를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {financeVendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-itemName">품명</Label>
              <Input
                id="finance-itemName"
                value={newFinance.itemName}
                onChange={(e) =>
                  setNewFinance((prev) => ({
                    ...prev,
                    itemName: e.target.value,
                  }))
                }
                placeholder="품명을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-amount">금액 *</Label>
              <Input
                id="finance-amount"
                type="number"
                value={newFinance.amount}
                onChange={(e) =>
                  setNewFinance((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="금액을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-paidBy">거래자(결제자)</Label>
              <Input
                id="finance-paidBy"
                value={newFinance.paidBy}
                onChange={(e) =>
                  setNewFinance((prev) => ({ ...prev, paidBy: e.target.value }))
                }
                placeholder="결제한 사람을 입력하세요"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-description">설명</Label>
              <Textarea
                id="finance-description"
                value={newFinance.description}
                onChange={(e) =>
                  setNewFinance((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="거래 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance-datetime">날짜 및 시간 *</Label>
              <Input
                id="finance-datetime"
                type="datetime-local"
                value={newFinance.datetime}
                onChange={(e) =>
                  setNewFinance((prev) => ({
                    ...prev,
                    datetime: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsFinanceModalOpen(false);
                setEditingFinance(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddFinance}>
              {editingFinance ? "수정" : "추가"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 재정 카테고리 및 거래처 설정 모달 */}
      <Dialog
        open={isFinanceCategorySettingsOpen}
        onOpenChange={setIsFinanceCategorySettingsOpen}
      >
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle>재정 설정</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">카테고리</TabsTrigger>
              <TabsTrigger value="vendors">거래처</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFinanceCategory}
                    onChange={(e) => setNewFinanceCategory(e.target.value)}
                    placeholder="카테고리명을 입력하세요"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addFinanceCategory();
                      }
                    }}
                  />
                  <Button
                    onClick={addFinanceCategory}
                    disabled={!newFinanceCategory.trim()}
                  >
                    추가
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>기존 카테고리</Label>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {financeCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      등록된 카테고리가 없습니다.
                    </p>
                  ) : (
                    financeCategories.map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        {editingCategoryIndex === index ? (
                          <div className="flex gap-2 flex-1">
                            <Input
                              value={editingCategoryValue}
                              onChange={(e) =>
                                setEditingCategoryValue(e.target.value)
                              }
                              className="text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveEditCategory();
                                } else if (e.key === "Escape") {
                                  setEditingCategoryIndex(null);
                                  setEditingCategoryValue("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEditCategory}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategoryIndex(null);
                                setEditingCategoryValue("");
                              }}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm">{category}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategoryIndex(index);
                                  setEditingCategoryValue(category);
                                }}
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                              >
                                ✎
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFinanceCategory(category)}
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
            </TabsContent>

            <TabsContent value="vendors" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFinanceVendor}
                    onChange={(e) => setNewFinanceVendor(e.target.value)}
                    placeholder="거래처명을 입력하세요"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addFinanceVendor();
                      }
                    }}
                  />
                  <Button
                    onClick={addFinanceVendor}
                    disabled={!newFinanceVendor.trim()}
                  >
                    추가
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>기존 거래처</Label>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {financeVendors.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      등록된 거래처가 없습니다.
                    </p>
                  ) : (
                    financeVendors.map((vendor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        {editingVendorIndex === index ? (
                          <div className="flex gap-2 flex-1">
                            <Input
                              value={editingVendorValue}
                              onChange={(e) =>
                                setEditingVendorValue(e.target.value)
                              }
                              className="text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveEditVendor();
                                } else if (e.key === "Escape") {
                                  setEditingVendorIndex(null);
                                  setEditingVendorValue("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEditVendor}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingVendorIndex(null);
                                setEditingVendorValue("");
                              }}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm">{vendor}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingVendorIndex(index);
                                  setEditingVendorValue(vendor);
                                }}
                                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                              >
                                ✎
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFinanceVendor(vendor)}
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsFinanceCategorySettingsOpen(false)}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 재정 수정/삭제 액션 다이얼로그 */}
      <AlertDialog
        open={isFinanceActionDialogOpen}
        onOpenChange={setIsFinanceActionDialogOpen}
      >
        <AlertDialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>거래 내역 관리</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 거래 내역을 수정하거나 삭제할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedFinanceForAction && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">날짜:</span>
                    <span className="ml-2 font-medium">
                      {(() => {
                        try {
                          if (selectedFinanceForAction.datetime) {
                            return format(
                              parseISO(selectedFinanceForAction.datetime),
                              "yyyy년 MM월 dd일 HH:mm"
                            );
                          } else if (selectedFinanceForAction.date) {
                            return format(
                              parseISO(selectedFinanceForAction.date),
                              "yyyy년 MM월 dd일"
                            );
                          } else {
                            return "-";
                          }
                        } catch (error) {
                          console.warn("날짜 포맷 오류:", error);
                          return "-";
                        }
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">구분:</span>
                    <Badge
                      className={`ml-2 ${selectedFinanceForAction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {selectedFinanceForAction.type === "income"
                        ? "수입"
                        : "지출"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">카테고리:</span>
                    <span className="ml-2 font-medium">
                      {selectedFinanceForAction.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">거래처:</span>
                    <span className="ml-2 font-medium">
                      {selectedFinanceForAction.vendor || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">품명:</span>
                    <span className="ml-2 font-medium">
                      {selectedFinanceForAction.itemName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">거래자:</span>
                    <span className="ml-2 font-medium">
                      {selectedFinanceForAction.paidBy || "-"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">내용:</span>
                    <span className="ml-2 font-medium">
                      {selectedFinanceForAction.description}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">금액:</span>
                    <span
                      className={`ml-2 font-bold text-lg ${selectedFinanceForAction.type === "income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {selectedFinanceForAction.type === "income" ? "+" : "-"}$
                      {selectedFinanceForAction.amount.toLocaleString()} CAD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsFinanceActionDialogOpen(false)}
            >
              닫기
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                handleEditFinance(selectedFinanceForAction);
                setIsFinanceActionDialogOpen(false);
              }}
            >
              수정
            </Button>
            <AlertDialogAction
              onClick={() => {
                setIsFinanceActionDialogOpen(false);
                handleDeleteFinance(selectedFinanceForAction.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {eventToEdit && !eventToEdit.is_recurring ? "단일 일정을 반복으로 변환" : "반복 일정 수정"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {eventToEdit && !eventToEdit.is_recurring 
                ? "이 단일 일정을 반복 일정으로 변환하시겠습니까?"
                : "반복 일정을 어떻게 수정하시겠습니까?"
              }
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

      {/* 재정 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={financeDeleteConfirmOpen}
        onOpenChange={setFinanceDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래 내역 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 거래 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFinance}
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
