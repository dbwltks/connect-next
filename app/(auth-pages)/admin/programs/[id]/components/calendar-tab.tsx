"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  Settings,
  Filter,
} from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";
import Picker from "react-mobile-picker";
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
import { createClient } from "@/utils/supabase/client";
import { type Event, type Team } from "../utils/api";
import {
  formatHourToKorean,
  formatDateTimeToKorean,
  formatFullDateTimeToKorean,
} from "@/lib/time-format";
import {
  initializeGoogleAPI,
  authenticateUser,
  syncMultipleEvents,
  deleteAllConnectNextEvents,
} from "@/utils/google-calendar-api";

interface CalendarTabProps {
  programId: string;
  hasEditPermission?: boolean;
}

export default function CalendarTab({
  programId,
  hasEditPermission = false,
}: CalendarTabProps) {
  // 기본 상태
  const [viewMode, setViewMode] = useState<"list" | "week" | "month">("list");
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // 모달 상태
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailModalOpen, setIsEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isRecurringDeleteModalOpen, setIsRecurringDeleteModalOpen] =
    useState(false);
  const [isRecurringEditModalOpen, setIsRecurringEditModalOpen] =
    useState(false);
  const [isLocationSettingsOpen, setIsLocationSettingsOpen] = useState(false);

  // 이벤트 관련 상태
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editingEventData, setEditingEventData] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [eventToDeleteConfirm, setEventToDeleteConfirm] = useState<any>(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Event[]>([]);

  // Google Calendar API 관련 상태
  const [isGoogleAPIInitialized, setIsGoogleAPIInitialized] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 사용자 권한은 props로 전달받음

  // 새 이벤트 상태
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

  // 필터 및 네비게이션 상태
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  // 장소 관련 상태
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [editingLocationIndex, setEditingLocationIndex] = useState<
    number | null
  >(null);
  const [editingLocationValue, setEditingLocationValue] = useState("");

  // 모바일 날짜/시간 선택 상태
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"start" | "end">(
    "start"
  );
  const [tempDate, setTempDate] = useState(new Date());

  // react-mobile-picker 상태
  const [pickerValue, setPickerValue] = useState({
    ampm: "오전",
    hour: "1-1", // hour-cycle 형식
    minute: "00",
  });

  // 시간 변경 핸들러 (아이폰/구글 캘린더 스타일)
  const handlePickerChange = (newValue: typeof pickerValue) => {
    // 시간이 변경되었을 때 12→1 또는 1→12 경계에서 오전/오후 자동 변경
    if (newValue.hour !== pickerValue.hour) {
      const prevHourData = pickerValue.hour.split("-");
      const newHourData = newValue.hour.split("-");

      const prevHour = parseInt(prevHourData[0]);
      const newHour = parseInt(newHourData[0]);
      const prevCycle = parseInt(prevHourData[1]);
      const newCycle = parseInt(newHourData[1]);

      // 사이클이 변경되었을 때 (12시간 주기를 넘어갔을 때) 오전/오후 토글
      if (prevCycle !== newCycle) {
        // 다음 사이클로 넘어갔을 때 (12 → 1)
        if (newCycle > prevCycle) {
          newValue.ampm = newValue.ampm === "오전" ? "오후" : "오전";
        }
        // 이전 사이클로 돌아갔을 때 (1 → 12)
        else if (newCycle < prevCycle) {
          newValue.ampm = newValue.ampm === "오전" ? "오후" : "오전";
        }
      }
    }

    setPickerValue(newValue);
  };

  // 삭제 확인 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Alert 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // 프로그램 데이터 로드
  useEffect(() => {
    const loadProgramData = async () => {
      if (!programId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .eq("id", programId)
          .single();

        if (error) {
          console.error("프로그램 데이터 로드 오류:", error);
          setLoading(false);
          return;
        }

        if (data) {
          // teams 데이터 처리 - 프로그램 위젯과 동일하게
          const allTeams = Array.isArray(data.teams) ? data.teams : [];
          setTeams(allTeams);

          // events 데이터 처리
          setEvents(Array.isArray(data.events) ? data.events : []);

          // 장소 데이터 처리
          const eventSettings = data.events_settings || {};
          setSavedLocations(
            Array.isArray(eventSettings.locations)
              ? eventSettings.locations
              : []
          );
        }
      } catch (error) {
        console.error("프로그램 데이터 로드 실패:", error);
        setTeams([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadProgramData();
  }, [programId]);

  // 유틸리티 함수들
  const getTeamStyle = (teamId?: string) => {
    if (!teamId)
      return {
        backgroundColor: "#616161",
        borderColor: "#616161",
        color: "#ffffff",
      };
    const team = teams.find((t) => t.id === teamId);
    if (team?.color)
      return {
        backgroundColor: team.color,
        borderColor: team.color,
        color: "#ffffff",
      };
    return {
      backgroundColor: "#6b7280",
      borderColor: "#6b7280",
      color: "#ffffff",
    };
  };

  const getTeamColorClass = (teamId?: string) => {
    if (!teamId) return "bg-gray-500 text-white";
    const team = teams.find((t) => t.id === teamId);
    if (team?.color) return `bg-[${team.color}] text-white`;
    return "bg-gray-500 text-white";
  };

  const getEventTimeStatus = (eventDate: Date, endDate?: Date | null) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );
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
      const getDDayColor = (days: number) => {
        if (days <= 3) return { color: "text-red-700", bgColor: "bg-red-100" };
        else if (days <= 7)
          return { color: "text-orange-700", bgColor: "bg-orange-100" };
        else return { color: "text-blue-700", bgColor: "bg-blue-100" };
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

  // 주간/월간 뷰를 위한 날짜 계산
  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
  });

  const monthDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
  });

  // 날짜별 이벤트 필터링 함수
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

  // 날짜 네비게이션 함수
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
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    setSelectedDate(date);
    setSelectedDateEvents(dayEvents);
    setIsDayEventsModalOpen(true);
  };

  // 팀 필터에 따른 데이터 필터링
  const filteredEvents = (() => {
    let baseEvents = events;
    if (selectedTeamFilter !== "all") {
      baseEvents = baseEvents.filter(
        (event) => event.team_id === selectedTeamFilter
      );
    }

    // 디버깅: 이벤트 상태 확인
    console.log("📅 Calendar Tab Debug:", {
      totalEvents: events.length,
      filteredEvents: baseEvents.length,
      selectedTeamFilter,
      teams: teams.length,
      eventsWithStatus: baseEvents.map((event) => {
        const eventDate = parseISO(event.start_date);
        const endDate = event.end_date ? parseISO(event.end_date) : null;
        const timeStatus = getEventTimeStatus(eventDate, endDate);
        return {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          status: timeStatus.status,
          label: timeStatus.label,
          team_id: event.team_id,
        };
      }),
    });

    return baseEvents;
  })();

  // newEvent 초기화 함수
  const initializeNewEvent = (startDate?: string, endDate?: string) => {
    return {
      title: "",
      description: "",
      start_date: startDate || "",
      end_date: endDate || "",
      location: "",
      program_id: programId || "",
      team_id: "",
      isRecurring: false,
      recurringEndDate: "",
    };
  };

  // Alert 다이얼로그 표시 함수
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

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

    // 팀에 Google Calendar 색상 ID가 설정되어 있으면 사용
    if (team?.google_calendar_color_id) {
      return team.google_calendar_color_id;
    }

    // 기존 hex 색상을 Google Calendar 색상으로 매핑
    if (team?.color) {
      const colorMap: { [key: string]: string } = {
        "#3B82F6": "9", // 블루
        "#10B981": "11", // 초록색
        "#F59E0B": "5", // 노란색
        "#EF4444": "11", // 빨간색
        "#8B5CF6": "1", // 보라색
        "#06B6D4": "7", // 하늘색
        "#F97316": "6", // 주황색
        "#EC4899": "4", // 핑크색
      };

      return colorMap[team.color] || "9"; // 기본값 블루베리
    }

    // 팀 정보가 없으면 기본 블루베리 색상
    return "9";
  };

  // 관리자 권한 확인 함수 - props 기반으로 간소화
  const hasAdminPermission = () => {
    return hasEditPermission;
  };

  // 장소 관리 함수들
  const addLocation = async () => {
    if (!newLocation.trim()) return;

    try {
      const supabase = createClient();
      const updatedLocations = [...savedLocations, newLocation.trim()];

      // programs 테이블의 events_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({
          events_settings: {
            locations: updatedLocations,
          },
        })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      setSavedLocations(updatedLocations);
      setNewLocation("");
    } catch (error) {
      console.error("장소 추가 실패:", error);
      showAlert("오류", "장소 추가에 실패했습니다.");
    }
  };

  const removeLocation = async (location: string) => {
    try {
      const supabase = createClient();
      const updatedLocations = savedLocations.filter((loc) => loc !== location);

      // programs 테이블의 events_settings 업데이트
      const { error } = await supabase
        .from("programs")
        .update({
          events_settings: {
            locations: updatedLocations,
          },
        })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      setSavedLocations(updatedLocations);
    } catch (error) {
      console.error("장소 삭제 실패:", error);
      showAlert("오류", "장소 삭제에 실패했습니다.");
    }
  };

  const startEditLocation = (index: number, location: string) => {
    setEditingLocationIndex(index);
    setEditingLocationValue(location);
  };

  const saveEditLocation = async () => {
    if (editingLocationIndex !== null && editingLocationValue.trim()) {
      try {
        const supabase = createClient();
        const updatedLocations = [...savedLocations];
        updatedLocations[editingLocationIndex] = editingLocationValue.trim();

        // programs 테이블의 events_settings 업데이트
        const { error } = await supabase
          .from("programs")
          .update({
            events_settings: {
              locations: updatedLocations,
            },
          })
          .eq("id", programId);

        if (error) {
          throw error;
        }

        setSavedLocations(updatedLocations);
        setEditingLocationIndex(null);
        setEditingLocationValue("");
      } catch (error) {
        console.error("장소 수정 실패:", error);
        showAlert("오류", "장소 수정에 실패했습니다.");
      }
    }
  };

  const cancelEditLocation = () => {
    setEditingLocationIndex(null);
    setEditingLocationValue("");
  };

  // 모바일 날짜 선택 핸들러
  const openDatePicker = (mode: "start" | "end") => {
    setDatePickerMode(mode);
    const currentDate =
      mode === "start"
        ? newEvent.start_date
          ? new Date(newEvent.start_date)
          : new Date()
        : newEvent.end_date
          ? new Date(newEvent.end_date)
          : new Date();
    setTempDate(currentDate);
    setIsDatePickerOpen(true);
  };

  const confirmDateSelection = () => {
    const dateStr = format(tempDate, "yyyy-MM-dd");

    if (datePickerMode === "start") {
      const time = newEvent.start_date
        ? newEvent.start_date.split("T")[1] || "09:00"
        : "09:00";
      const startDateTime = `${dateStr}T${time}`;

      let endDateTime = "";
      if (startDateTime) {
        const startDate = new Date(startDateTime);
        const endDate = addHours(startDate, 1);
        endDateTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      }

      setNewEvent((prev) => ({
        ...prev,
        start_date: startDateTime,
        end_date: endDateTime,
      }));
    } else {
      const time = newEvent.end_date
        ? newEvent.end_date.split("T")[1] || "10:00"
        : "10:00";
      const endDateTime = `${dateStr}T${time}`;

      setNewEvent((prev) => ({
        ...prev,
        end_date: endDateTime,
      }));
    }

    setIsDatePickerOpen(false);
  };

  // 모바일 시간 선택 핸들러
  const openTimePicker = (mode: "start" | "end") => {
    setDatePickerMode(mode);
    const currentDate =
      mode === "start"
        ? newEvent.start_date
          ? new Date(newEvent.start_date)
          : new Date()
        : newEvent.end_date
          ? new Date(newEvent.end_date)
          : new Date();
    setTempDate(currentDate);

    // picker 값 초기화 (12시간 형식)
    const hours24 = currentDate.getHours();
    const ampm = hours24 < 12 ? "오전" : "오후";
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

    setPickerValue({
      ampm: ampm,
      hour: `${hours12}-1`, // 중간 사이클(1)로 시작
      minute: currentDate.getMinutes().toString().padStart(2, "0"),
    });

    setIsTimePickerOpen(true);
  };

  const confirmTimeSelection = () => {
    // 12시간 형식을 24시간 형식으로 변환
    const hourData = pickerValue.hour.split("-");
    let hour24 = parseInt(hourData[0]);
    if (pickerValue.ampm === "오후" && hour24 !== 12) {
      hour24 += 12;
    } else if (pickerValue.ampm === "오전" && hour24 === 12) {
      hour24 = 0;
    }

    const timeStr = `${hour24.toString().padStart(2, "0")}:${pickerValue.minute}`;

    if (datePickerMode === "start") {
      const date = newEvent.start_date
        ? newEvent.start_date.split("T")[0]
        : format(new Date(), "yyyy-MM-dd");
      const startDateTime = `${date}T${timeStr}`;

      let endDateTime = "";
      if (startDateTime) {
        const startDate = new Date(startDateTime);
        const endDate = addHours(startDate, 1);
        endDateTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      }

      setNewEvent((prev) => ({
        ...prev,
        start_date: startDateTime,
        end_date: endDateTime,
      }));
    } else {
      const date = newEvent.end_date
        ? newEvent.end_date.split("T")[0]
        : format(new Date(), "yyyy-MM-dd");
      const endDateTime = `${date}T${timeStr}`;

      setNewEvent((prev) => ({
        ...prev,
        end_date: endDateTime,
      }));
    }

    setIsTimePickerOpen(false);
  };

  // Google Calendar 스마트 동기화 (생성/업데이트)
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
        colorId: getGoogleCalendarColorId(event.team_id || ""), // 팀 기반 색상
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

  // Connect Next 이벤트만 삭제
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

        // programs 테이블의 events 배열에서 직접 업데이트
        const supabase = createClient();
        const currentEvents = [...events];
        const eventIndex = currentEvents.findIndex(
          (e) => e.id === editingEventData.id
        );
        if (eventIndex !== -1) {
          currentEvents[eventIndex] = updatedEvent;

          const { error } = await supabase
            .from("programs")
            .update({ events: currentEvents })
            .eq("id", programId);

          if (error) {
            throw error;
          }
        }

        // 이벤트 목록 업데이트
        const updatedEvents = events.map((event) =>
          event.id === editingEventData.id ? updatedEvent : event
        );
        setEvents(updatedEvents);
        setIsEditingEvent(false);
        setEditingEventData(null);
        setIsEventModalOpen(false);

        // 폼 초기화
        setNewEvent(initializeNewEvent());
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

        // 반복 그룹 ID 생성
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
            program_id: programId,
            team_id: newEvent.team_id || undefined,
            recurring_group_id: recurringGroupId,
            is_recurring: true,
          });

          // 다음 주 같은 요일로 이동
          currentDate.setDate(currentDate.getDate() + 7);
        }

        // programs 테이블의 events 배열에 반복 일정들 추가
        const supabase = createClient();
        const currentEvents = [...events];

        // 새 이벤트들에 ID 추가
        const eventsWithIds = eventsToCreate.map((event) => ({
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));

        const updatedEvents = [...currentEvents, ...eventsWithIds];

        const { error } = await supabase
          .from("programs")
          .update({ events: updatedEvents })
          .eq("id", programId);

        if (error) {
          throw error;
        }

        // 로컬 상태 업데이트
        setEvents(updatedEvents);

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
          program_id: programId,
          team_id: newEvent.team_id || undefined,
        };

        // programs 테이블의 events 배열에 단일 일정 추가
        const supabase = createClient();
        const currentEvents = [...events];

        const eventWithId = {
          ...eventToCreate,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        const updatedEvents = [...currentEvents, eventWithId];

        const { error } = await supabase
          .from("programs")
          .update({ events: updatedEvents })
          .eq("id", programId);

        if (error) {
          throw error;
        }

        // 로컬 상태 업데이트
        setEvents(updatedEvents);

        showAlert("추가 완료", "일정이 추가되었습니다.");
      }

      // 모달 닫기 및 폼 초기화
      setIsEventModalOpen(false);
      setNewEvent(initializeNewEvent());
    } catch (error) {
      console.error("일정 추가 실패:", error);
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
          .eq("id", programId);

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
            .eq("id", programId);

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
            .eq("id", programId);

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

  // 일반 일정 삭제 확인
  const confirmDeleteEvent = async () => {
    if (!eventToDeleteConfirm) return;

    try {
      // programs 테이블의 events 배열에서 이벤트 삭제
      const supabase = createClient();
      const updatedEvents = events.filter(
        (event) => event.id !== eventToDeleteConfirm.id
      );

      const { error } = await supabase
        .from("programs")
        .update({ events: updatedEvents })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      // 로컬 상태에서 삭제된 이벤트 제거
      setEvents(updatedEvents);

      // 상세 모달이 열려있다면 닫기
      setIsEventDetailModalOpen(false);
      setSelectedEvent(null);
      setDeleteConfirmOpen(false);
      setEventToDeleteConfirm(null);

      showAlert("삭제 완료", "일정이 삭제되었습니다.");
    } catch (error) {
      console.error("이벤트 삭제 실패:", error);
      showAlert("삭제 실패", "일정 삭제에 실패했습니다.");
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

  const programs = []; // 현재 컨텍스트에서는 빈 배열로 설정

  return (
    <div>
      <div>
        <div className="space-y-2 pb-4 px-2 sm:px-4">
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
                      viewMode === "list"
                        ? "0%"
                        : viewMode === "week"
                          ? "100%"
                          : "200%"
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

              {/* 구글 캘린더 메뉴 - 모바일은 Drawer, 데스크톱은 DropdownMenu */}
              {filteredEvents.length > 0 && (
                <>
                  {isMobile ? (
                    <Drawer>
                      <DrawerTrigger asChild>
                        <img
                          src="https://www.gstatic.com/marketing-cms/assets/images/cf/3c/0d56042f479fac9ad22d06855578/calender.webp"
                          alt="Google Calendar"
                          className="w-8 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity object-contain"
                        />
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>Google Calendar 동기화</DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 space-y-2">
                          <Button
                            onClick={syncEventsToGoogle}
                            disabled={isSyncing}
                            variant="ghost"
                            className="w-full justify-start"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            구글캘린더 동기화
                          </Button>
                          <Button
                            onClick={deleteConnectNextEventsFromGoogle}
                            disabled={isSyncing}
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            동기화 삭제
                          </Button>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  ) : (
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
                </>
              )}
            </div>

            {/* 일정 추가 버튼 */}
            <div className="flex items-center gap-2 justify-end sm:justify-start">
              {/* 장소 설정 버튼 */}
              {hasAdminPermission() &&
                (isMobile ? (
                  <Drawer
                    open={isLocationSettingsOpen}
                    onOpenChange={setIsLocationSettingsOpen}
                  >
                    <DrawerTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings size={16} />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>장소 설정</DrawerTitle>
                      </DrawerHeader>
                      <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>새 장소 추가</Label>
                            <div className="flex gap-2">
                              <Input
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
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
                                              startEditLocation(index, location)
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
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
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
                              onChange={(e) => setNewLocation(e.target.value)}
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
                                            startEditLocation(index, location)
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
                ))}

              {/* 일정 추가 모달 */}
              {hasAdminPermission() &&
                (isMobile ? (
                  <Drawer
                    open={isEventModalOpen}
                    onOpenChange={(open) => {
                      setIsEventModalOpen(open);
                      if (open && !isEditingEvent) {
                        const now = new Date();
                        const oneHourLater = addHours(now, 1);
                        setNewEvent(
                          initializeNewEvent(
                            format(now, "yyyy-MM-dd'T'HH:mm"),
                            format(oneHourLater, "yyyy-MM-dd'T'HH:mm")
                          )
                        );
                      } else if (!open) {
                        setNewEvent(initializeNewEvent());
                        setIsEditingEvent(false);
                        setEditingEventData(null);
                      }
                    }}
                  >
                    <DrawerTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setIsEditingEvent(false);
                          setEditingEventData(null);
                          setNewEvent(initializeNewEvent());
                        }}
                      >
                        일정 추가
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>
                          {isEditingEvent ? "일정 수정" : "새 일정 추가"}
                        </DrawerTitle>
                      </DrawerHeader>
                      <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
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

                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <Label>시작 일시 *</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openDatePicker("start")}
                                  className="justify-start text-left font-normal"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {newEvent.start_date
                                    ? format(
                                        new Date(newEvent.start_date),
                                        "MM월 dd일",
                                        { locale: ko }
                                      )
                                    : "날짜 선택"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openTimePicker("start")}
                                  className="justify-start text-left font-normal"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  {newEvent.start_date
                                    ? format(
                                        new Date(newEvent.start_date),
                                        "HH:mm"
                                      )
                                    : "시간 선택"}
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label>종료 일시</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openDatePicker("end")}
                                  className="justify-start text-left font-normal"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {newEvent.end_date
                                    ? format(
                                        new Date(newEvent.end_date),
                                        "MM월 dd일",
                                        { locale: ko }
                                      )
                                    : "날짜 선택"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openTimePicker("end")}
                                  className="justify-start text-left font-normal"
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  {newEvent.end_date
                                    ? format(
                                        new Date(newEvent.end_date),
                                        "HH:mm"
                                      )
                                    : "시간 선택"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="location">장소</Label>
                            <Select
                              value={newEvent.location}
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setNewEvent((prev) => ({
                                    ...prev,
                                    location: "",
                                  }));
                                } else {
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

                            {(newEvent.location === "" ||
                              !savedLocations.includes(newEvent.location)) && (
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
                                        : new Date().toISOString().split("T")[0]
                                    }
                                  />
                                </div>

                                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                  💡 위에 설정한 시작일부터 종료일까지 매주 같은
                                  요일, 같은 시간에 반복됩니다.
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
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Dialog
                    open={isEventModalOpen}
                    onOpenChange={(open) => {
                      setIsEventModalOpen(open);
                      if (open && !isEditingEvent) {
                        const now = new Date();
                        const oneHourLater = addHours(now, 1);
                        setNewEvent(
                          initializeNewEvent(
                            format(now, "yyyy-MM-dd'T'HH:mm"),
                            format(oneHourLater, "yyyy-MM-dd'T'HH:mm")
                          )
                        );
                      } else if (!open) {
                        setNewEvent(initializeNewEvent());
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
                          setNewEvent(initializeNewEvent());
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
                                setNewEvent((prev) => ({
                                  ...prev,
                                  location: "",
                                }));
                              } else {
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
                              <SelectItem value="custom">직접 입력</SelectItem>
                            </SelectContent>
                          </Select>

                          {(newEvent.location === "" ||
                            !savedLocations.includes(newEvent.location)) && (
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
                                      : new Date().toISOString().split("T")[0]
                                  }
                                />
                              </div>

                              <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                💡 위에 설정한 시작일부터 종료일까지 매주 같은
                                요일, 같은 시간에 반복됩니다.
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
                ))}
            </div>
          </div>

          {/* 일정 상세보기 모달 */}
          {isMobile ? (
            <Drawer
              open={isEventDetailModalOpen}
              onOpenChange={setIsEventDetailModalOpen}
            >
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>일정 상세보기</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4">
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
                              const startDate = parseISO(
                                selectedEvent.start_date
                              );
                              return formatFullDateTimeToKorean(startDate, ko);
                            })()}
                            {selectedEvent.end_date &&
                              ` - ${formatDateTimeToKorean(
                                parseISO(selectedEvent.end_date)
                              )}`}
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
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEventDetailModalOpen(false)}
                    >
                      닫기
                    </Button>
                    {hasAdminPermission() && selectedEvent && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                      >
                        삭제
                      </Button>
                    )}
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
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
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
                            const startDate = parseISO(
                              selectedEvent.start_date
                            );
                            return formatFullDateTimeToKorean(startDate, ko);
                          })()}
                          {selectedEvent.end_date &&
                            ` - ${formatDateTimeToKorean(
                              parseISO(selectedEvent.end_date)
                            )}`}
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
                            ? teams.find((t) => t.id === selectedEvent.team_id)
                                ?.name
                            : "팀 없음"}
                        </span>
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
                  {hasAdminPermission() && selectedEvent && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                    >
                      삭제
                    </Button>
                  )}
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
          )}

          {/* 날짜별 일정 보기 모달 */}
          {isMobile ? (
            <Drawer
              open={isDayEventsModalOpen}
              onOpenChange={setIsDayEventsModalOpen}
            >
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {selectedDate && (
                      <>
                        {format(selectedDate, "yyyy년 M월 d일 (EEE)", {
                          locale: ko,
                        })}
                        의 일정
                      </>
                    )}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-4">
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
                                        className={`font-semibold flex-1 ${
                                          timeStatus.status === "past"
                                            ? "text-gray-600"
                                            : ""
                                        }`}
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
                          if (selectedDate) {
                            const now = new Date();
                            const selectedDateTime = new Date(selectedDate);
                            selectedDateTime.setHours(now.getHours());
                            selectedDateTime.setMinutes(now.getMinutes());
                            const oneHourLater = addHours(selectedDateTime, 1);

                            setNewEvent(
                              initializeNewEvent(
                                format(selectedDateTime, "yyyy-MM-dd'T'HH:mm"),
                                format(oneHourLater, "yyyy-MM-dd'T'HH:mm")
                              )
                            );

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
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
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
                                timeStatus.status === "past" ? "opacity-75" : ""
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
                                      className={`font-semibold flex-1 ${
                                        timeStatus.status === "past"
                                          ? "text-gray-600"
                                          : ""
                                      }`}
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
                        if (selectedDate) {
                          const now = new Date();
                          const selectedDateTime = new Date(selectedDate);
                          selectedDateTime.setHours(now.getHours());
                          selectedDateTime.setMinutes(now.getMinutes());
                          const oneHourLater = addHours(selectedDateTime, 1);

                          setNewEvent(
                            initializeNewEvent(
                              format(selectedDateTime, "yyyy-MM-dd'T'HH:mm"),
                              format(oneHourLater, "yyyy-MM-dd'T'HH:mm")
                            )
                          );

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
          )}

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
                  : `${format(weekDays[0], "M월 d일", { locale: ko })} - ${format(
                      weekDays[6],
                      "M월 d일",
                      { locale: ko }
                    )}`}
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
                      const timeStatus = getEventTimeStatus(eventDate, endDate);

                      if (!groups[timeStatus.status]) {
                        groups[timeStatus.status] = [];
                      }
                      groups[timeStatus.status].push(event);
                      return groups;
                    },
                    {} as Record<string, typeof filteredEvents>
                  );

                const statusOrder = ["ongoing", "today", "upcoming", "past"];

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
                        <span className="text-lg">{statusInfo?.icon}</span>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-semibold text-sm ${statusInfo?.color}`}
                          >
                            {statusInfo?.label}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-xs text-blue-400 rounded-full h-5 w-5 flex items-center justify-center p-0"
                          >
                            {events.length}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {events.map((event) => {
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
                                timeStatus.status === "past" ? "opacity-75" : ""
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
                                      className={`font-semibold flex-1 leading-tight ${
                                        timeStatus.status === "past"
                                          ? "text-gray-600"
                                          : ""
                                      }`}
                                    >
                                      {event.title}
                                    </h3>
                                    <div className="flex gap-2 flex-shrink-0">
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${timeStatus.bgColor} ${timeStatus.color}`}
                                      >
                                        {timeStatus.icon} {timeStatus.label}
                                      </span>
                                      {team && (
                                        <span
                                          className="text-xs px-2 py-1 rounded border font-medium"
                                          style={getTeamStyle(event.team_id)}
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
                                        )}{" "}
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
                <div className="p-1 text-center text-xs font-medium text-gray-500 border-r"></div>
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
                    <div
                      className="text-xs text-gray-500 border-r border-b-0 flex items-center justify-center relative bg-white"
                      style={{ height: "70px" }}
                    >
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

                    const overlappingEvents = dayEvents.filter((e) => {
                      const eStartTime = parseISO(e.start_date);
                      const eEndTime = e.end_date
                        ? parseISO(e.end_date)
                        : new Date(eStartTime.getTime() + 60 * 60 * 1000);
                      return startTime < eEndTime && endTime > eStartTime;
                    });

                    let eventWidth, eventLeft, zIndex;
                    const dayWidth = `calc((100% - 60px) / 7)`;

                    if (overlappingEvents.length > 2) {
                      const sortedEvents = overlappingEvents.sort(
                        (a, b) =>
                          parseISO(a.start_date).getTime() -
                          parseISO(b.start_date).getTime()
                      );
                      const currentEventIndex = sortedEvents.findIndex(
                        (e) => e.id === event.id
                      );

                      if (currentEventIndex === 0) {
                        eventWidth = `calc((${dayWidth} / 2) - 4px)`;
                        eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                        zIndex = 10;
                      } else if (currentEventIndex === 1) {
                        eventWidth = `calc((${dayWidth} / 2) - 4px)`;
                        eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + (${dayWidth} / 2) + 2px)`;
                        zIndex = 10;
                      } else {
                        eventWidth = `calc(${dayWidth} - 8px)`;
                        eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 6px)`;
                        zIndex = 20;
                      }
                    } else if (overlappingEvents.length === 2) {
                      const sortedEvents = overlappingEvents.sort(
                        (a, b) =>
                          parseISO(a.start_date).getTime() -
                          parseISO(b.start_date).getTime()
                      );
                      const currentEventIndex = sortedEvents.findIndex(
                        (e) => e.id === event.id
                      );

                      if (currentEventIndex === 0) {
                        eventWidth = `calc(${dayWidth} - 4px)`;
                        eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                        zIndex = 10;
                      } else {
                        eventWidth = `calc(${dayWidth} - 8px)`;
                        eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 6px)`;
                        zIndex = 20;
                      }
                    } else {
                      eventWidth = `calc(${dayWidth} - 4px)`;
                      eventLeft = `calc(60px + ${dayIndex} * ${dayWidth} + 2px)`;
                      zIndex = 10;
                    }

                    return (
                      <div
                        key={event.id}
                        className={`absolute p-1 border rounded cursor-pointer hover:shadow-md transition-shadow ${getTeamColorClass(
                          event.team_id
                        )}`}
                        style={{
                          left: eventLeft,
                          top: `${
                            startHour * 70 + (startMinute / 60) * 70 + 2
                          }px`,
                          width: eventWidth,
                          height: `${Math.max(duration * 70 - 4, 26)}px`,
                          fontSize: "10px",
                          zIndex: zIndex,
                          border: zIndex === 20 ? "1px solid white" : undefined,
                          ...getTeamStyle(event.team_id),
                        }}
                        title={event.title}
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
                          ? `${format(day, "yyyy년 M월 d일", {
                              locale: ko,
                            })}\n${dayEvents.length}개의 일정:\n${dayEvents
                              .map((e) => `• ${e.title}`)
                              .join("\n")}`
                          : `${format(day, "yyyy년 M월 d일", {
                              locale: ko,
                            })}\n등록된 일정이 없습니다.`
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
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getTeamColorClass(
                                event.team_id
                              )}`}
                              style={{
                                ...getTeamStyle(event.team_id),
                              }}
                              title={event.title}
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
      </div>

      {/* Google Calendar 동기화 로딩 모달 */}
      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl min-w-[250px]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">
              Google Calendar 동기화 중...
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

      {/* 일정 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 일정을 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모바일 날짜 선택 Drawer */}
      <Drawer open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {datePickerMode === "start" ? "시작 날짜 선택" : "종료 날짜 선택"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <div className="flex gap-2 pb-4">
              <Button
                variant="outline"
                onClick={() => setIsDatePickerOpen(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button onClick={confirmDateSelection} className="flex-1">
                선택
              </Button>
            </div>
            <div className="py-4">
              <CalendarComponent
                mode="single"
                selected={tempDate}
                onSelect={(date) => date && setTempDate(date)}
                className="w-full rounded-md border"
                locale={ko}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 모바일 시간 선택 Drawer - 개선된 휠 피커 */}
      <Drawer open={isTimePickerOpen} onOpenChange={setIsTimePickerOpen} shouldScaleBackground={false}>
        <DrawerContent style={{ touchAction: "none" }}>
          <DrawerHeader>
            <DrawerTitle>
              {datePickerMode === "start" ? "시작 시간 선택" : "종료 시간 선택"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4" style={{ touchAction: "none" }}>
            <div className="flex justify-center items-center py-4">
              <div 
                className="w-full max-w-sm" 
                style={{ touchAction: "pan-y", overflow: "hidden" }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                <Picker
                  value={pickerValue}
                  onChange={handlePickerChange}
                  wheelMode="natural"
                  height={200}
                  itemHeight={40}
                >
                  <Picker.Column name="ampm">
                    <Picker.Item value="오전">오전</Picker.Item>
                    <Picker.Item value="오후">오후</Picker.Item>
                  </Picker.Column>
                  <Picker.Column name="hour">
                    {Array.from({ length: 36 }, (_, i) => {
                      const hour = (i % 12) + 1; // 1-12가 3번 반복 (더 부드러운 스크롤을 위해)
                      const cycle = Math.floor(i / 12); // 0, 1, 2 사이클
                      return (
                        <Picker.Item key={i} value={`${hour}-${cycle}`}>
                          {hour}
                        </Picker.Item>
                      );
                    })}
                  </Picker.Column>
                  <Picker.Column name="minute">
                    {Array.from({ length: 180 }, (_, i) => {
                      const minute = i % 60; // 0-59가 3번 반복
                      return (
                        <Picker.Item
                          key={i}
                          value={minute.toString().padStart(2, "0")}
                        >
                          {minute.toString().padStart(2, "0")}
                        </Picker.Item>
                      );
                    })}
                  </Picker.Column>
                </Picker>
              </div>
            </div>

            <div className="flex gap-2 pt-4 pb-6">
              <Button
                variant="outline"
                onClick={() => setIsTimePickerOpen(false)}
                className="flex-1 h-12"
              >
                취소
              </Button>
              <Button onClick={confirmTimeSelection} className="flex-1 h-12">
                선택
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Alert 다이얼로그 */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
