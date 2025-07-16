"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  UserX,
  Clock as ClockIcon,
  Eye,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  eachWeekOfInterval, 
  getWeek,
  isToday,
  isSameMonth
} from "date-fns";
import { ko } from "date-fns/locale";

// 타입 정의
interface Program {
  id: string;
  name: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
  features: string[];
}

interface Participant {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  status: "참여중" | "대기" | "탈퇴";
}

interface FinanceRecord {
  id: string;
  date: string;
  type: "수입" | "지출";
  category: string;
  amount: number;
  description: string;
  name?: string;
  supplier?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  contact?: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  required: boolean;
  price?: number;
}

interface ParticipantCheck {
  participantId: string;
  checklistItemId: string;
  completed: boolean;
  completedDate?: string;
  note?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface TeamRole {
  id: string;
  name: string;
  tier: number; // 0이 최고 티어, 숫자가 높을수록 낮은 티어
  color: string;
  order: number; // 표시 순서
}

interface TeamMember {
  teamId: string;
  participantId: string;
  roleId: string; // 역할 ID로 변경
  joinDate: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  attendees?: number;
  type: string;
  teamId?: string;
}

interface EventType {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface AttendanceRecord {
  id: string;
  eventId: string;
  participantId: string;
  status: "출석" | "결석" | "지각";
  date: string;
  note?: string;
}

interface AttendanceSession {
  id: string;
  eventId: string;
  date: string;
  title: string;
  totalParticipants: number;
  attendedCount: number;
  absentCount: number;
  lateCount: number;
}

// 시간 선택을 위한 헬퍼 함수
const generateTimeOptions = () => {
  const times = [];
  
  // 오전 시간대 (6:00 AM - 11:30 AM)
  for (let hour = 6; hour < 12; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = `${hour}:${minute.toString().padStart(2, '0')} AM`;
      times.push({ value: timeString, label: displayTime });
    }
  }
  
  // 12:00 PM
  times.push({ value: "12:00", label: "12:00 PM" });
  times.push({ value: "12:30", label: "12:30 PM" });
  
  // 오후 시간대 (1:00 PM - 11:30 PM)
  for (let hour = 13; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} PM`;
      times.push({ value: timeString, label: displayTime });
    }
  }
  
  return times;
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [participantChecks, setParticipantChecks] = useState<ParticipantCheck[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  
  // 캘린더 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // 재정 관련 상태
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("전체");
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [selectedFinanceRecord, setSelectedFinanceRecord] = useState<FinanceRecord | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [selectedCategoryEdit, setSelectedCategoryEdit] = useState<Category | null>(null);
  const [selectedSupplierEdit, setSelectedSupplierEdit] = useState<Supplier | null>(null);
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);
  const [selectedChecklistEdit, setSelectedChecklistEdit] = useState<ChecklistItem | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedTeamEdit, setSelectedTeamEdit] = useState<Team | null>(null);
  const [isTeamSettingsDialogOpen, setIsTeamSettingsDialogOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: "", tier: 2, color: "#3B82F6" });
  const [selectedRoleEdit, setSelectedRoleEdit] = useState<TeamRole | null>(null);
  const [teamMemberAddState, setTeamMemberAddState] = useState<{[teamId: string]: {open: boolean, value: string}}>({});
  const [isEventTypeDialogOpen, setIsEventTypeDialogOpen] = useState(false);
  const [eventTypeForm, setEventTypeForm] = useState({ name: "", color: "#3B82F6" });
  const [selectedEventTypeEdit, setSelectedEventTypeEdit] = useState<EventType | null>(null);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    eventId: "",
  });
  const [currentAttendanceData, setCurrentAttendanceData] = useState<{[participantId: string]: "출석" | "결석" | "지각" | ""}>({});

  // 폼 상태
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    type: "",
    teamId: "",
  });

  const [financeForm, setFinanceForm] = useState({
    type: "지출" as "수입" | "지출",
    category: "",
    amount: "",
    description: "",
    name: "",
    supplier: "",
    date: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
  });

  const [checklistForm, setChecklistForm] = useState({
    name: "",
    required: false,
    price: "",
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  // 프로그램 데이터 로드
  useEffect(() => {
    const mockProgram: Program = {
      id: programId,
      name: "청년부 제자훈련",
      category: "교육",
      status: "진행중",
      startDate: "2024-01-15",
      endDate: "2024-06-30",
      description: "청년들을 위한 체계적인 제자훈련 프로그램",
      features: ["participants", "finance", "calendar", "attendance", "checklist", "teams"],
    };

    const mockParticipants: Participant[] = [
      {
        id: "1",
        name: "김영수",
        phone: "010-1234-5678",
        email: "kim@example.com",
        joinDate: "2024-01-15",
        status: "참여중",
      },
      {
        id: "2",
        name: "이미영",
        phone: "010-2345-6789",
        email: "lee@example.com",
        joinDate: "2024-01-16",
        status: "참여중",
      },
      {
        id: "3",
        name: "박준호",
        phone: "010-3456-7890",
        email: "park@example.com",
        joinDate: "2024-01-20",
        status: "대기",
      },
    ];

    const mockCategories: Category[] = [
      { id: "1", name: "교재구입" },
      { id: "2", name: "참가비" },
      { id: "3", name: "간식비" },
      { id: "4", name: "교통비" },
      { id: "5", name: "후원금" },
      { id: "6", name: "장비구입" },
    ];

    const mockSuppliers: Supplier[] = [
      { id: "1", name: "기독교서점", contact: "416-123-4567" },
      { id: "2", name: "로얄버스", contact: "416-987-6543" },
      { id: "3", name: "코스트코", contact: "416-555-0123" },
      { id: "4", name: "아마존", contact: "온라인주문" },
      { id: "5", name: "교회", contact: "내부" },
    ];

    const mockFinances: FinanceRecord[] = [
      {
        id: "1",
        date: "2024-01-15",
        type: "지출",
        category: "교재구입",
        amount: 150,
        description: "제자훈련 교재 구입",
        name: "김영수",
        supplier: "기독교서점",
      },
      {
        id: "2",
        date: "2024-02-01",
        type: "수입",
        category: "참가비",
        amount: 500,
        description: "참가자 참가비 수납",
        name: "재정담당자",
        supplier: "교회",
      },
      {
        id: "3",
        date: "2024-02-15",
        type: "지출",
        category: "간식비",
        amount: 80,
        description: "모임 간식 구입",
        name: "이미영",
        supplier: "코스트코",
      },
      {
        id: "4",
        date: "2024-03-01",
        type: "지출",
        category: "교통비",
        amount: 45,
        description: "수련회 버스 대여",
        name: "박준호",
        supplier: "로얄버스",
      },
      {
        id: "5",
        date: "2024-03-10",
        type: "수입",
        category: "후원금",
        amount: 200,
        description: "개인 후원금",
        name: "목사님",
        supplier: "개인후원자",
      },
    ];

    const mockEventTypes: EventType[] = [
      { id: "1", name: "정기 모임", color: "#3B82F6", order: 1 },
      { id: "2", name: "특별 행사", color: "#7C3AED", order: 2 },
      { id: "3", name: "회의", color: "#059669", order: 3 },
    ];

    const mockEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "1주차: 복음의 기초",
        date: "2024-12-22",
        startTime: "19:00",
        endTime: "20:30",
        location: "교육관 2층",
        attendees: 22,
        type: "1",
        teamId: "1",
      },
      {
        id: "2",
        title: "2주차: 기도의 삶",
        date: "2024-12-29",
        startTime: "19:00",
        endTime: "20:30",
        location: "교육관 2층",
        attendees: 20,
        type: "1",
        teamId: "2",
      },
      {
        id: "3",
        title: "특별 기도회",
        date: "2024-12-25",
        startTime: "10:00",
        endTime: "11:30",
        location: "본당",
        type: "2",
      },
    ];

    const mockAttendanceSessions: AttendanceSession[] = [
      {
        id: "1",
        eventId: "1",
        date: "2024-12-22",
        title: "1주차: 복음의 기초",
        totalParticipants: 3,
        attendedCount: 2,
        absentCount: 1,
        lateCount: 0,
      },
      {
        id: "2",
        eventId: "2",
        date: "2024-12-29",
        title: "2주차: 기도의 삶",
        totalParticipants: 3,
        attendedCount: 3,
        absentCount: 0,
        lateCount: 0,
      },
    ];

    const mockAttendanceRecords: AttendanceRecord[] = [
      {
        id: "1",
        eventId: "1",
        participantId: "1",
        status: "출석",
        date: "2024-12-22",
      },
      {
        id: "2",
        eventId: "1",
        participantId: "2",
        status: "출석",
        date: "2024-12-22",
      },
      {
        id: "3",
        eventId: "1",
        participantId: "3",
        status: "결석",
        date: "2024-12-22",
        note: "개인 사정",
      },
      {
        id: "4",
        eventId: "2",
        participantId: "1",
        status: "출석",
        date: "2024-12-29",
      },
      {
        id: "5",
        eventId: "2",
        participantId: "2",
        status: "출석",
        date: "2024-12-29",
      },
      {
        id: "6",
        eventId: "2",
        participantId: "3",
        status: "출석",
        date: "2024-12-29",
      },
    ];

    const mockChecklistItems: ChecklistItem[] = [
      { id: "1", name: "회비 납부", required: true, price: 50 },
      { id: "2", name: "단체 티셔츠 구매", required: false, price: 25 },
      { id: "3", name: "교재 구입", required: true, price: 30 },
      { id: "4", name: "수련회 참가비", required: false, price: 100 },
      { id: "5", name: "프로필 사진 제출", required: true },
    ];

    const mockParticipantChecks: ParticipantCheck[] = [
      { participantId: "1", checklistItemId: "1", completed: true, completedDate: "2024-01-20" },
      { participantId: "1", checklistItemId: "2", completed: true, completedDate: "2024-01-25" },
      { participantId: "1", checklistItemId: "3", completed: false },
      { participantId: "1", checklistItemId: "5", completed: true, completedDate: "2024-01-18" },
      
      { participantId: "2", checklistItemId: "1", completed: true, completedDate: "2024-01-22" },
      { participantId: "2", checklistItemId: "2", completed: false },
      { participantId: "2", checklistItemId: "3", completed: true, completedDate: "2024-02-01" },
      { participantId: "2", checklistItemId: "5", completed: false },
      
      { participantId: "3", checklistItemId: "1", completed: false },
      { participantId: "3", checklistItemId: "3", completed: false },
      { participantId: "3", checklistItemId: "5", completed: true, completedDate: "2024-01-21" },
    ];

    const mockTeams: Team[] = [
      { id: "1", name: "알파팀", description: "기초반 그룹", color: "#3B82F6" },
      { id: "2", name: "베타팀", description: "중급반 그룹", color: "#10B981" },
      { id: "3", name: "감마팀", description: "고급반 그룹", color: "#F59E0B" },
    ];

    const mockTeamRoles: TeamRole[] = [
      { id: "1", name: "팀장", tier: 0, color: "#DC2626", order: 1 },
      { id: "2", name: "부팀장", tier: 1, color: "#EA580C", order: 2 },
      { id: "3", name: "인도자", tier: 1, color: "#7C3AED", order: 3 },
      { id: "4", name: "찬양팀", tier: 2, color: "#059669", order: 4 },
      { id: "5", name: "팀원", tier: 2, color: "#3B82F6", order: 5 },
    ];

    const mockTeamMembers: TeamMember[] = [
      { teamId: "1", participantId: "1", roleId: "1", joinDate: "2024-01-15" },
      { teamId: "1", participantId: "3", roleId: "5", joinDate: "2024-01-20" },
      { teamId: "2", participantId: "2", roleId: "1", joinDate: "2024-01-16" },
    ];

    setProgram(mockProgram);
    setParticipants(mockParticipants);
    setFinances(mockFinances);
    setEvents(mockEvents);
    setEventTypes(mockEventTypes);
    setAttendanceSessions(mockAttendanceSessions);
    setAttendanceRecords(mockAttendanceRecords);
    setCategories(mockCategories);
    setSuppliers(mockSuppliers);
    setChecklistItems(mockChecklistItems);
    setParticipantChecks(mockParticipantChecks);
    setTeams(mockTeams);
    setTeamMembers(mockTeamMembers);
    setTeamRoles(mockTeamRoles);
  }, [programId]);

  // 캘린더 관련 함수들
  const navigateDate = (direction: "prev" | "next") => {
    if (viewType === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const getCalendarDays = () => {
    if (viewType === "month") {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEventForm({ ...eventForm, date: format(date, "yyyy-MM-dd") });
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setEventForm({
      title: "",
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      startTime: "",
      endTime: "",
      location: "",
      description: "",
      type: eventTypes[0]?.id || "",
      teamId: "",
    });
    setIsEventDialogOpen(true);
  };

  // 출석 체크 관리 함수들
  const handleOpenAttendanceDialog = () => {
    setAttendanceForm({
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      eventId: "",
    });
    setCurrentAttendanceData({});
    setIsAttendanceDialogOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!attendanceForm.title || !attendanceForm.date) {
      alert("세션명과 날짜를 입력해주세요.");
      return;
    }

    // 새로운 출석 세션 생성
    const newSession: AttendanceSession = {
      id: Date.now().toString(),
      eventId: attendanceForm.eventId || "",
      date: attendanceForm.date,
      title: attendanceForm.title,
      totalParticipants: participants.length,
      attendedCount: Object.values(currentAttendanceData).filter(status => status === "출석").length,
      absentCount: Object.values(currentAttendanceData).filter(status => status === "결석").length,
      lateCount: Object.values(currentAttendanceData).filter(status => status === "지각").length,
    };

    // 출석 기록 생성
    const newRecords: AttendanceRecord[] = Object.entries(currentAttendanceData)
      .filter(([_, status]) => status !== "")
      .map(([participantId, status]) => ({
        id: `${Date.now()}-${participantId}`,
        eventId: attendanceForm.eventId || "",
        participantId,
        status: status as "출석" | "결석" | "지각",
        date: attendanceForm.date,
      }));

    setAttendanceSessions([...attendanceSessions, newSession]);
    setAttendanceRecords([...attendanceRecords, ...newRecords]);
    setIsAttendanceDialogOpen(false);
    setCurrentAttendanceData({});
  };

  const handleAttendanceStatusChange = (participantId: string, status: "출석" | "결석" | "지각") => {
    setCurrentAttendanceData(prev => ({
      ...prev,
      [participantId]: status
    }));
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description || "",
      type: event.type,
      teamId: event.teamId || "",
    });
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (selectedEvent) {
      // 편집
      setEvents(events.map(e => 
        e.id === selectedEvent.id 
          ? { ...selectedEvent, ...eventForm }
          : e
      ));
    } else {
      // 새 이벤트 추가
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...eventForm,
      };
      setEvents([...events, newEvent]);
    }
    setIsEventDialogOpen(false);
  };

  // 재정 관리 함수들
  const getUniqueCategories = () => {
    return ["전체", ...categories.map(c => c.name)];
  };

  const getUniqueSuppliers = () => {
    return ["전체", ...suppliers.map(s => s.name)];
  };

  const getFilteredFinances = () => {
    let filtered = finances;
    
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    if (selectedSupplier !== "전체") {
      filtered = filtered.filter(f => f.supplier === selectedSupplier);
    }
    
    return filtered;
  };

  const handleAddFinance = () => {
    setSelectedFinanceRecord(null);
    setFinanceForm({
      type: "지출",
      category: "",
      amount: "",
      description: "",
      name: "",
      supplier: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setIsFinanceDialogOpen(true);
  };

  const handleEditFinance = (record: FinanceRecord) => {
    setSelectedFinanceRecord(record);
    setFinanceForm({
      type: record.type,
      category: record.category,
      amount: record.amount.toString(),
      description: record.description,
      name: record.name || "",
      supplier: record.supplier || "",
      date: record.date,
    });
    setIsFinanceDialogOpen(true);
  };

  const handleSaveFinance = () => {
    if (selectedFinanceRecord) {
      // 편집
      setFinances(finances.map(f => 
        f.id === selectedFinanceRecord.id 
          ? { 
              ...selectedFinanceRecord, 
              ...financeForm,
              amount: parseFloat(financeForm.amount) || 0
            }
          : f
      ));
    } else {
      // 새 거래 추가
      const newRecord: FinanceRecord = {
        id: Date.now().toString(),
        ...financeForm,
        amount: parseFloat(financeForm.amount) || 0,
      };
      setFinances([...finances, newRecord]);
    }
    setIsFinanceDialogOpen(false);
  };

  const handleDeleteFinance = (id: string) => {
    if (confirm("정말로 이 거래를 삭제하시겠습니까?")) {
      setFinances(finances.filter(f => f.id !== id));
    }
  };

  // 카테고리 관리 함수들
  const handleAddCategory = () => {
    setSelectedCategoryEdit(null);
    setCategoryForm({ name: "" });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategoryEdit(category);
    setCategoryForm({ name: category.name });
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (selectedCategoryEdit) {
      // 편집
      setCategories(categories.map(c => 
        c.id === selectedCategoryEdit.id 
          ? { ...selectedCategoryEdit, name: categoryForm.name }
          : c
      ));
    } else {
      // 새 카테고리 추가
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryForm.name,
      };
      setCategories([...categories, newCategory]);
    }
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  // 공급자 관리 함수들
  const handleAddSupplier = () => {
    setSelectedSupplierEdit(null);
    setSupplierForm({ name: "", contact: "" });
    setIsSupplierDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplierEdit(supplier);
    setSupplierForm({ name: supplier.name, contact: supplier.contact || "" });
    setIsSupplierDialogOpen(true);
  };

  const handleSaveSupplier = () => {
    if (selectedSupplierEdit) {
      // 편집
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplierEdit.id 
          ? { ...selectedSupplierEdit, name: supplierForm.name, contact: supplierForm.contact }
          : s
      ));
    } else {
      // 새 공급자 추가
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        name: supplierForm.name,
        contact: supplierForm.contact,
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setIsSupplierDialogOpen(false);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm("정말로 이 공급자를 삭제하시겠습니까?")) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  if (!program) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableTabs = [
    { id: "overview", label: "개요", icon: BarChart3 },
    ...(program.features.includes("participants") ? [{ id: "participants", label: "참여자", icon: Users }] : []),
    ...(program.features.includes("finance") ? [{ id: "finance", label: "재정", icon: DollarSign }] : []),
    ...(program.features.includes("calendar") ? [{ id: "calendar", label: "일정", icon: CalendarIcon }] : []),
    ...(program.features.includes("attendance") ? [{ id: "attendance", label: "출석", icon: UserCheck }] : []),
    ...(program.features.includes("checklist") ? [{ id: "checklist", label: "확인사항", icon: CheckCircle }] : []),
    ...(program.features.includes("teams") ? [{ id: "teams", label: "팀 관리", icon: Users }] : []),
    { id: "settings", label: "설정", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* 심플한 헤더 */}
      <div className="space-y-4 pb-6 border-b">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/programs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            프로그램 편집
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.name}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1">{program.category}</Badge>
            <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1">{program.status}</Badge>
            <span className="text-gray-500">
              {format(new Date(program.startDate), "yyyy.MM.dd", { locale: ko })} ~ {format(new Date(program.endDate), "yyyy.MM.dd", { locale: ko })}
            </span>
          </div>
        </div>
      </div>

      {/* 깔끔한 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full bg-gray-50 h-12" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm h-10 px-4 text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* 개요 탭 - 심플한 통계 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-4">
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">참여자</p>
                    <p className="text-2xl font-bold text-blue-900">{participants.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">총 수입</p>
                    <p className="text-2xl font-bold text-green-900">
                      ${finances.filter(f => f.type === "수입").reduce((sum, f) => sum + f.amount, 0).toLocaleString()} CAD
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">총 지출</p>
                    <p className="text-2xl font-bold text-red-900">
                      ${finances.filter(f => f.type === "지출").reduce((sum, f) => sum + f.amount, 0).toLocaleString()} CAD
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-600">일정</p>
                    <p className="text-2xl font-bold text-purple-900">{events.length}</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">프로그램 설명</h3>
              <p className="text-gray-600 leading-relaxed">{program.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 참여자 관리 탭 */}
        {program.features.includes("participants") && (
          <TabsContent value="participants" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">참여자 관리</h2>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                참여자 추가
              </Button>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">이름</TableHead>
                      <TableHead className="font-semibold">연락처</TableHead>
                      <TableHead className="font-semibold">이메일</TableHead>
                      <TableHead className="font-semibold">참여일</TableHead>
                      <TableHead className="font-semibold">상태</TableHead>
                      <TableHead className="text-right font-semibold">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id} className="border-b last:border-0">
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell className="text-gray-600">{participant.phone}</TableCell>
                        <TableCell className="text-gray-600">{participant.email}</TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(participant.joinDate), "yyyy.MM.dd", { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={participant.status === "참여중" ? "default" : "secondary"}
                            className={
                              participant.status === "참여중"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : participant.status === "대기"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }
                          >
                            {participant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 재정 관리 탭 */}
        {program.features.includes("finance") && (
          <TabsContent value="finance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">재정 관리</h2>
              <div className="flex items-center gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="공급자" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueSuppliers().map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handleAddCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  카테고리
                </Button>
                <Button size="sm" variant="outline" onClick={handleAddSupplier}>
                  <Plus className="h-4 w-4 mr-2" />
                  공급자
                </Button>
                <Button size="sm" onClick={handleAddFinance}>
                  <Plus className="h-4 w-4 mr-2" />
                  거래 추가
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6 grid-cols-3">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600 mb-1">총 수입</p>
                    <p className="text-3xl font-bold text-green-700">
                      ${getFilteredFinances().filter(f => f.type === "수입").reduce((sum, f) => sum + f.amount, 0).toLocaleString()} CAD
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-rose-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-red-600 mb-1">총 지출</p>
                    <p className="text-3xl font-bold text-red-700">
                      ${getFilteredFinances().filter(f => f.type === "지출").reduce((sum, f) => sum + f.amount, 0).toLocaleString()} CAD
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600 mb-1">잔액</p>
                    <p className="text-3xl font-bold text-blue-700">
                      ${(getFilteredFinances().filter(f => f.type === "수입").reduce((sum, f) => sum + f.amount, 0) -
                        getFilteredFinances().filter(f => f.type === "지출").reduce((sum, f) => sum + f.amount, 0)
                      ).toLocaleString()} CAD
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">날짜</TableHead>
                      <TableHead className="font-semibold">구분</TableHead>
                      <TableHead className="font-semibold">카테고리</TableHead>
                      <TableHead className="font-semibold">공급자</TableHead>
                      <TableHead className="font-semibold">금액</TableHead>
                      <TableHead className="font-semibold">이름</TableHead>
                      <TableHead className="font-semibold">설명</TableHead>
                      <TableHead className="text-right font-semibold">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredFinances().map((record) => (
                      <TableRow key={record.id} className="border-b last:border-0">
                        <TableCell className="text-gray-600">
                          {format(new Date(record.date), "MM.dd", { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              record.type === "수입"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{record.category}</TableCell>
                        <TableCell className="text-gray-600">{record.supplier || "-"}</TableCell>
                        <TableCell className={`font-medium ${record.type === "수입" ? "text-green-600" : "text-red-600"}`}>
                          {record.type === "수입" ? "+" : "-"}${record.amount.toLocaleString()} CAD
                        </TableCell>
                        <TableCell className="text-gray-600">{record.name || "-"}</TableCell>
                        <TableCell className="text-gray-600">{record.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditFinance(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFinance(record.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 캘린더 일정 관리 탭 */}
        {program.features.includes("calendar") && (
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">일정 관리</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewType === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("week")}
                    className="h-8"
                  >
                    주별
                  </Button>
                  <Button
                    variant={viewType === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewType("month")}
                    className="h-8"
                  >
                    월별
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEventTypeDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  유형 설정
                </Button>
                <Button size="sm" onClick={handleAddEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  일정 추가
                </Button>
              </div>
            </div>

            {/* 주간 캘린더 뷰 */}
            {viewType === "week" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {format(startOfWeek(currentDate), "M월 d일", { locale: ko })} - {format(endOfWeek(currentDate), "M월 d일", { locale: ko })}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* 요일 헤더 */}
                      <div className="grid grid-cols-8 border-b mb-2">
                        <div className="p-2 text-xs font-medium text-gray-500">시간</div>
                        {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, index) => (
                          <div key={index} className="p-2 text-center border-l">
                            <div className="text-xs font-medium text-gray-500">
                              {format(day, "E", { locale: ko })}
                            </div>
                            <div className={`text-lg font-medium ${isToday(day) ? "text-blue-600" : ""}`}>
                              {format(day, "d")}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 시간별 그리드 */}
                      <div className="relative">
                        {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                          <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                            <div className="p-2 text-xs text-gray-500 border-r">
                              {hour.toString().padStart(2, '0')}:00
                            </div>
                            {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, index) => (
                              <div key={index} className="border-l border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleDateClick(day)}></div>
                            ))}
                          </div>
                        ))}

                        {/* 일정 표시 */}
                        {eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }).map((day, dayIndex) => {
                          const dayEvents = getEventsForDate(day);
                          return dayEvents.map(event => {
                            const startHour = parseInt(event.startTime.split(':')[0]);
                            const endHour = parseInt(event.endTime.split(':')[0]);
                            const duration = endHour - startHour;

                            const eventType = eventTypes.find(et => et.id === event.type);
                            const team = teams.find(t => t.id === event.teamId);
                            
                            return (
                              <div
                                key={event.id}
                                onClick={() => handleEditEvent(event)}
                                className="absolute p-1 border rounded cursor-pointer hover:shadow-md transition-shadow"
                                style={{
                                  left: `${(dayIndex + 1) * 12.5}%`,
                                  top: `${startHour * 60}px`,
                                  width: '11.5%',
                                  height: `${duration * 60 - 4}px`,
                                  fontSize: '11px',
                                  backgroundColor: eventType ? eventType.color + '20' : '#f3f4f6',
                                  borderColor: eventType ? eventType.color : '#d1d5db',
                                  color: eventType ? eventType.color : '#374151',
                                }}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="text-xs opacity-75 truncate">
                                  {event.startTime} - {event.endTime}
                                </div>
                                <div className="text-xs opacity-75 truncate">{event.location}</div>
                                {team && (
                                  <div className="text-xs opacity-75 truncate">{team.name}</div>
                                )}
                                {event.attendees && (
                                  <div className="text-xs opacity-75">
                                    {event.attendees}명
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 월간 캘린더 뷰 */}
            {viewType === "month" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {format(currentDate, "yyyy년 M월", { locale: ko })}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                      <div
                        key={index}
                        className={`bg-gray-50 p-2 text-center text-sm font-medium ${
                          index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 날짜 그리드 */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {getCalendarDays().map((day, index) => {
                      const dayEvents = getEventsForDate(day);
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={index}
                          className={`
                            bg-white p-2 min-h-[100px] cursor-pointer hover:bg-gray-50
                            ${!isCurrentMonth ? 'opacity-50' : ''}
                            ${isToday(day) ? 'bg-blue-50' : ''}
                            ${isSelected ? 'bg-blue-100' : ''}
                          `}
                          onClick={() => handleDateClick(day)}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            index % 7 === 0 ? 'text-red-600' : 
                            index % 7 === 6 ? 'text-blue-600' : 
                            'text-gray-700'
                          } ${isToday(day) ? 'font-bold' : ''}`}>
                            {format(day, "d")}
                          </div>
                          
                          {/* 일정 표시 */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map(event => {
                              const eventType = eventTypes.find(et => et.id === event.type);
                              return (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                  className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100 truncate"
                                  style={{
                                    backgroundColor: eventType ? eventType.color + '20' : '#f3f4f6',
                                    color: eventType ? eventType.color : '#374151',
                                  }}
                                >
                                  <span className="font-medium">{event.startTime}</span> {event.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayEvents.length - 3}개 더
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* 출석 관리 탭 */}
        {program.features.includes("attendance") && (
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">출석 관리</h2>
              <Button size="sm" onClick={handleOpenAttendanceDialog}>
                <Plus className="h-4 w-4 mr-2" />
                출석 체크
              </Button>
            </div>

            {/* 출석 통계 카드 */}
            <div className="grid gap-4 grid-cols-4">
              <Card className="border-0 shadow-sm bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600">전체 세션</p>
                      <p className="text-2xl font-bold text-blue-900">{attendanceSessions.length}</p>
                    </div>
                    <ClipboardList className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">평균 출석률</p>
                      <p className="text-2xl font-bold text-green-900">
                        {attendanceSessions.length > 0 
                          ? Math.round(
                              (attendanceSessions.reduce((sum, session) => sum + session.attendedCount, 0) /
                               attendanceSessions.reduce((sum, session) => sum + session.totalParticipants, 0)) * 100
                            )
                          : 0}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600">총 결석</p>
                      <p className="text-2xl font-bold text-red-900">
                        {attendanceSessions.reduce((sum, session) => sum + session.absentCount, 0)}
                      </p>
                    </div>
                    <UserX className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600">총 지각</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {attendanceSessions.reduce((sum, session) => sum + session.lateCount, 0)}
                      </p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 참여자별 출석 현황 */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">참여자별 출석 현황</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">참여자</TableHead>
                      <TableHead className="font-semibold">총 세션</TableHead>
                      <TableHead className="font-semibold">출석</TableHead>
                      <TableHead className="font-semibold">결석</TableHead>
                      <TableHead className="font-semibold">지각</TableHead>
                      <TableHead className="font-semibold">출석률</TableHead>
                      <TableHead className="text-right font-semibold">상세</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => {
                      const participantRecords = attendanceRecords.filter(
                        record => record.participantId === participant.id
                      );
                      const attendedCount = participantRecords.filter(r => r.status === "출석").length;
                      const absentCount = participantRecords.filter(r => r.status === "결석").length;
                      const lateCount = participantRecords.filter(r => r.status === "지각").length;
                      const totalSessions = participantRecords.length;
                      const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

                      return (
                        <TableRow key={participant.id} className="border-b last:border-0">
                          <TableCell className="font-medium">{participant.name}</TableCell>
                          <TableCell className="text-gray-600">{totalSessions}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {attendedCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {absentCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {lateCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                attendanceRate >= 80 
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : attendanceRate >= 60
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {attendanceRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 세션별 출석 기록 */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">세션별 출석 기록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">날짜</TableHead>
                      <TableHead className="font-semibold">세션명</TableHead>
                      <TableHead className="font-semibold">총 인원</TableHead>
                      <TableHead className="font-semibold">출석</TableHead>
                      <TableHead className="font-semibold">결석</TableHead>
                      <TableHead className="font-semibold">지각</TableHead>
                      <TableHead className="font-semibold">출석률</TableHead>
                      <TableHead className="text-right font-semibold">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSessions.map((session) => {
                      const attendanceRate = Math.round((session.attendedCount / session.totalParticipants) * 100);
                      
                      return (
                        <TableRow key={session.id} className="border-b last:border-0">
                          <TableCell className="text-gray-600">
                            {format(new Date(session.date), "MM.dd", { locale: ko })}
                          </TableCell>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell className="text-gray-600">{session.totalParticipants}명</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {session.attendedCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {session.absentCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {session.lateCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                attendanceRate >= 80 
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : attendanceRate >= 60
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-red-100 text-red-800 border-red-200"
                              }
                            >
                              {attendanceRate}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 확인사항 탭 */}
        {program.features.includes("checklist") && (
          <TabsContent value="checklist" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">확인사항 관리</h2>
              <Button size="sm" onClick={() => {
                setSelectedChecklistEdit(null);
                setChecklistForm({ name: "", required: false, price: "" });
                setIsChecklistDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>
            </div>

            {/* 참여자별 확인사항 현황 */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">참여자별 확인 현황</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="font-semibold min-w-[120px]">참여자</TableHead>
                        {checklistItems.map((item) => (
                          <TableHead key={item.id} className="font-semibold text-center min-w-[120px]">
                            <div className="flex flex-col items-center">
                              <span className="text-xs">{item.name}</span>
                              {item.price && (
                                <span className="text-xs text-gray-500">${item.price} CAD</span>
                              )}
                              {item.required && (
                                <span className="text-xs text-red-500">필수</span>
                              )}
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="font-semibold text-center">완료율</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => {
                        const participantCheckData = participantChecks.filter(
                          check => check.participantId === participant.id
                        );
                        // 필수 항목만 완료율 계산에 포함
                        const requiredItems = checklistItems.filter(item => item.required);
                        const completedRequiredCount = participantCheckData.filter(check => {
                          const item = checklistItems.find(item => item.id === check.checklistItemId);
                          return check.completed && item?.required;
                        }).length;
                        const totalRequiredCount = requiredItems.length;
                        const completionRate = totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0;

                        return (
                          <TableRow key={participant.id} className="border-b last:border-0">
                            <TableCell className="font-medium">{participant.name}</TableCell>
                            {checklistItems.map((item) => {
                              const checkData = participantCheckData.find(
                                check => check.checklistItemId === item.id
                              );
                              
                              return (
                                <TableCell key={item.id} className="text-center">
                                  <div className="flex justify-center">
                                    {checkData?.completed ? (
                                      <div className="flex flex-col items-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="p-1 h-auto hover:bg-red-50"
                                          onClick={() => {
                                            // 완료 상태를 취소로 변경
                                            setParticipantChecks(participantChecks.map(check => 
                                              check.participantId === participant.id && check.checklistItemId === item.id
                                                ? { ...check, completed: false, completedDate: undefined }
                                                : check
                                            ));
                                          }}
                                        >
                                          <CheckCircle className="h-5 w-5 text-green-500 hover:text-red-500 transition-colors" />
                                        </Button>
                                        {checkData.completedDate && (
                                          <span className="text-xs text-gray-500 mt-1">
                                            {format(new Date(checkData.completedDate), "MM/dd", { locale: ko })}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="p-1 h-auto hover:bg-green-50"
                                          onClick={() => {
                                            if (checkData) {
                                              // 기존 체크 데이터가 있으면 완료로 변경
                                              setParticipantChecks(participantChecks.map(check => 
                                                check.participantId === participant.id && check.checklistItemId === item.id
                                                  ? { ...check, completed: true, completedDate: format(new Date(), "yyyy-MM-dd") }
                                                  : check
                                              ));
                                            } else {
                                              // 새로운 체크 데이터 생성
                                              const newCheck: ParticipantCheck = {
                                                participantId: participant.id,
                                                checklistItemId: item.id,
                                                completed: true,
                                                completedDate: format(new Date(), "yyyy-MM-dd"),
                                              };
                                              setParticipantChecks([...participantChecks, newCheck]);
                                            }
                                          }}
                                        >
                                          <XCircle className="h-5 w-5 text-red-300 hover:text-green-500 transition-colors" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center">
                              <div className="w-16 mx-auto">
                                <Badge 
                                  className={`w-full justify-center text-xs ${
                                    completionRate >= 80 
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : completionRate >= 50
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                  }`}
                                >
                                  {completionRate}%
                                </Badge>
                              </div>
                              {totalRequiredCount > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {completedRequiredCount}/{totalRequiredCount} 필수
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* 확인사항 목록 관리 */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">확인사항 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">항목명</TableHead>
                      <TableHead className="font-semibold">필수여부</TableHead>
                      <TableHead className="font-semibold">금액</TableHead>
                      <TableHead className="font-semibold">완료자 수</TableHead>
                      <TableHead className="text-right font-semibold">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklistItems.map((item) => {
                      const completedCount = participantChecks.filter(
                        check => check.checklistItemId === item.id && check.completed
                      ).length;
                      
                      return (
                        <TableRow key={item.id} className="border-b last:border-0">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge className={item.required ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                              {item.required ? "필수" : "선택"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.price ? `$${item.price} CAD` : "-"}
                          </TableCell>
                          <TableCell>
                            {completedCount}/{participants.length}명
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedChecklistEdit(item);
                                setChecklistForm({
                                  name: item.name,
                                  required: item.required,
                                  price: item.price?.toString() || "",
                                });
                                setIsChecklistDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (confirm("정말로 이 항목을 삭제하시겠습니까?")) {
                                  setChecklistItems(checklistItems.filter(i => i.id !== item.id));
                                  setParticipantChecks(participantChecks.filter(c => c.checklistItemId !== item.id));
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 팀 관리 탭 */}
        {program.features.includes("teams") && (
          <TabsContent value="teams" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">팀 관리</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsTeamSettingsDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  팀 설정
                </Button>
                <Button size="sm" onClick={() => {
                  setSelectedTeamEdit(null);
                  setTeamForm({ name: "", description: "", color: "#3B82F6" });
                  setIsTeamDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  팀 생성
                </Button>
              </div>
            </div>

            {/* 팀 목록 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const teamMembersList = teamMembers.filter(tm => tm.teamId === team.id);
                
                return (
                  <Card key={team.id} className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          ></div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedTeamEdit(team);
                            setTeamForm({
                              name: team.name,
                              description: team.description || "",
                              color: team.color,
                            });
                            setIsTeamDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm("정말로 이 팀을 삭제하시겠습니까?")) {
                              setTeams(teams.filter(t => t.id !== team.id));
                              setTeamMembers(teamMembers.filter(tm => tm.teamId !== team.id));
                            }
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {team.description && (
                        <p className="text-sm text-gray-600">{team.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            팀원 ({teamMembersList.length}명)
                          </p>
                          <div className="space-y-1">
                            {teamMembersList.map((member) => {
                              const participant = participants.find(p => p.id === member.participantId);
                              if (!participant) return null;
                              
                              const memberRole = teamRoles.find(role => role.id === member.roleId);
                              return (
                                <div key={member.participantId} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{participant.name}</span>
                                    {memberRole && (
                                      <Badge 
                                        style={{ backgroundColor: memberRole.color + '20', color: memberRole.color, borderColor: memberRole.color + '40' }}
                                        className="text-xs px-2 py-0.5"
                                      >
                                        {memberRole.name}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={member.roleId}
                                      onValueChange={(newRoleId) => {
                                        const newRole = teamRoles.find(role => role.id === newRoleId);
                                        
                                        // 역할 변경 (티어 제한 없음)
                                        
                                        // 역할 변경
                                        setTeamMembers(teamMembers.map(tm => 
                                          tm.participantId === member.participantId && tm.teamId === team.id
                                            ? { ...tm, roleId: newRoleId }
                                            : tm
                                        ));
                                      }}
                                    >
                                      <SelectTrigger className="h-6 text-xs w-20 border-0 p-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {teamRoles.map((role) => (
                                          <SelectItem key={role.id} value={role.id}>
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: role.color }}
                                              ></div>
                                              {role.name}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1"
                                      onClick={() => {
                                        if (confirm("이 팀원을 제거하시겠습니까?")) {
                                          setTeamMembers(teamMembers.filter(
                                            tm => !(tm.teamId === team.id && tm.participantId === member.participantId)
                                          ));
                                        }
                                      }}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 팀원 추가 폼 */}
                        <div className="pt-2 border-t space-y-2">
                          <div className="relative">
                            {/* 클릭 외부 영역 감지를 위한 오버레이 */}
                            {teamMemberAddState[team.id]?.open && (
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => 
                                  setTeamMemberAddState(prev => ({
                                    ...prev,
                                    [team.id]: { ...prev[team.id], open: false }
                                  }))
                                }
                              />
                            )}
                            <Command className="relative z-20 rounded-lg border shadow-md bg-white">
                              <CommandInput 
                                placeholder="참여자 검색하여 추가..." 
                                className="h-8 text-xs"
                                onFocus={() => 
                                  setTeamMemberAddState(prev => ({
                                    ...prev,
                                    [team.id]: { ...prev[team.id], open: true }
                                  }))
                                }
                              />
                              {teamMemberAddState[team.id]?.open && (
                                <CommandList className="max-h-32 overflow-auto bg-white border-t">
                                  <CommandEmpty>참여자를 찾을 수 없습니다.</CommandEmpty>
                                  <CommandGroup>
                                    {participants
                                      .filter(p => !teamMembersList.find(tm => tm.participantId === p.id))
                                      .map((participant) => (
                                        <CommandItem
                                          key={participant.id}
                                          value={participant.name}
                                          onSelect={() => {
                                            // 기본 역할을 "팀원"으로 설정 (팀원 역할 ID 찾기)
                                            const defaultRole = teamRoles.find(role => role.name === "팀원") || teamRoles[0];
                                            const newMember: TeamMember = {
                                              teamId: team.id,
                                              participantId: participant.id,
                                              roleId: defaultRole?.id || "",
                                              joinDate: format(new Date(), "yyyy-MM-dd"),
                                            };
                                            setTeamMembers([...teamMembers, newMember]);
                                            
                                            // 상태 초기화
                                            setTeamMemberAddState(prev => ({
                                              ...prev,
                                              [team.id]: { open: false, value: "" }
                                            }));
                                          }}
                                          className="cursor-pointer hover:bg-gray-50"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <div className="flex flex-col">
                                              <span className="text-sm font-medium">{participant.name}</span>
                                              <span className="text-xs text-gray-500">{participant.phone}</span>
                                            </div>
                                            <Plus className="h-3 w-3 text-green-600" />
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              )}
                            </Command>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 팀 없는 참여자 */}
            {participants.filter(p => !teamMembers.find(tm => tm.participantId === p.id)).length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">팀 미배정 참여자</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {participants
                      .filter(p => !teamMembers.find(tm => tm.participantId === p.id))
                      .map((participant) => (
                        <Badge key={participant.id} variant="secondary" className="px-3 py-1">
                          {participant.name}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          <h2 className="text-xl font-semibold">프로그램 설정</h2>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">활성화된 기능</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["participants", "finance", "calendar", "attendance", "checklist", "teams"].map((feature) => (
                <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {feature === "participants" && <Users className="h-5 w-5 text-blue-500" />}
                    {feature === "finance" && <DollarSign className="h-5 w-5 text-green-500" />}
                    {feature === "calendar" && <CalendarIcon className="h-5 w-5 text-purple-500" />}
                    {feature === "attendance" && <UserCheck className="h-5 w-5 text-orange-500" />}
                    {feature === "checklist" && <ClipboardList className="h-5 w-5 text-red-500" />}
                    {feature === "teams" && <Users className="h-5 w-5 text-indigo-500" />}
                    <div>
                      <p className="font-medium">
                        {feature === "participants" && "참여자 관리"}
                        {feature === "finance" && "재정 관리"}
                        {feature === "calendar" && "일정 관리"}
                        {feature === "attendance" && "출석 관리"}
                        {feature === "checklist" && "확인사항 관리"}
                        {feature === "teams" && "팀 관리"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {feature === "participants" && "참가자 등록 및 관리"}
                        {feature === "finance" && "수입/지출 관리"}
                        {feature === "calendar" && "일정 및 모임 관리"}
                        {feature === "attendance" && "출석 체크 및 통계"}
                        {feature === "checklist" && "회비, 단체티 등 확인사항 추적"}
                        {feature === "teams" && "팀 구성 및 팀원 관리"}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={program.features.includes(feature) 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {program.features.includes(feature) ? "활성화" : "비활성화"}
                  </Badge>
                </div>
              ))}
              <Button className="w-full mt-6">설정 저장</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 거래 추가/편집 다이얼로그 */}
      <Dialog open={isFinanceDialogOpen} onOpenChange={setIsFinanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFinanceRecord ? "거래 편집" : "새 거래 추가"}</DialogTitle>
            <DialogDescription>
              재정 거래 정보를 {selectedFinanceRecord ? "수정" : "입력"}하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type">구분</Label>
                <Select value={financeForm.type} onValueChange={(value: "수입" | "지출") => setFinanceForm({ ...financeForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="수입">수입</SelectItem>
                    <SelectItem value="지출">지출</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !financeForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {financeForm.date ? format(new Date(financeForm.date), "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={financeForm.date ? new Date(financeForm.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFinanceForm({ ...financeForm, date: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select value={financeForm.category} onValueChange={(value) => setFinanceForm({ ...financeForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplier">공급자</Label>
                <Select value={financeForm.supplier} onValueChange={(value) => setFinanceForm({ ...financeForm, supplier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="공급자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="amount">금액 (CAD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={financeForm.amount}
                onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={financeForm.name}
                onChange={(e) => setFinanceForm({ ...financeForm, name: e.target.value })}
                placeholder="담당자 이름"
              />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={financeForm.description}
                onChange={(e) => setFinanceForm({ ...financeForm, description: e.target.value })}
                placeholder="거래에 대한 상세 설명"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinanceDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveFinance}>
              {selectedFinanceRecord ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 관리 다이얼로그 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>카테고리 관리</DialogTitle>
            <DialogDescription>
              재정 카테고리를 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="새 카테고리 이름"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                className="flex-1"
              />
              <Button onClick={handleSaveCategory}>
                {selectedCategoryEdit ? "수정" : "추가"}
              </Button>
              {selectedCategoryEdit && (
                <Button variant="outline" onClick={() => {
                  setSelectedCategoryEdit(null);
                  setCategoryForm({ name: "" });
                }}>
                  취소
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>카테고리명</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공급자 관리 다이얼로그 */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>공급자 관리</DialogTitle>
            <DialogDescription>
              공급자를 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="공급자 이름"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="연락처"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                className="flex-1"
              />
              <Button onClick={handleSaveSupplier}>
                {selectedSupplierEdit ? "수정" : "추가"}
              </Button>
              {selectedSupplierEdit && (
                <Button variant="outline" onClick={() => {
                  setSelectedSupplierEdit(null);
                  setSupplierForm({ name: "", contact: "" });
                }}>
                  취소
                </Button>
              )}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>공급자명</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-gray-600">{supplier.contact || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSupplier(supplier)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSupplier(supplier.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 확인사항 관리 다이얼로그 */}
      <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedChecklistEdit ? "확인사항 편집" : "새 확인사항 추가"}</DialogTitle>
            <DialogDescription>
              참여자들이 확인해야 할 사항을 {selectedChecklistEdit ? "수정" : "추가"}하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checklist-name">항목명</Label>
              <Input
                id="checklist-name"
                value={checklistForm.name}
                onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })}
                placeholder="예: 회비 납부, 단체 티셔츠 구매"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={checklistForm.required}
                  onChange={(e) => setChecklistForm({ ...checklistForm, required: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="required" className="text-sm">필수 항목</Label>
              </div>
              <div>
                <Label htmlFor="price">금액 (CAD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={checklistForm.price}
                  onChange={(e) => setChecklistForm({ ...checklistForm, price: e.target.value })}
                  placeholder="선택사항"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChecklistDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => {
              if (selectedChecklistEdit) {
                // 편집
                setChecklistItems(checklistItems.map(item => 
                  item.id === selectedChecklistEdit.id 
                    ? { 
                        ...selectedChecklistEdit, 
                        name: checklistForm.name,
                        required: checklistForm.required,
                        price: checklistForm.price ? parseFloat(checklistForm.price) : undefined
                      }
                    : item
                ));
              } else {
                // 새 항목 추가
                const newItem: ChecklistItem = {
                  id: Date.now().toString(),
                  name: checklistForm.name,
                  required: checklistForm.required,
                  price: checklistForm.price ? parseFloat(checklistForm.price) : undefined,
                };
                setChecklistItems([...checklistItems, newItem]);
              }
              setIsChecklistDialogOpen(false);
            }}>
              {selectedChecklistEdit ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 관리 다이얼로그 */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTeamEdit ? "팀 편집" : "새 팀 생성"}</DialogTitle>
            <DialogDescription>
              팀 정보를 {selectedTeamEdit ? "수정" : "입력"}하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">팀명</Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="예: 알파팀, 베타팀"
              />
            </div>
            <div>
              <Label htmlFor="team-description">설명</Label>
              <Textarea
                id="team-description"
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                placeholder="팀에 대한 간단한 설명"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="team-color">팀 색상</Label>
                <Input
                  id="team-color"
                  type="color"
                  value={teamForm.color}
                  onChange={(e) => setTeamForm({ ...teamForm, color: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => {
              // 필수 필드 검증
              if (!teamForm.name.trim()) {
                alert("팀명을 입력해주세요.");
                return;
              }

              try {
                if (selectedTeamEdit) {
                  // 편집
                  setTeams(teams.map(team => 
                    team.id === selectedTeamEdit.id 
                      ? { 
                          ...selectedTeamEdit, 
                          name: teamForm.name.trim(),
                          description: teamForm.description.trim(),
                          color: teamForm.color
                        }
                      : team
                  ));
                  
                } else {
                  // 새 팀 추가
                  const newTeam: Team = {
                    id: Date.now().toString(),
                    name: teamForm.name.trim(),
                    description: teamForm.description.trim(),
                    color: teamForm.color,
                  };
                  setTeams(prevTeams => [...prevTeams, newTeam]);
                }
                
                // 다이얼로그 닫기 및 폼 초기화
                setIsTeamDialogOpen(false);
                setSelectedTeamEdit(null);
                setTeamForm({ name: "", description: "", color: "#3B82F6" });
              } catch (error) {
                console.error("팀 저장 중 오류:", error);
                alert("팀 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
              }
            }}>
              {selectedTeamEdit ? "수정" : "생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일정 추가/편집 다이얼로그 */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? "일정 편집" : "새 일정 추가"}</DialogTitle>
            <DialogDescription>
              프로그램 일정을 {selectedEvent ? "수정" : "추가"}하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="일정 제목을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="date">날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventForm.date ? format(new Date(eventForm.date), "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventForm.date ? new Date(eventForm.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEventForm({ ...eventForm, date: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="startTime">시작 시간</Label>
                <Select value={eventForm.startTime} onValueChange={(value) => setEventForm({ ...eventForm, startTime: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="시작 시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground mb-1">일반적인 시간</div>
                      <div className="grid grid-cols-2 gap-1">
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="19:00">7:00 PM</SelectItem>
                        <SelectItem value="20:00">8:00 PM</SelectItem>
                      </div>
                    </div>
                    {generateTimeOptions().map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endTime">종료 시간</Label>
                <Select value={eventForm.endTime} onValueChange={(value) => setEventForm({ ...eventForm, endTime: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="종료 시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground mb-1">일반적인 시간</div>
                      <div className="grid grid-cols-2 gap-1">
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="13:00">1:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                        <SelectItem value="22:00">10:00 PM</SelectItem>
                      </div>
                    </div>
                    {generateTimeOptions().map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="모임 장소를 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="type">유형</Label>
                <Select value={eventForm.type} onValueChange={(value) => setEventForm({ ...eventForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          ></div>
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="team">담당 팀</Label>
                <Select value={eventForm.teamId || "all"} onValueChange={(value) => setEventForm({ ...eventForm, teamId: value === "all" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          ></div>
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="일정에 대한 추가 설명"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveEvent}>
              {selectedEvent ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일정 유형 설정 다이얼로그 */}
      <Dialog open={isEventTypeDialogOpen} onOpenChange={setIsEventTypeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>일정 유형 설정</DialogTitle>
            <DialogDescription>
              일정 유형을 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 유형 추가 폼 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="eventtype-name">유형명</Label>
                  <Input
                    id="eventtype-name"
                    placeholder="예: 정기 모임, 특별 행사, 회의 등"
                    value={eventTypeForm.name}
                    onChange={(e) => setEventTypeForm({ ...eventTypeForm, name: e.target.value })}
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="eventtype-color">색상</Label>
                  <Input
                    id="eventtype-color"
                    type="color"
                    value={eventTypeForm.color}
                    onChange={(e) => setEventTypeForm({ ...eventTypeForm, color: e.target.value })}
                  />
                </div>
                <Button onClick={() => {
                  if (!eventTypeForm.name.trim()) {
                    alert("유형명을 입력해주세요.");
                    return;
                  }

                  if (selectedEventTypeEdit) {
                    // 수정
                    setEventTypes(eventTypes.map(type => 
                      type.id === selectedEventTypeEdit.id 
                        ? { 
                            ...selectedEventTypeEdit, 
                            name: eventTypeForm.name.trim(),
                            color: eventTypeForm.color
                          }
                        : type
                    ));
                  } else {
                    // 새 유형 추가
                    const newEventType: EventType = {
                      id: Date.now().toString(),
                      name: eventTypeForm.name.trim(),
                      color: eventTypeForm.color,
                      order: eventTypes.length + 1,
                    };
                    setEventTypes([...eventTypes, newEventType]);
                  }

                  setEventTypeForm({ name: "", color: "#3B82F6" });
                  setSelectedEventTypeEdit(null);
                }}>
                  {selectedEventTypeEdit ? "수정" : "추가"}
                </Button>
                {selectedEventTypeEdit && (
                  <Button variant="outline" onClick={() => {
                    setSelectedEventTypeEdit(null);
                    setEventTypeForm({ name: "", color: "#3B82F6" });
                  }}>
                    취소
                  </Button>
                )}
              </div>
            </div>

            {/* 유형 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">현재 유형 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>유형명</TableHead>
                      <TableHead>색상</TableHead>
                      <TableHead>사용 중인 일정</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventTypes.sort((a, b) => a.order - b.order).map((type) => {
                      const eventsWithType = events.filter(event => event.type === type.id);
                      return (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">{type.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: type.color }}
                              ></div>
                              <span className="text-sm text-gray-500">{type.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{eventsWithType.length}개</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedEventTypeEdit(type);
                                setEventTypeForm({
                                  name: type.name,
                                  color: type.color,
                                });
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (eventsWithType.length > 0) {
                                  alert(`이 유형을 사용 중인 일정이 ${eventsWithType.length}개 있습니다. 먼저 해당 일정들의 유형을 변경해주세요.`);
                                  return;
                                }
                                if (confirm("정말로 이 유형을 삭제하시겠습니까?")) {
                                  setEventTypes(eventTypes.filter(t => t.id !== type.id));
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEventTypeDialogOpen(false);
              setSelectedEventTypeEdit(null);
              setEventTypeForm({ name: "", color: "#3B82F6" });
            }}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 설정 다이얼로그 */}
      <Dialog open={isTeamSettingsDialogOpen} onOpenChange={setIsTeamSettingsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>팀 설정</DialogTitle>
            <DialogDescription>
              팀 역할을 관리하세요. 팀장, 부팀장, 인도자 등 다양한 역할을 추가, 수정, 삭제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 역할 추가 폼 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="role-name">역할명</Label>
                  <Input
                    id="role-name"
                    placeholder="예: 인도자, 찬양팀장, 서기 등"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="role-color">색상</Label>
                  <Input
                    id="role-color"
                    type="color"
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  />
                </div>
                <div className="w-24">
                  <Label htmlFor="role-tier">티어</Label>
                  <Select value={roleForm.tier?.toString() || "2"} onValueChange={(value) => setRoleForm({ ...roleForm, tier: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (최고)</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5 (최하)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => {
                  if (!roleForm.name.trim()) {
                    alert("역할명을 입력해주세요.");
                    return;
                  }

                  const tier = roleForm.tier ?? 2; // tier가 undefined면 기본값 2 사용

                  if (selectedRoleEdit) {
                    // 수정
                    setTeamRoles(teamRoles.map(role => 
                      role.id === selectedRoleEdit.id 
                        ? { 
                            ...selectedRoleEdit, 
                            name: roleForm.name.trim(),
                            tier: tier,
                            color: roleForm.color
                          }
                        : role
                    ));
                  } else {
                    // 새 역할 추가
                    const newRole: TeamRole = {
                      id: Date.now().toString(),
                      name: roleForm.name.trim(),
                      tier: tier,
                      color: roleForm.color,
                      order: teamRoles.length + 1,
                    };
                    setTeamRoles([...teamRoles, newRole]);
                  }

                  setRoleForm({ name: "", tier: 2, color: "#3B82F6" });
                  setSelectedRoleEdit(null);
                }}>
                  {selectedRoleEdit ? "수정" : "추가"}
                </Button>
                {selectedRoleEdit && (
                  <Button variant="outline" onClick={() => {
                    setSelectedRoleEdit(null);
                    setRoleForm({ name: "", tier: 2, color: "#3B82F6" });
                  }}>
                    취소
                  </Button>
                )}
              </div>
            </div>

            {/* 역할 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">현재 역할 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>역할명</TableHead>
                      <TableHead>색상</TableHead>
                      <TableHead>구분</TableHead>
                      <TableHead>사용 중인 팀원</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamRoles.sort((a, b) => a.order - b.order).map((role) => {
                      const membersWithRole = teamMembers.filter(member => member.roleId === role.id);
                      return (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border" 
                                style={{ backgroundColor: role.color }}
                              ></div>
                              <span className="text-sm text-gray-500">{role.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                role.tier === 0 
                                  ? "bg-red-100 text-red-800 border-red-200" 
                                  : role.tier === 1 
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                              }`}
                            >
                              티어 {role.tier}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{membersWithRole.length}명</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedRoleEdit(role);
                                setRoleForm({
                                  name: role.name,
                                  tier: role.tier,
                                  color: role.color,
                                });
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (membersWithRole.length > 0) {
                                  alert(`이 역할을 사용 중인 팀원이 ${membersWithRole.length}명 있습니다. 먼저 팀원들의 역할을 변경해주세요.`);
                                  return;
                                }
                                if (confirm("정말로 이 역할을 삭제하시겠습니까?")) {
                                  setTeamRoles(teamRoles.filter(r => r.id !== role.id));
                                }
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsTeamSettingsDialogOpen(false);
              setSelectedRoleEdit(null);
              setRoleForm({ name: "", tier: 2, color: "#3B82F6" });
            }}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 출석 체크 다이얼로그 */}
      <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>출석 체크</DialogTitle>
            <DialogDescription>
              새로운 출석 세션을 생성하고 참여자들의 출석을 체크하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="attendanceTitle">세션명</Label>
                <Input
                  id="attendanceTitle"
                  value={attendanceForm.title}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, title: e.target.value })}
                  placeholder="예: 1주차 모임"
                />
              </div>
              <div>
                <Label htmlFor="attendanceDate">날짜</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !attendanceForm.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {attendanceForm.date ? format(new Date(attendanceForm.date), "MM/dd", { locale: ko }) : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={attendanceForm.date ? new Date(attendanceForm.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setAttendanceForm({ ...attendanceForm, date: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="attendanceTime">시간</Label>
                <Select value={attendanceForm.time} onValueChange={(value) => setAttendanceForm({ ...attendanceForm, time: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="시간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b">
                      <div className="text-xs font-medium text-muted-foreground mb-1">일반적인 시간</div>
                      <div className="grid grid-cols-3 gap-1">
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="19:00">7:00 PM</SelectItem>
                        <SelectItem value="20:00">8:00 PM</SelectItem>
                        <SelectItem value="21:00">9:00 PM</SelectItem>
                      </div>
                    </div>
                    {generateTimeOptions().map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="attendanceEvent">관련 일정 (선택사항)</Label>
              <Select value={attendanceForm.eventId || "none"} onValueChange={(value) => setAttendanceForm({ ...attendanceForm, eventId: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="관련 일정을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} ({format(new Date(event.date), "MM/dd")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>참여자 출석 체크</Label>
              <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                <div className="grid gap-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {participant.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-gray-500">{participant.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={currentAttendanceData[participant.id] === "출석" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAttendanceStatusChange(participant.id, "출석")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          출석
                        </Button>
                        <Button
                          variant={currentAttendanceData[participant.id] === "지각" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAttendanceStatusChange(participant.id, "지각")}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          지각
                        </Button>
                        <Button
                          variant={currentAttendanceData[participant.id] === "결석" ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleAttendanceStatusChange(participant.id, "결석")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          결석
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>총 참여자: {participants.length}명</span>
                <div className="flex gap-4">
                  <span className="text-green-600">출석: {Object.values(currentAttendanceData).filter(s => s === "출석").length}명</span>
                  <span className="text-yellow-600">지각: {Object.values(currentAttendanceData).filter(s => s === "지각").length}명</span>
                  <span className="text-red-600">결석: {Object.values(currentAttendanceData).filter(s => s === "결석").length}명</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveAttendance}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}