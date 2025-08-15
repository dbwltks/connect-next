"use client";

import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';

// 확장된 Finance 타입 정의
interface ExtendedFinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  vendor?: string;
  itemName?: string;
  amount: number;
  paidBy?: string;
  description?: string;
  date?: string;
  datetime?: string;
  program_id?: string;
  isActual?: boolean;
  created_at?: string;
  updated_at?: string;
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Filter,
  Settings,
  Download,
  CalendarDays,
  Columns,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

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
  isActual?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FinanceTabProps {
  programId: string;
  hasEditPermission?: boolean;
}

export default function FinanceTab({
  programId,
  hasEditPermission = false,
}: FinanceTabProps) {
  // 반응형 디바이스 체크 (768px = md breakpoint)
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [finances, setFinances] = useState<FinanceRecord[]>([]);

  // 재정 추가 모달 상태
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);

  // 재정 삭제 확인 다이얼로그 상태
  const [financeDeleteConfirmOpen, setFinanceDeleteConfirmOpen] =
    useState(false);
  const [financeToDeleteConfirm, setFinanceToDeleteConfirm] = useState<
    string | null
  >(null);
  const [newFinance, setNewFinance] = useState({
    type: "income" as "income" | "expense",
    category: "",
    vendor: "",
    itemName: "",
    amount: "",
    paidBy: "",
    description: "",
    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    isActual: true,
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

  // 순서 편집 모드 상태
  const [isOrderEditMode, setIsOrderEditMode] = useState(false);

  // 카테고리 순서 변경 함수
  const moveCategoryUp = async (index: number) => {
    if (index === 0) return;
    const newCategories = [...financeCategories];
    [newCategories[index - 1], newCategories[index]] = [
      newCategories[index],
      newCategories[index - 1],
    ];
    await updateFinanceSettings({ categories: newCategories });
    setFinanceCategories(newCategories);
  };

  const moveCategoryDown = async (index: number) => {
    if (index === financeCategories.length - 1) return;
    const newCategories = [...financeCategories];
    [newCategories[index], newCategories[index + 1]] = [
      newCategories[index + 1],
      newCategories[index],
    ];
    await updateFinanceSettings({ categories: newCategories });
    setFinanceCategories(newCategories);
  };

  // 거래처 순서 변경 함수
  const moveVendorUp = async (index: number) => {
    if (index === 0) return;
    const newVendors = [...financeVendors];
    [newVendors[index - 1], newVendors[index]] = [
      newVendors[index],
      newVendors[index - 1],
    ];
    await updateFinanceSettings({ vendors: newVendors });
    setFinanceVendors(newVendors);
  };

  const moveVendorDown = async (index: number) => {
    if (index === financeVendors.length - 1) return;
    const newVendors = [...financeVendors];
    [newVendors[index], newVendors[index + 1]] = [
      newVendors[index + 1],
      newVendors[index],
    ];
    await updateFinanceSettings({ vendors: newVendors });
    setFinanceVendors(newVendors);
  };

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
    types: [] as string[], // 다중 선택
    categories: [] as string[], // 다중 선택
    vendors: [] as string[], // 다중 선택
    paidBys: [] as string[], // 다중 선택
    actualStatus: "all" as "all" | "actual" | "expected", // 실제/예상 구분
  });

  // 필터 모달 상태
  const [isFinanceFilterModalOpen, setIsFinanceFilterModalOpen] =
    useState(false);

  // 캘린더 팝오버 상태
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Alert 상태
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Alert 표시 함수
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  // 활성 필터 개수 계산
  const getActiveFiltersCount = () => {
    let count = 0;
    if (financeFilters.dateRange !== "all") count++;
    if (financeFilters.types.length > 0) count++;
    if (financeFilters.categories.length > 0) count++;
    if (financeFilters.vendors.length > 0) count++;
    if (financeFilters.paidBys.length > 0) count++;
    if (financeFilters.actualStatus !== "all") count++;
    return count;
  };

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    // 로컬 스토리지에서 저장된 값 불러오기
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("finance-items-per-page");
      return saved ? parseInt(saved) : 10;
    }
    return 10;
  });

  // 선택된 재정 행 상태
  const [selectedFinanceId, setSelectedFinanceId] = useState<string | null>(
    null
  );
  const [isFinanceActionDialogOpen, setIsFinanceActionDialogOpen] =
    useState(false);
  const [selectedFinanceForAction, setSelectedFinanceForAction] =
    useState<any>(null);

  // 컬럼 표시 상태
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    type: true,
    category: true,
    vendor: true,
    itemName: true,
    paidBy: true,
    amount: true,
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // 정렬 상태
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 정렬 함수
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 정렬 아이콘 렌더링 함수
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  // 화면 크기 변화 감지하여 모바일에서 자동으로 컬럼 숨기기
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640; // sm breakpoint
      if (isMobile) {
        setVisibleColumns((prev) => ({
          ...prev,
          category: false,
          vendor: false,
          paidBy: false,
        }));
      }
    };

    // 초기 실행
    handleResize();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener("resize", handleResize);

    // 클린업
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 엑셀 내보내기 함수
  const exportToExcel = () => {
    if (filteredFinances.length === 0) {
      showAlert("내보내기 오류", "내보낼 데이터가 없습니다.");
      return;
    }

    // 엑셀용 데이터 변환
    const excelData = filteredFinances.map((finance, index) => {
      const amount = typeof finance.amount === 'number' ? finance.amount : parseFloat(finance.amount) || 0;
      return {
        '번호': index + 1,
        '거래 유형': finance.type === 'income' ? '수입' : '지출',
        '카테고리': finance.category || '',
        '거래처': finance.vendor || '',
        '항목명': finance.itemName || '',
        '금액': finance.type === 'expense' ? -amount : amount,
        '거래자': finance.paidBy || '',
        '설명': finance.description || '',
        '거래 일시': finance.datetime ? new Date(finance.datetime).toLocaleString('ko-KR') : '',
        '실제/예상': finance.isActual === false ? '예상/계획' : '실제',
        '등록일': finance.created_at ? new Date(finance.created_at).toLocaleString('ko-KR') : ''
      };
    });

    // 요약 통계 추가 (지출은 마이너스로 표시)
    const summaryData = [
      { '항목': '총 수입', '실제': actualIncome, '예상': plannedIncome, '합계': totalIncome },
      { '항목': '총 지출', '실제': -actualExpense, '예상': -plannedExpense, '합계': -totalExpense },
      { '항목': '잔액', '실제': actualBalance, '예상': plannedBalance, '합계': balance },
      { '항목': '현금 수입', '실제': actualCashIncome, '예상': plannedCashIncome, '합계': totalCashIncome },
      { '항목': '현금 지출', '실제': -actualCashExpense, '예상': -plannedCashExpense, '합계': -totalCashExpense },
      { '항목': '현금 잔액', '실제': actualCashIncome - actualCashExpense, '예상': plannedCashIncome - plannedCashExpense, '합계': totalCashBalance }
    ];

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 거래 내역 시트
    const ws1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws1, "거래내역");
    
    // 요약 통계 시트
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, "요약통계");

    // 파일명 생성 (재정데이터_프로그램ID_날짜)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const filename = `재정데이터_${programId}_${dateStr}.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(wb, filename);
    
    showAlert("내보내기 완료", `${excelData.length}건의 데이터를 성공적으로 내보냈습니다.`);
  };

  // 데이터 새로고침 함수
  const refreshData = async () => {
    if (!programId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", programId)
        .single();

      if (error) {
        console.error("프로그램 데이터 로드 오류:", error);
      } else {
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
      console.error("데이터 새로고침 실패:", error);
    }
  };

  // 데이터 로드
  useEffect(() => {
    const loadProgramData = async () => {
      if (!programId) {
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
        } else {
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
        setFinances([]);
      }
    };

    loadProgramData();
  }, [programId]);

  // 재정 필터링
  const filteredFinances: ExtendedFinanceRecord[] = finances.filter((finance) => {
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

    // 타입 필터 (다중 선택)
    if (
      financeFilters.types.length > 0 &&
      !financeFilters.types.includes(finance.type)
    ) {
      return false;
    }

    // 카테고리 필터 (다중 선택)
    if (
      financeFilters.categories.length > 0 &&
      !financeFilters.categories.includes(finance.category)
    ) {
      return false;
    }

    // 거래처 필터 (다중 선택)
    if (
      financeFilters.vendors.length > 0 &&
      finance.vendor &&
      !financeFilters.vendors.includes(finance.vendor)
    ) {
      return false;
    }

    // 거래자 필터 (다중 선택)
    if (
      financeFilters.paidBys.length > 0 &&
      finance.paidBy &&
      !financeFilters.paidBys.includes(finance.paidBy)
    ) {
      return false;
    }

    // 실제/예상 필터
    if (financeFilters.actualStatus !== "all") {
      if (financeFilters.actualStatus === "actual" && !finance.isActual) {
        return false;
      }
      if (financeFilters.actualStatus === "expected" && finance.isActual) {
        return false;
      }
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
      // 사용자가 선택한 필드로 정렬
      if (sortField) {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "date":
            aValue = new Date(a.datetime || a.date || 0).getTime();
            bValue = new Date(b.datetime || b.date || 0).getTime();
            break;
          case "type":
            aValue = a.type;
            bValue = b.type;
            break;
          case "category":
            aValue = a.category || "";
            bValue = b.category || "";
            break;
          case "vendor":
            aValue = a.vendor || "";
            bValue = b.vendor || "";
            break;
          case "itemName":
            aValue = a.itemName || "";
            bValue = b.itemName || "";
            break;
          case "paidBy":
            aValue = a.paidBy || "";
            bValue = b.paidBy || "";
            break;
          case "amount":
            aValue = a.amount || 0;
            bValue = b.amount || 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const result = aValue.localeCompare(bValue);
          return sortDirection === "asc" ? result : -result;
        } else {
          const result = aValue - bValue;
          return sortDirection === "asc" ? result : -result;
        }
      } else {
        // 기본 정렬: datetime으로 내림차순
        const aDateTime = new Date(a.datetime || a.date || 0);
        const bDateTime = new Date(b.datetime || b.date || 0);
        return bDateTime.getTime() - aDateTime.getTime();
      }
    })
    .slice(startIndex, endIndex);

  // 누적 잔액 계산 (날짜순으로 정렬된 전체 데이터 기준)
  const sortedAllFinances = [...filteredFinances].sort((a, b) => {
    if (sortField === "datetime" || !sortField) {
      const aDateTime = new Date(a.datetime || a.date || 0);
      const bDateTime = new Date(b.datetime || b.date || 0);
      return aDateTime.getTime() - bDateTime.getTime(); // 오래된 순으로 정렬
    }
    return 0;
  });

  // 누적 잔액 맵 생성
  const runningBalanceMap = new Map<string, number>();
  let runningBalance = 0;
  
  sortedAllFinances.forEach((finance) => {
    const amount = typeof finance.amount === 'number' ? finance.amount : parseFloat(finance.amount) || 0;
    if (finance.type === 'income') {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }
    runningBalanceMap.set(finance.id, runningBalance);
  });

  // 필터 변경 시 페이지 리셋
  const resetPageAndSetFilter = (filterUpdate: any) => {
    setCurrentPage(1);
    setFinanceFilters((prev) => ({ ...prev, ...filterUpdate }));
  };

  // 재정 통계 계산 (디버깅용 로그 추가)
  if (process.env.NODE_ENV === 'development' && filteredFinances.length > 0) {
    console.log('🔍 Finance Debug Info:', {
      totalRecords: filteredFinances.length,
      sampleRecord: filteredFinances[0],
      isActualValues: filteredFinances.map(f => ({ id: f.id, isActual: f.isActual, type: f.isActual?.constructor?.name })),
      vendorValues: filteredFinances.map(f => ({ id: f.id, vendor: f.vendor })),
      undefinedIsActualCount: filteredFinances.filter(f => f.isActual === undefined).length
    });
  }

  // isActual이 undefined인 기존 데이터는 실제 거래로 간주 (하위 호환성)
  const normalizedFinances = filteredFinances.map(f => ({
    ...f,
    isActual: f.isActual === undefined ? true : f.isActual
  }));

  const totalIncome = normalizedFinances
    .filter((f) => f.type === "income")
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const totalExpense = normalizedFinances
    .filter((f) => f.type === "expense")
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  // 실제/예상별 통계 계산 (수정된 로직 - 타입 안전성 보장)
  const actualIncome = normalizedFinances
    .filter((f) => f.type === "income" && f.isActual === true)
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const plannedIncome = normalizedFinances
    .filter((f) => f.type === "income" && f.isActual === false)
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const actualExpense = normalizedFinances
    .filter((f) => f.type === "expense" && f.isActual === true)
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const plannedExpense = normalizedFinances
    .filter((f) => f.type === "expense" && f.isActual === false)
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);

  // 실제/예상별 잔액 계산
  const actualBalance = actualIncome - actualExpense;
  const plannedBalance = plannedIncome - plannedExpense;

  // 실제/예상별 현금 거래 계산 (수정된 로직)
  const actualCashIncome = normalizedFinances
    .filter(
      (f) =>
        f.type === "income" &&
        f.isActual === true &&
        f.vendor &&
        (f.vendor.includes("현금") || f.vendor.toLowerCase().includes("cash"))
    )
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const plannedCashIncome = normalizedFinances
    .filter(
      (f) =>
        f.type === "income" &&
        f.isActual === false &&
        f.vendor &&
        (f.vendor.includes("현금") || f.vendor.toLowerCase().includes("cash"))
    )
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const actualCashExpense = normalizedFinances
    .filter(
      (f) =>
        f.type === "expense" &&
        f.isActual === true &&
        f.vendor &&
        (f.vendor.includes("현금") || f.vendor.toLowerCase().includes("cash"))
    )
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);
  const plannedCashExpense = normalizedFinances
    .filter(
      (f) =>
        f.type === "expense" &&
        f.isActual === false &&
        f.vendor &&
        (f.vendor.includes("현금") || f.vendor.toLowerCase().includes("cash"))
    )
    .reduce((acc, f) => acc + (typeof f.amount === 'number' ? f.amount : parseFloat(f.amount) || 0), 0);

  // 총 현금 계산
  const totalCashIncome = actualCashIncome + plannedCashIncome;
  const totalCashExpense = actualCashExpense + plannedCashExpense;
  const totalCashBalance = totalCashIncome - totalCashExpense;

  // 실제/예상별 비현금 계산
  const actualNonCashIncome = actualIncome - actualCashIncome;
  const plannedNonCashIncome = plannedIncome - plannedCashIncome;
  const actualNonCashExpense = actualExpense - actualCashExpense;
  const plannedNonCashExpense = plannedExpense - plannedCashExpense;

  // 총 비현금 계산
  const totalNonCashIncome = actualNonCashIncome + plannedNonCashIncome;
  const totalNonCashExpense = actualNonCashExpense + plannedNonCashExpense;
  const totalNonCashBalance = totalNonCashIncome - totalNonCashExpense;

  // 개발 환경에서 계산 결과 검증
  if (process.env.NODE_ENV === 'development' && filteredFinances.length > 0) {
    const dataIntegrityIssues = normalizedFinances.filter(f => 
      typeof f.amount !== 'number' || isNaN(f.amount) || f.amount < 0
    );
    
    console.log('💰 Finance Calculations:', {
      totals: {
        totalIncome,
        totalExpense,
        balance
      },
      actualVsPlanned: {
        actualIncome,
        plannedIncome,
        actualExpense,
        plannedExpense,
        actualBalance,
        plannedBalance
      },
      cashBreakdown: {
        actualCashIncome,
        plannedCashIncome,
        actualCashExpense,
        plannedCashExpense,
        totalCashBalance
      },
      verification: {
        totalIncomeCheck: actualIncome + plannedIncome,
        totalExpenseCheck: actualExpense + plannedExpense,
        balanceCheck: (actualIncome + plannedIncome) - (actualExpense + plannedExpense),
        matchesTotalIncome: Math.abs(totalIncome - (actualIncome + plannedIncome)) < 0.01,
        matchesTotalExpense: Math.abs(totalExpense - (actualExpense + plannedExpense)) < 0.01
      },
      dataIntegrity: {
        invalidAmounts: dataIntegrityIssues.length,
        issues: dataIntegrityIssues.map(f => ({ id: f.id, amount: f.amount, type: typeof f.amount }))
      }
    });
  }

  // 재정 데이터 추가 함수
  const handleAddFinance = async () => {
    if (!programId || !newFinance.amount || !newFinance.category) {
      showAlert("입력 오류", "필수 항목을 모두 입력해주세요.");
      return;
    }

    // 중복 클릭 방지
    if (isSubmittingFinance) {
      return;
    }

    setIsSubmittingFinance(true);
    try {
      const supabase = createClient();

      // 현재 프로그램의 재정 데이터 가져오기
      const { data: programData, error: fetchError } = await supabase
        .from("programs")
        .select("finances")
        .eq("id", programId)
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
              isActual: newFinance.isActual,
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
          isActual: newFinance.isActual,
          created_at: new Date().toISOString(),
        };
        updatedFinances = [...currentFinances, newFinanceRecord];
      }

      // programs 테이블의 finances 필드 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ finances: updatedFinances })
        .eq("id", programId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setFinances(updatedFinances);

      const isEdit = !!editingFinance;

      // 폼 초기화
      setNewFinance({
        type: "income",
        category: "",
        vendor: "",
        itemName: "",
        amount: "",
        paidBy: "",
        description: "",
        datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        isActual: true,
      });
      setEditingFinance(null);

      setIsFinanceModalOpen(false);

      // 데이터 새로고침
      await refreshData();

      showAlert(
        isEdit ? "수정 완료" : "추가 완료",
        isEdit
          ? "재정 데이터가 수정되었습니다."
          : "재정 데이터가 추가되었습니다."
      );
    } catch (error) {
      console.error("재정 처리 실패:", error);
      showAlert("처리 실패", "재정 처리에 실패했습니다.");
    } finally {
      setIsSubmittingFinance(false);
    }
  };

  // finance_settings 업데이트 함수
  const updateFinanceSettings = async (updates: any) => {
    if (!programId) return;

    try {
      const supabase = createClient();

      // 현재 finance_settings 가져오기
      const { data: currentData, error: fetchError } = await supabase
        .from("programs")
        .select("finance_settings")
        .eq("id", programId)
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
        .eq("id", programId);

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
    if (!programId) {
      return;
    }

    // 삭제 확인 다이얼로그 표시
    setFinanceToDeleteConfirm(financeId);
    setFinanceDeleteConfirmOpen(true);
    return;
  };

  // 재정 삭제 확인 후 실행
  const confirmDeleteFinance = async () => {
    if (!financeToDeleteConfirm || !programId) return;

    try {
      const supabase = createClient();

      // 현재 프로그램의 재정 데이터 가져오기
      const { data: programData, error: fetchError } = await supabase
        .from("programs")
        .select("finances")
        .eq("id", programId)
        .single();

      if (fetchError) throw fetchError;

      const currentFinances = Array.isArray(programData?.finances)
        ? programData.finances
        : [];

      const updatedFinances = currentFinances.filter(
        (f: any) => f.id !== financeToDeleteConfirm
      );

      // programs 테이블의 finances 필드 업데이트
      const { error } = await supabase
        .from("programs")
        .update({ finances: updatedFinances })
        .eq("id", programId);

      if (error) throw error;

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
      datetime: finance.datetime 
        ? (finance.datetime.length === 16 ? finance.datetime + ":00" : finance.datetime)
        : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      isActual: finance.isActual !== undefined ? finance.isActual : true,
    });
    setIsFinanceModalOpen(true);
  };

  // 재정 행 클릭 핸들러
  const handleFinanceRowClick = (finance: any) => {
    setSelectedFinanceForAction(finance);
    setIsFinanceActionDialogOpen(true);
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

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">총 수입</div>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString()} CAD
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">
                  실제: ${actualIncome.toLocaleString()}
                </span>
                <span className="text-orange-600">
                  예상: ${plannedIncome.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>현금: ${totalCashIncome.toLocaleString()}</span>
                  <span>비현금: ${totalNonCashIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    실제 ${actualCashIncome.toLocaleString()} / 예상 $
                    {plannedCashIncome.toLocaleString()}
                  </span>
                  <span>
                    실제 ${actualNonCashIncome.toLocaleString()} / 예상 $
                    {plannedNonCashIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">총 지출</div>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpense.toLocaleString()} CAD
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">
                  실제: ${actualExpense.toLocaleString()}
                </span>
                <span className="text-orange-600">
                  예상: ${plannedExpense.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>현금: ${totalCashExpense.toLocaleString()}</span>
                  <span>비현금: ${totalNonCashExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    실제 ${actualCashExpense.toLocaleString()} / 예상 $
                    {plannedCashExpense.toLocaleString()}
                  </span>
                  <span>
                    실제 ${actualNonCashExpense.toLocaleString()} / 예상 $
                    {plannedNonCashExpense.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">잔액</div>
            <div
              className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              ${balance.toLocaleString()} CAD
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-green-700 font-medium">
                  실제: ${actualBalance.toLocaleString()}
                </span>
                <span className="text-orange-600">
                  예상: ${plannedBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>현금: ${totalCashBalance.toLocaleString()}</span>
                  <span>비현금: ${totalNonCashBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>
                    실제 $
                    {(actualCashIncome - actualCashExpense).toLocaleString()} /
                    예상 $
                    {(plannedCashIncome - plannedCashExpense).toLocaleString()}
                  </span>
                  <span>
                    실제 $
                    {(
                      actualNonCashIncome - actualNonCashExpense
                    ).toLocaleString()}{" "}
                    / 예상 $
                    {(
                      plannedNonCashIncome - plannedNonCashExpense
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">거래 내역</h3>
            <Badge variant="secondary" className="text-sm text-blue-400">
              {filteredFinances.length}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              size="sm"
              variant="outline"
              title="엑셀로 내보내기"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsFinanceCategorySettingsOpen(true)}
              size="sm"
              variant="outline"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {hasEditPermission && (
              <Button
                onClick={() => {
                  setEditingFinance(null);
                  setNewFinance({
                    type: "income",
                    category: "",
                    vendor: "",
                    itemName: "",
                    amount: "",
                    paidBy: "",
                    description: "",
                    datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
                    isActual: true,
                  });
                  setIsFinanceModalOpen(true);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                거래
              </Button>
            )}
          </div>
        </div>

        {/* 필터 UI */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsFinanceFilterModalOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              필터
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>

            {/* 활성 필터 표시 */}
            {financeFilters.types.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md text-xs">
                <span className="text-blue-800">타입:</span>
                <span className="text-blue-600">
                  {financeFilters.types
                    .map((type) => (type === "income" ? "수입" : "지출"))
                    .join(", ")}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, types: [] }))
                  }
                  className="text-blue-500 hover:text-blue-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {financeFilters.categories.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md text-xs">
                <span className="text-green-800">카테고리:</span>
                <span className="text-green-600">
                  {financeFilters.categories.length > 2
                    ? `${financeFilters.categories.slice(0, 2).join(", ")} 외 ${financeFilters.categories.length - 2}개`
                    : financeFilters.categories.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, categories: [] }))
                  }
                  className="text-green-500 hover:text-green-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {financeFilters.vendors.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-md text-xs">
                <span className="text-purple-800">거래처:</span>
                <span className="text-purple-600">
                  {financeFilters.vendors.length > 2
                    ? `${financeFilters.vendors.slice(0, 2).join(", ")} 외 ${financeFilters.vendors.length - 2}개`
                    : financeFilters.vendors.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, vendors: [] }))
                  }
                  className="text-purple-500 hover:text-purple-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {financeFilters.paidBys.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-md text-xs">
                <span className="text-orange-800">거래자:</span>
                <span className="text-orange-600">
                  {financeFilters.paidBys.length > 2
                    ? `${financeFilters.paidBys.slice(0, 2).join(", ")} 외 ${financeFilters.paidBys.length - 2}개`
                    : financeFilters.paidBys.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, paidBys: [] }))
                  }
                  className="text-orange-500 hover:text-orange-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {financeFilters.actualStatus !== "all" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-md text-xs">
                <span className="text-red-800">구분:</span>
                <span className="text-red-600">
                  {financeFilters.actualStatus === "actual" ? "실제 거래" : "예상/계획"}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, actualStatus: "all" }))
                  }
                  className="text-red-500 hover:text-red-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {financeFilters.dateRange !== "all" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
                <span className="text-gray-800">날짜:</span>
                <span className="text-gray-600">
                  {financeFilters.dateRange === "today"
                    ? "오늘"
                    : financeFilters.dateRange === "week"
                      ? "이번 주"
                      : financeFilters.dateRange === "month"
                        ? "이번 달"
                        : "사용자 지정"}
                </span>
                <button
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, dateRange: "all" }))
                  }
                  className="text-gray-500 hover:text-gray-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="flex items-center gap-2"
              title="엑셀로 내보내기"
            >
              <Download className="h-4 w-4" />
              엑셀
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Columns className="h-4 w-4" />
                  컬럼
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.date}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        date: !!checked,
                      }))
                    }
                  />
                  <span>날짜</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.type}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        type: !!checked,
                      }))
                    }
                  />
                  <span>구분</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.category}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        category: !!checked,
                      }))
                    }
                  />
                  <span>카테고리</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.vendor}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        vendor: !!checked,
                      }))
                    }
                  />
                  <span>거래처</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.itemName}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        itemName: !!checked,
                      }))
                    }
                  />
                  <span>품명</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.paidBy}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        paidBy: !!checked,
                      }))
                    }
                  />
                  <span>거래자</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={visibleColumns.amount}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        amount: !!checked,
                      }))
                    }
                  />
                  <span>금액</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 항목 수 선택 */}
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                const newValue = parseInt(value);
                setItemsPerPage(newValue);
                setCurrentPage(1);
                // 로컬 스토리지에 저장
                if (typeof window !== "undefined") {
                  localStorage.setItem(
                    "finance-items-per-page",
                    newValue.toString()
                  );
                }
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10개</SelectItem>
                <SelectItem value="50">50개</SelectItem>
                <SelectItem value="100">100개</SelectItem>
                <SelectItem value="200">200개</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.date && (
                  <TableHead
                    className="w-[100px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      날짜
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.type && (
                  <TableHead
                    className="hidden sm:table-cell w-[80px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1">
                      구분
                      {getSortIcon("type")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.category && (
                  <TableHead
                    className="hidden sm:table-cell w-[120px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      카테고리
                      {getSortIcon("category")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.vendor && (
                  <TableHead
                    className="hidden sm:table-cell w-[120px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("vendor")}
                  >
                    <div className="flex items-center gap-1">
                      거래처
                      {getSortIcon("vendor")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.itemName && (
                  <TableHead
                    className="w-[180px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("itemName")}
                  >
                    <div className="flex items-center gap-1">
                      품명
                      {getSortIcon("itemName")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.paidBy && (
                  <TableHead
                    className="w-[100px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("paidBy")}
                  >
                    <div className="flex items-center gap-1">
                      거래자
                      {getSortIcon("paidBy")}
                    </div>
                  </TableHead>
                )}
                {visibleColumns.amount && (
                  <TableHead
                    className="text-right w-[140px] text-xs sm:text-sm cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      금액
                      {getSortIcon("amount")}
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFinances.map((finance) => {
                return (
                  <TableRow
                    key={finance.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => handleFinanceRowClick(finance)}
                  >
                    {visibleColumns.date && (
                      <TableCell className="text-xs sm:text-sm py-3">
                        {(() => {
                          try {
                            if (finance.datetime) {
                              return format(
                                parseISO(finance.datetime),
                                "MM/dd HH:mm"
                              );
                            } else if (finance.date) {
                              return format(parseISO(finance.date), "MM/dd");
                            } else {
                              return "-";
                            }
                          } catch (error) {
                            console.warn("날짜 포맷 오류:", error);
                            return "-";
                          }
                        })()}
                      </TableCell>
                    )}
                    {visibleColumns.type && (
                      <TableCell className="hidden sm:table-cell py-3">
                        <Badge
                          variant={
                            finance.type === "income" ? "default" : "secondary"
                          }
                          className={`text-[10px] sm:text-xs px-1 py-0.5 sm:px-2 ${
                            finance.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {finance.type === "income" ? "수입" : "지출"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.category && (
                      <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-3 truncate">
                        {finance.category}
                      </TableCell>
                    )}
                    {visibleColumns.vendor && (
                      <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-3 truncate">
                        {finance.vendor || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.itemName && (
                      <TableCell className="text-xs sm:text-sm text-gray-600 py-3 truncate">
                        {finance.itemName || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.paidBy && (
                      <TableCell className="text-xs sm:text-sm text-gray-600 py-3 truncate">
                        {finance.paidBy || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.amount && (
                      <TableCell className="text-right py-3">
                        <div className="flex flex-col">
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              finance.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {finance.type === "income" ? "+" : "-"}$
                            {finance.amount.toLocaleString()} CAD
                          </span>
                          <span className="text-xs font-bold mt-1 text-gray-500">
                            ${(runningBalanceMap.get(finance.id) || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredFinances.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={
                      Object.values(visibleColumns).filter(Boolean).length
                    }
                    className="text-center py-8 text-gray-500"
                  >
                    등록된 거래 내역이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 컨트롤 */}
        <div className="flex items-center justify-center px-4 py-3 bg-white border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {(() => {
                let startPage, endPage;

                if (totalPages <= 3) {
                  startPage = 1;
                  endPage = totalPages;
                } else if (currentPage <= 2) {
                  startPage = 1;
                  endPage = 3;
                } else if (currentPage >= totalPages - 1) {
                  startPage = totalPages - 2;
                  endPage = totalPages;
                } else {
                  startPage = currentPage - 1;
                  endPage = currentPage + 1;
                }

                return Array.from(
                  { length: endPage - startPage + 1 },
                  (_, i) => (
                    <PaginationItem key={startPage + i}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(startPage + i);
                        }}
                        isActive={currentPage === startPage + i}
                      >
                        {startPage + i}
                      </PaginationLink>
                    </PaginationItem>
                  )
                );
              })()}

              {totalPages > 3 && currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* 재정 추가 모달 - 반응형 */}
      {isMobile ? (
        <Drawer
          open={isFinanceModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingFinance(null);
            }
            setIsFinanceModalOpen(open);
          }}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {editingFinance ? "거래 수정" : "거래 추가"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <div className="grid gap-4 py-4">
                {/* 첫 번째 행: 거래 유형, 카테고리 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finance-type-mobile">거래 유형 *</Label>
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
                    <Label htmlFor="finance-category-mobile">카테고리 *</Label>
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
                </div>

                {/* 두 번째 행: 거래처, 품명 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finance-vendor-mobile">거래처</Label>
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
                    <Label htmlFor="finance-itemName-mobile">품명</Label>
                    <Input
                      id="finance-itemName-mobile"
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
                </div>

                {/* 세 번째 행: 금액, 거래자 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finance-amount-mobile">금액 *</Label>
                    <Input
                      id="finance-amount-mobile"
                      type="number"
                      value={newFinance.amount}
                      onChange={(e) =>
                        setNewFinance((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="금액을 입력하세요"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="finance-paidBy-mobile">
                      거래자(결제자)
                    </Label>
                    <Input
                      id="finance-paidBy-mobile"
                      value={newFinance.paidBy}
                      onChange={(e) =>
                        setNewFinance((prev) => ({
                          ...prev,
                          paidBy: e.target.value,
                        }))
                      }
                      placeholder="결제한 사람을 입력하세요"
                    />
                  </div>
                </div>

                {/* 네 번째 행: 설명 */}
                <div className="grid gap-2">
                  <Label htmlFor="finance-description-mobile">설명</Label>
                  <Textarea
                    id="finance-description-mobile"
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

                {/* 다섯 번째 행: 날짜 및 시간 */}
                <div className="grid gap-2">
                  <Label htmlFor="finance-datetime-mobile">
                    날짜 및 시간 *
                  </Label>
                  <Input
                    id="finance-datetime-mobile"
                    type="datetime-local"
                    step="1"
                    value={newFinance.datetime}
                    onChange={(e) =>
                      setNewFinance((prev) => ({
                        ...prev,
                        datetime: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* 여섯 번째 행: 실제 지출/수입 여부 */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="finance-isActual-mobile">
                      실제 지출/수입
                    </Label>
                    <Switch
                      id="finance-isActual-mobile"
                      checked={newFinance.isActual}
                      onCheckedChange={(checked) =>
                        setNewFinance((prev) => ({
                          ...prev,
                          isActual: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {newFinance.isActual
                      ? "실제로 지출/수입이 발생한 거래입니다"
                      : "예상 또는 계획된 거래입니다"}
                  </p>
                </div>

                {/* 버튼 */}
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
                  <Button 
                    onClick={handleAddFinance}
                    disabled={isSubmittingFinance}
                  >
                    {isSubmittingFinance 
                      ? "처리 중..." 
                      : (editingFinance ? "수정" : "추가")
                    }
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={isFinanceModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingFinance(null);
            }
            setIsFinanceModalOpen(open);
          }}
        >
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFinance ? "거래 수정" : "거래 추가"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* 첫 번째 행: 거래 유형, 카테고리 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* 두 번째 행: 거래처, 품명 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* 세 번째 행: 금액, 거래자 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="finance-amount">금액 *</Label>
                  <Input
                    id="finance-amount"
                    type="number"
                    value={newFinance.amount}
                    onChange={(e) =>
                      setNewFinance((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
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
                      setNewFinance((prev) => ({
                        ...prev,
                        paidBy: e.target.value,
                      }))
                    }
                    placeholder="결제한 사람을 입력하세요"
                  />
                </div>
              </div>

              {/* 네 번째 행: 설명 (전체 너비) */}
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

              {/* 다섯 번째 행: 날짜 및 시간 (전체 너비) */}
              <div className="grid gap-2">
                <Label htmlFor="finance-datetime">날짜 및 시간 *</Label>
                <Input
                  id="finance-datetime"
                  type="datetime-local"
                  step="1"
                  value={newFinance.datetime}
                  onChange={(e) =>
                    setNewFinance((prev) => ({
                      ...prev,
                      datetime: e.target.value,
                    }))
                  }
                />
              </div>

              {/* 여섯 번째 행: 실제 지출/수입 여부 */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="finance-isActual">실제 지출/수입</Label>
                  <Switch
                    id="finance-isActual"
                    checked={newFinance.isActual}
                    onCheckedChange={(checked) =>
                      setNewFinance((prev) => ({
                        ...prev,
                        isActual: checked,
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {newFinance.isActual
                    ? "실제로 지출/수입이 발생한 거래입니다"
                    : "예상 또는 계획된 거래입니다"}
                </p>
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
              <Button 
                onClick={handleAddFinance}
                disabled={isSubmittingFinance}
              >
                {isSubmittingFinance 
                  ? "처리 중..." 
                  : (editingFinance ? "수정" : "추가")
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 재정 카테고리 및 거래처 설정 모달 - 반응형 */}
      {isMobile ? (
        <Drawer
          open={isFinanceCategorySettingsOpen}
          onOpenChange={setIsFinanceCategorySettingsOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>재정 설정</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
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
                                    onClick={() =>
                                      removeFinanceCategory(category)
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
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
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
                                {isOrderEditMode && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveCategoryUp(index)}
                                      disabled={index === 0}
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveCategoryDown(index)}
                                      disabled={
                                        index === financeCategories.length - 1
                                      }
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
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
                                  onClick={() =>
                                    removeFinanceCategory(category)
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
                                {isOrderEditMode && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveVendorUp(index)}
                                      disabled={index === 0}
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => moveVendorDown(index)}
                                      disabled={
                                        index === financeVendors.length - 1
                                      }
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
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

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOrderEditMode(!isOrderEditMode)}
              >
                {isOrderEditMode ? "완료" : "편집"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFinanceCategorySettingsOpen(false)}
              >
                닫기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 재정 수정/삭제 액션 다이얼로그 - 반응형 */}
      {isMobile ? (
        <Drawer
          open={isFinanceActionDialogOpen}
          onOpenChange={setIsFinanceActionDialogOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>거래 내역 관리</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-4">
                선택한 거래 내역을 수정하거나 삭제할 수 있습니다.
              </p>

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
                      <div>
                        <span className="text-gray-500">상태:</span>
                        <span
                          className={`ml-2 font-medium ${(selectedFinanceForAction.isActual === true || selectedFinanceForAction.isActual === undefined) ? "text-green-600" : "text-orange-600"}`}
                        >
                          {(selectedFinanceForAction.isActual === true || selectedFinanceForAction.isActual === undefined)
                            ? "실제 거래"
                            : "예상 거래"}
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
                          {selectedFinanceForAction.type === "income"
                            ? "+"
                            : "-"}
                          ${selectedFinanceForAction.amount.toLocaleString()}{" "}
                          CAD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsFinanceActionDialogOpen(false)}
                >
                  닫기
                </Button>
                {hasEditPermission && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleEditFinance(selectedFinanceForAction);
                        setIsFinanceActionDialogOpen(false);
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => {
                        setIsFinanceActionDialogOpen(false);
                        handleDeleteFinance(selectedFinanceForAction.id);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      삭제
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
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
                        {selectedFinanceForAction.category || "-"}
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
                      <span className="text-gray-500">금액:</span>
                      <span className="ml-2 font-medium text-lg">
                        $
                        {selectedFinanceForAction.amount?.toLocaleString() || 0}{" "}
                        CAD
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">거래자:</span>
                      <span className="ml-2 font-medium">
                        {selectedFinanceForAction.paidBy || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span
                        className={`ml-2 font-medium ${(selectedFinanceForAction.isActual === true || selectedFinanceForAction.isActual === undefined) ? "text-green-600" : "text-orange-600"}`}
                      >
                        {(selectedFinanceForAction.isActual === true || selectedFinanceForAction.isActual === undefined)
                          ? "실제 거래"
                          : "예상 거래"}
                      </span>
                    </div>
                    {selectedFinanceForAction.description && (
                      <div className="col-span-2">
                        <span className="text-gray-500">설명:</span>
                        <p className="mt-1 text-sm">
                          {selectedFinanceForAction.description}
                        </p>
                      </div>
                    )}
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
              {hasEditPermission && (
                <>
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
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* 재정 삭제 확인 다이얼로그 - 반응형 */}
      {isMobile ? (
        <Drawer
          open={financeDeleteConfirmOpen}
          onOpenChange={setFinanceDeleteConfirmOpen}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>거래 내역 삭제</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                정말로 이 거래 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수
                없습니다.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFinanceDeleteConfirmOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={confirmDeleteFinance}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
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
      )}

      {/* 재정 필터 모달 - 반응형 */}
      {isMobile ? (
        <Drawer
          open={isFinanceFilterModalOpen}
          onOpenChange={setIsFinanceFilterModalOpen}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>재정 필터</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto space-y-4">
              {/* 날짜 필터 */}
              <div className="space-y-2">
                <Label>날짜 범위</Label>
                <Select
                  value={financeFilters.dateRange}
                  onValueChange={(value: any) =>
                    setFinanceFilters((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="week">이번 주</SelectItem>
                    <SelectItem value="month">이번 달</SelectItem>
                    <SelectItem value="custom">사용자 지정</SelectItem>
                  </SelectContent>
                </Select>

                {financeFilters.dateRange === "custom" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant={
                          financeFilters.customDateType === "single"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFinanceFilters((prev) => ({
                            ...prev,
                            customDateType: "single",
                            selectedDateRange: undefined,
                          }))
                        }
                      >
                        특정 날짜
                      </Button>
                      <Button
                        variant={
                          financeFilters.customDateType === "range"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFinanceFilters((prev) => ({
                            ...prev,
                            customDateType: "range",
                            selectedDate: undefined,
                          }))
                        }
                      >
                        날짜 범위
                      </Button>
                    </div>

                    {financeFilters.customDateType === "single" && (
                      <Popover
                        open={isDatePickerOpen}
                        onOpenChange={setIsDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {financeFilters.selectedDate
                              ? format(
                                  financeFilters.selectedDate,
                                  "yyyy년 MM월 dd일",
                                  { locale: ko }
                                )
                              : "날짜를 선택하세요"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={financeFilters.selectedDate}
                            onSelect={(date) => {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                selectedDate: date,
                              }));
                              setIsDatePickerOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {financeFilters.customDateType === "range" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {financeFilters.selectedDateRange?.from ? (
                              financeFilters.selectedDateRange.to ? (
                                <>
                                  {format(
                                    financeFilters.selectedDateRange.from,
                                    "MM/dd",
                                    { locale: ko }
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    financeFilters.selectedDateRange.to,
                                    "MM/dd",
                                    { locale: ko }
                                  )}
                                </>
                              ) : (
                                format(
                                  financeFilters.selectedDateRange.from,
                                  "MM/dd",
                                  { locale: ko }
                                )
                              )
                            ) : (
                              "날짜 범위를 선택하세요"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="range"
                            defaultMonth={
                              financeFilters.selectedDateRange?.from
                            }
                            selected={financeFilters.selectedDateRange}
                            onSelect={(range) =>
                              setFinanceFilters((prev) => ({
                                ...prev,
                                selectedDateRange: range as
                                  | {
                                      from: Date | undefined;
                                      to: Date | undefined;
                                    }
                                  | undefined,
                              }))
                            }
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>

              <Accordion type="multiple" className="w-full space-y-2">
                {/* 거래 유형 필터 */}
                <AccordionItem value="types" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-types"
                        checked={financeFilters.types.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              types: ["income", "expense"],
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              types: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-types"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래 유형
                      </Label>
                      {financeFilters.types.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.types.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2 pl-6">
                      {["income", "expense"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={financeFilters.types.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  types: [...prev.types, type],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  types: prev.types.filter((t) => t !== type),
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`type-${type}`} className="text-sm">
                            {type === "income" ? "수입" : "지출"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 카테고리 필터 */}
                <AccordionItem
                  value="categories"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-categories"
                        checked={financeFilters.categories.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              categories: financeCategories,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              categories: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-categories"
                        className="text-sm font-medium cursor-pointer"
                      >
                        카테고리
                      </Label>
                      {financeFilters.categories.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.categories.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {financeCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`category-${category}`}
                            checked={financeFilters.categories.includes(
                              category
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  categories: [...prev.categories, category],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  categories: prev.categories.filter(
                                    (c) => c !== category
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`category-${category}`}
                            className="text-sm"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 거래처 필터 */}
                <AccordionItem
                  value="vendors"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-vendors"
                        checked={financeFilters.vendors.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              vendors: financeVendors,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              vendors: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-vendors"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래처
                      </Label>
                      {financeFilters.vendors.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.vendors.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {financeVendors.map((vendor) => (
                        <div
                          key={vendor}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`vendor-${vendor}`}
                            checked={financeFilters.vendors.includes(vendor)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  vendors: [...prev.vendors, vendor],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  vendors: prev.vendors.filter(
                                    (v) => v !== vendor
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`vendor-${vendor}`}
                            className="text-sm"
                          >
                            {vendor}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 거래자 필터 */}
                <AccordionItem
                  value="paidBys"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-paidBys"
                        checked={financeFilters.paidBys.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allPaidBys = Array.from(
                              new Set(
                                finances
                                  .filter((f) => f.paidBy && f.paidBy.trim())
                                  .map((f) => f.paidBy!)
                              )
                            ).sort();
                            setFinanceFilters((prev) => ({
                              ...prev,
                              paidBys: allPaidBys,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              paidBys: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-paidBys"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래자
                      </Label>
                      {financeFilters.paidBys.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.paidBys.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {Array.from(
                        new Set(
                          finances
                            .filter((f) => f.paidBy && f.paidBy.trim())
                            .map((f) => f.paidBy!)
                        )
                      ).sort().map((paidBy) => (
                        <div
                          key={paidBy}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`paidBy-${paidBy}`}
                            checked={financeFilters.paidBys.includes(paidBy)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  paidBys: [...prev.paidBys, paidBy],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  paidBys: prev.paidBys.filter(
                                    (p) => p !== paidBy
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`paidBy-${paidBy}`}
                            className="text-sm"
                          >
                            {paidBy}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* 실제/예상 구분 필터 */}
                <AccordionItem
                  value="actualStatus"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium cursor-pointer">
                        실제/예상 구분
                      </Label>
                      {financeFilters.actualStatus !== "all" && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.actualStatus === "actual" ? "실제 거래" : "예상/계획"})
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-all"
                          checked={financeFilters.actualStatus === "all"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "all",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-all" className="text-sm">
                          전체
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-actual"
                          checked={financeFilters.actualStatus === "actual"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "actual",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-actual" className="text-sm">
                          실제 거래
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-expected"
                          checked={financeFilters.actualStatus === "expected"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "expected",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-expected" className="text-sm">
                          예상/계획
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setFinanceFilters({
                    dateRange: "all",
                    customDateType: "single",
                    selectedDate: undefined,
                    selectedDateRange: undefined,
                    startDate: "",
                    endDate: "",
                    types: [],
                    categories: [],
                    vendors: [],
                    paidBys: [],
                    actualStatus: "all",
                  });
                  setCurrentPage(1);
                }}
              >
                초기화
              </Button>
              <Button onClick={() => setIsFinanceFilterModalOpen(false)}>
                적용
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={isFinanceFilterModalOpen}
          onOpenChange={setIsFinanceFilterModalOpen}
        >
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>재정 필터</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 날짜 필터 */}
              <div className="space-y-2">
                <Label>날짜 범위</Label>
                <Select
                  value={financeFilters.dateRange}
                  onValueChange={(value: any) =>
                    setFinanceFilters((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="week">이번 주</SelectItem>
                    <SelectItem value="month">이번 달</SelectItem>
                    <SelectItem value="custom">사용자 지정</SelectItem>
                  </SelectContent>
                </Select>

                {financeFilters.dateRange === "custom" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant={
                          financeFilters.customDateType === "single"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFinanceFilters((prev) => ({
                            ...prev,
                            customDateType: "single",
                            selectedDateRange: undefined,
                          }))
                        }
                      >
                        특정 날짜
                      </Button>
                      <Button
                        variant={
                          financeFilters.customDateType === "range"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFinanceFilters((prev) => ({
                            ...prev,
                            customDateType: "range",
                            selectedDate: undefined,
                          }))
                        }
                      >
                        날짜 범위
                      </Button>
                    </div>

                    {financeFilters.customDateType === "single" && (
                      <Popover
                        open={isDatePickerOpen}
                        onOpenChange={setIsDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {financeFilters.selectedDate
                              ? format(
                                  financeFilters.selectedDate,
                                  "yyyy년 MM월 dd일",
                                  { locale: ko }
                                )
                              : "날짜를 선택하세요"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={financeFilters.selectedDate}
                            onSelect={(date) => {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                selectedDate: date,
                              }));
                              setIsDatePickerOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {financeFilters.customDateType === "range" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {financeFilters.selectedDateRange?.from ? (
                              financeFilters.selectedDateRange.to ? (
                                <>
                                  {format(
                                    financeFilters.selectedDateRange.from,
                                    "MM/dd",
                                    { locale: ko }
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    financeFilters.selectedDateRange.to,
                                    "MM/dd",
                                    { locale: ko }
                                  )}
                                </>
                              ) : (
                                format(
                                  financeFilters.selectedDateRange.from,
                                  "MM/dd",
                                  { locale: ko }
                                )
                              )
                            ) : (
                              "날짜 범위를 선택하세요"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="range"
                            defaultMonth={
                              financeFilters.selectedDateRange?.from
                            }
                            selected={financeFilters.selectedDateRange}
                            onSelect={(range) =>
                              setFinanceFilters((prev) => ({
                                ...prev,
                                selectedDateRange: range as
                                  | {
                                      from: Date | undefined;
                                      to: Date | undefined;
                                    }
                                  | undefined,
                              }))
                            }
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>

              <Accordion type="multiple" className="w-full space-y-2">
                {/* 거래 유형 필터 */}
                <AccordionItem value="types" className="border rounded-lg px-3">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-types-desktop"
                        checked={financeFilters.types.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              types: ["income", "expense"],
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              types: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-types-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래 유형
                      </Label>
                      {financeFilters.types.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.types.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2 pl-6">
                      {["income", "expense"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}-desktop`}
                            checked={financeFilters.types.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  types: [...prev.types, type],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  types: prev.types.filter((t) => t !== type),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`type-${type}-desktop`}
                            className="text-sm"
                          >
                            {type === "income" ? "수입" : "지출"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 카테고리 필터 */}
                <AccordionItem
                  value="categories"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-categories-desktop"
                        checked={financeFilters.categories.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              categories: financeCategories,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              categories: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-categories-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        카테고리
                      </Label>
                      {financeFilters.categories.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.categories.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {financeCategories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`category-${category}-desktop`}
                            checked={financeFilters.categories.includes(
                              category
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  categories: [...prev.categories, category],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  categories: prev.categories.filter(
                                    (c) => c !== category
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`category-${category}-desktop`}
                            className="text-sm"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 거래처 필터 */}
                <AccordionItem
                  value="vendors"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-vendors-desktop"
                        checked={financeFilters.vendors.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              vendors: financeVendors,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              vendors: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-vendors-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래처
                      </Label>
                      {financeFilters.vendors.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.vendors.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {financeVendors.map((vendor) => (
                        <div
                          key={vendor}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`vendor-${vendor}-desktop`}
                            checked={financeFilters.vendors.includes(vendor)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  vendors: [...prev.vendors, vendor],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  vendors: prev.vendors.filter(
                                    (v) => v !== vendor
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`vendor-${vendor}-desktop`}
                            className="text-sm"
                          >
                            {vendor}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 거래자 필터 */}
                <AccordionItem
                  value="paidBys"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-paidBys-desktop"
                        checked={financeFilters.paidBys.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allPaidBys = Array.from(
                              new Set(
                                finances
                                  .filter((f) => f.paidBy && f.paidBy.trim())
                                  .map((f) => f.paidBy!)
                              )
                            ).sort();
                            setFinanceFilters((prev) => ({
                              ...prev,
                              paidBys: allPaidBys,
                            }));
                          } else {
                            setFinanceFilters((prev) => ({
                              ...prev,
                              paidBys: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-paidBys-desktop"
                        className="text-sm font-medium cursor-pointer"
                      >
                        거래자
                      </Label>
                      {financeFilters.paidBys.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.paidBys.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {Array.from(
                        new Set(
                          finances
                            .filter((f) => f.paidBy && f.paidBy.trim())
                            .map((f) => f.paidBy!)
                        )
                      ).sort().map((paidBy) => (
                        <div
                          key={paidBy}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`paidBy-${paidBy}-desktop`}
                            checked={financeFilters.paidBys.includes(paidBy)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  paidBys: [...prev.paidBys, paidBy],
                                }));
                              } else {
                                setFinanceFilters((prev) => ({
                                  ...prev,
                                  paidBys: prev.paidBys.filter(
                                    (p) => p !== paidBy
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`paidBy-${paidBy}-desktop`}
                            className="text-sm"
                          >
                            {paidBy}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* 실제/예상 구분 필터 */}
                <AccordionItem
                  value="actualStatus"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium cursor-pointer">
                        실제/예상 구분
                      </Label>
                      {financeFilters.actualStatus !== "all" && (
                        <span className="text-xs text-gray-500">
                          ({financeFilters.actualStatus === "actual" ? "실제 거래" : "예상/계획"})
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-all-desktop"
                          checked={financeFilters.actualStatus === "all"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "all",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-all-desktop" className="text-sm">
                          전체
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-actual-desktop"
                          checked={financeFilters.actualStatus === "actual"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "actual",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-actual-desktop" className="text-sm">
                          실제 거래
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actualStatus-expected-desktop"
                          checked={financeFilters.actualStatus === "expected"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFinanceFilters((prev) => ({
                                ...prev,
                                actualStatus: "expected",
                              }));
                            }
                          }}
                        />
                        <Label htmlFor="actualStatus-expected-desktop" className="text-sm">
                          예상/계획
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setFinanceFilters({
                    dateRange: "all",
                    customDateType: "single",
                    selectedDate: undefined,
                    selectedDateRange: undefined,
                    startDate: "",
                    endDate: "",
                    types: [],
                    categories: [],
                    vendors: [],
                    paidBys: [],
                    actualStatus: "all",
                  });
                  setCurrentPage(1);
                }}
              >
                초기화
              </Button>
              <Button onClick={() => setIsFinanceFilterModalOpen(false)}>
                적용
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
