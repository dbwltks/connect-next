"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  Settings,
  Filter,
  Columns,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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
  participantsApi,
  categoriesApi,
  membersApi,
  type Participant,
} from "../utils/api";
import { saveProgramFeatureData, loadProgramData } from "../utils/program-data";

interface ParticipantsTabProps {
  programId: string;
  hasEditPermission?: boolean;
}

export default function ParticipantsTab({
  programId,
  hasEditPermission = false,
}: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [fieldSettings, setFieldSettings] = useState({
    name: true,
    english_name: true,
    email: true,
    phone: true,
    birth_date: true,
    gender: true,
    status: true,
    category: false,
    notes: false,
  });

  // 참여자 필터 상태
  const [participantFilters, setParticipantFilters] = useState({
    statuses: [] as string[],
    categories: [] as string[],
    genders: [] as string[],
  });

  // 필터 모달 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // 컬럼 표시 상태 (로컬 스토리지에서 불러오기)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(
        `participants-visible-columns-${programId}`
      );
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error("컬럼 설정 파싱 오류:", error);
        }
      }
    }
    return {
      name: true,
      english_name: true,
      email: true,
      phone: true,
      birth_date: true,
      gender: true,
      status: true,
      category: false,
      notes: false,
    };
  });

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 선택된 참여자 행 상태
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [isParticipantActionDialogOpen, setIsParticipantActionDialogOpen] =
    useState(false);
  const [selectedParticipantForAction, setSelectedParticipantForAction] =
    useState<any>(null);

  // 참여자 삭제 확인 다이얼로그 상태
  const [participantDeleteConfirmOpen, setParticipantDeleteConfirmOpen] =
    useState(false);
  const [participantToDeleteConfirm, setParticipantToDeleteConfirm] = useState<
    string | null
  >(null);

  // 정렬 상태
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });
  const [formData, setFormData] = useState({
    name: "",
    english_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    status: "",
    category: "",
    notes: "",
  });

  const fieldLabels = {
    name: "이름",
    english_name: "영어이름",
    email: "이메일",
    phone: "연락처",
    birth_date: "생년월일",
    gender: "성별",
    status: "상태",
    category: "카테고리",
    notes: "비고",
  };

  // 컬럼 표시 설정을 로컬 스토리지에 저장
  const saveVisibleColumns = (columns: typeof visibleColumns) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `participants-visible-columns-${programId}`,
        JSON.stringify(columns)
      );
    }
  };

  const loadParticipants = async () => {
    try {
      const data = await participantsApi.getAll(programId);
      setParticipants(data);
    } catch (error) {
      alert("참가자 로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.getParticipantCategories();
      setCategories(data);
    } catch (error) {
      setCategories([]);
    }
  };

  const loadSettings = async () => {
    try {
      const programData = await loadProgramData(programId);
      if (programData?.participants_setting) {
        const settings = programData.participants_setting;
        if (settings.fieldSettings) {
          // 기본값과 병합하여 누락된 필드 처리
          const defaultFieldSettings = {
            name: true,
            english_name: true,
            email: true,
            phone: true,
            birth_date: true,
            gender: true,
            status: true,
            category: false,
            notes: false,
          };
          const mergedFieldSettings = {
            ...defaultFieldSettings,
            ...settings.fieldSettings,
          };
          setFieldSettings(mergedFieldSettings);
          // 컬럼 표시 상태도 함께 업데이트 (기본값과 병합)
          setVisibleColumns((prev: typeof visibleColumns) => ({
            ...prev,
            ...mergedFieldSettings,
          }));
        }
        if (settings.statuses && Array.isArray(settings.statuses)) {
          setStatuses(settings.statuses);
        }
        if (settings.categories && Array.isArray(settings.categories)) {
          setCategories(settings.categories);
        }
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        fieldSettings,
        statuses,
        categories,
      };
      await saveProgramFeatureData(programId, "participants_setting", settings);
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장에 실패했습니다.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) {
      return;
    }
    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory("");
    await saveSettings();
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (confirm(`정말로 "${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      const updatedCategories = categories.filter((c) => c !== categoryName);
      setCategories(updatedCategories);
      await saveSettings();
    }
  };

  const handleAddStatus = async () => {
    if (!newStatus.trim() || statuses.includes(newStatus.trim())) {
      return;
    }
    const updatedStatuses = [...statuses, newStatus.trim()];
    setStatuses(updatedStatuses);
    setNewStatus("");
    await saveSettings();
  };

  const handleDeleteStatus = async (status: string) => {
    if (confirm(`정말로 "${status}" 상태를 삭제하시겠습니까?`)) {
      const updatedStatuses = statuses.filter((s) => s !== status);
      setStatuses(updatedStatuses);
      await saveSettings();
    }
  };

  const handleFieldToggle = async (field: keyof typeof fieldSettings) => {
    const updatedSettings = {
      ...fieldSettings,
      [field]: !fieldSettings[field],
    };
    setFieldSettings(updatedSettings);
    // 컬럼 표시 상태도 함께 업데이트
    setVisibleColumns((prev: typeof visibleColumns) => ({
      ...prev,
      [field]: !fieldSettings[field],
    }));

    // 업데이트된 설정으로 저장
    try {
      const settings = {
        fieldSettings: updatedSettings,
        statuses,
        categories,
      };
      await saveProgramFeatureData(programId, "participants_setting", settings);
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert("설정 저장에 실패했습니다.");
    }
  };

  // 활성 필터 개수 계산
  const getActiveFiltersCount = () => {
    let count = 0;
    if (participantFilters.statuses.length > 0) count++;
    if (participantFilters.categories.length > 0) count++;
    if (participantFilters.genders.length > 0) count++;
    return count;
  };

  // 참여자 필터링
  const filteredParticipants = participants.filter((participant) => {
    // 상태 필터
    if (
      participantFilters.statuses.length > 0 &&
      !participantFilters.statuses.includes(participant.status)
    ) {
      return false;
    }

    // 카테고리 필터
    if (
      participantFilters.categories.length > 0 &&
      participant.category &&
      !participantFilters.categories.includes(participant.category)
    ) {
      return false;
    }

    // 성별 필터
    if (
      participantFilters.genders.length > 0 &&
      participant.gender &&
      !participantFilters.genders.includes(participant.gender)
    ) {
      return false;
    }

    return true;
  });

  // 정렬 함수
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 참여자 데이터
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key as keyof typeof a] || "";
    const bValue = b[sortConfig.key as keyof typeof b] || "";

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // 페이지네이션된 참여자 데이터
  const totalItems = sortedParticipants.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedParticipants = sortedParticipants.slice(startIndex, endIndex);

  // 정렬 아이콘 렌더링 함수
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-blue-600" />
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await membersApi.search(query);

      // 이미 참가자로 등록된 사람들의 이메일/전화번호/이름 목록
      const existingEmails = participants
        .map((p) => p.email?.toLowerCase())
        .filter(Boolean);
      const existingPhones = participants.map((p) => p.phone).filter(Boolean);
      const existingNames = participants.map((p) => p.name.toLowerCase());

      // 중복 체크 및 상태 추가
      const resultsWithStatus = results.map((member) => {
        const memberEmail = member.email?.toLowerCase();
        const memberPhone = member.phone;
        const memberName = (
          member.korean_name ||
          `${member.first_name} ${member.last_name}`.trim()
        ).toLowerCase();

        const isDuplicate =
          (memberEmail && existingEmails.includes(memberEmail)) ||
          (memberPhone && existingPhones.includes(memberPhone)) ||
          (memberName && existingNames.includes(memberName));

        return {
          ...member,
          isDuplicate,
        };
      });

      setSearchResults(resultsWithStatus);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 성별 데이터 표준화 함수
  const normalizeGender = (gender: string): string => {
    if (!gender) return "";

    const genderLower = gender.toLowerCase().trim();

    // 남성 패턴
    if (["male", "m", "남성", "남자", "남", "man"].includes(genderLower)) {
      return "남성";
    }

    // 여성 패턴
    if (["female", "f", "여성", "여자", "여", "woman"].includes(genderLower)) {
      return "여성";
    }

    return "";
  };

  const handleSelectMember = (member: any) => {
    // 한글 이름 우선, 없으면 영어 이름 조합
    const displayName =
      member.korean_name ||
      `${member.first_name || ""} ${member.last_name || ""}`.trim();
    // 영어이름은 first_name + last_name 조합 (항상 설정)
    const englishName =
      `${member.first_name || ""} ${member.last_name || ""}`.trim();

    // 성별 정보 추출 및 표준화 (다양한 필드명 고려)
    const rawGender = member.gender || member.sex || member.gender_type || "";
    const normalizedGender = normalizeGender(rawGender);

    setFormData({
      name: displayName,
      english_name: englishName,
      email: member.email || "",
      phone: member.phone || "",
      birth_date: member.birth_date || member.date_of_birth || "",
      gender: normalizedGender,
      status: statuses.length > 0 ? statuses[0] : "",
      category: categories.length > 0 ? categories[0] : "",
      notes: "",
    });
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      if (isEdit && selectedParticipant) {
        await participantsApi.update(
          selectedParticipant.id,
          {
            name: formData.name,
            english_name: formData.english_name || undefined,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            birth_date: formData.birth_date || undefined,
            gender: formData.gender || undefined,
            status: formData.status,
            category: formData.category,
            notes: formData.notes || undefined,
          },
          programId
        );
      } else {
        await participantsApi.create({
          program_id: programId,
          name: formData.name,
          english_name: formData.english_name || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          birth_date: formData.birth_date || undefined,
          gender: formData.gender || undefined,
          status: formData.status,
          category: formData.category,
          notes: formData.notes || undefined,
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadParticipants();
      alert(
        isEdit ? "참가자 정보가 수정되었습니다." : "참가자가 추가되었습니다."
      );
    } catch (error) {
      alert(
        `참가자 저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`
      );
    }
  };

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormData({
      name: participant.name,
      english_name: participant.english_name || "",
      email: participant.email || "",
      phone: participant.phone || "",
      birth_date: participant.birth_date || "",
      gender: participant.gender || "",
      status: participant.status,
      category: participant.category || "",
      notes: participant.notes || "",
    });
    setIsEdit(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // 삭제 확인 다이얼로그 표시
    setParticipantToDeleteConfirm(id);
    setParticipantDeleteConfirmOpen(true);
    return;
  };

  // 참가자 삭제 확인 후 실행
  const confirmDeleteParticipant = async () => {
    if (!participantToDeleteConfirm || !programId) return;

    try {
      // 1. 참가자 삭제
      await participantsApi.delete(participantToDeleteConfirm, programId);

      // 2. 해당 참가자가 속한 팀에서도 제거
      const programData = await loadProgramData(programId);
      if (programData?.team_members) {
        const updatedTeamMembers = programData.team_members.filter(
          (tm: any) => tm.participantId !== participantToDeleteConfirm
        );

        // 팀 멤버 목록 업데이트
        await saveProgramFeatureData(
          programId,
          "team_members",
          updatedTeamMembers
        );
      }

      loadParticipants();
      alert("참가자가 삭제되었습니다.");
    } catch (error) {
      alert(
        `참가자 삭제에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}`
      );
    } finally {
      setParticipantDeleteConfirmOpen(false);
      setParticipantToDeleteConfirm(null);
    }
  };

  // 참가자 행 클릭 핸들러
  const handleParticipantRowClick = (participant: any) => {
    setSelectedParticipantForAction(participant);
    setIsParticipantActionDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      english_name: "",
      email: "",
      phone: "",
      birth_date: "",
      gender: "",
      status: statuses.length > 0 ? statuses[0] : "",
      category: categories.length > 0 ? categories[0] : "",
      notes: "",
    });
    setSelectedParticipant(null);
    setIsEdit(false);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const getStatusBadge = (status: string) => {
    // 동적 색상 생성 (상태가 추가되어도 자동으로 색상 할당)
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-red-100 text-red-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-orange-100 text-orange-800",
    ];

    const statusIndex = statuses.indexOf(status);
    const colorClass =
      statusIndex >= 0
        ? colors[statusIndex % colors.length]
        : "bg-gray-100 text-gray-800";

    return <Badge className={colorClass}>{status}</Badge>;
  };

  useEffect(() => {
    loadParticipants();
    loadSettings();
  }, [programId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-row items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">참가자 관리</h3>
          <Badge variant="secondary" className="text-sm text-blue-400">
            {filteredParticipants.length}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
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
                  checked={visibleColumns.name}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, name: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                  disabled={true}
                />
                <span>이름 (필수)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.email}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, email: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>이메일</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.phone}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, phone: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>연락처</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.birth_date}
                  onCheckedChange={(checked) => {
                    const newColumns = {
                      ...visibleColumns,
                      birth_date: !!checked,
                    };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>생년월일</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.gender}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, gender: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>성별</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.status}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, status: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>상태</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.category}
                  onCheckedChange={(checked) => {
                    const newColumns = {
                      ...visibleColumns,
                      category: !!checked,
                    };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>카테고리</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={visibleColumns.notes}
                  onCheckedChange={(checked) => {
                    const newColumns = { ...visibleColumns, notes: !!checked };
                    setVisibleColumns(newColumns);
                    saveVisibleColumns(newColumns);
                  }}
                />
                <span>비고</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasEditPermission && (
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>참가자 관리 설정</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fields">필드 설정</TabsTrigger>
                    <TabsTrigger value="categories">카테고리</TabsTrigger>
                    <TabsTrigger value="statuses">상태</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fields" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        표시 필드 설정
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(fieldLabels).map(([field, label]) => (
                          <div
                            key={field}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={field}
                              checked={
                                fieldSettings[
                                  field as keyof typeof fieldSettings
                                ]
                              }
                              onCheckedChange={() =>
                                handleFieldToggle(
                                  field as keyof typeof fieldSettings
                                )
                              }
                              disabled={field === "name"} // 이름은 필수 필드
                            />
                            <Label
                              htmlFor={field}
                              className={
                                field === "name" ? "text-muted-foreground" : ""
                              }
                            >
                              {label} {field === "name" && "(필수)"}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        선택된 필드만 참가자 추가/수정 폼과 테이블에 표시됩니다.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        카테고리 관리
                      </h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="새 카테고리 이름"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCategory();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddCategory}
                          disabled={!newCategory.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>현재 카테고리</Label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center gap-1"
                            >
                              <Badge variant="secondary">{category}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteCategory(category)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="statuses" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">상태 관리</h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="새 상태 이름"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddStatus();
                            }
                          }}
                        />
                        <Button
                          onClick={handleAddStatus}
                          disabled={!newStatus.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>현재 상태</Label>
                        <div className="flex flex-wrap gap-2">
                          {statuses.map((status) => (
                            <div
                              key={status}
                              className="flex items-center gap-1"
                            >
                              <Badge variant="outline">{status}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteStatus(status)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsSettingsOpen(false)}>완료</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {hasEditPermission && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                  setSearchQuery("");
                  setShowSearchResults(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4" />
                  참가자
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-visible">
                <DialogHeader>
                  <DialogTitle>
                    {isEdit ? "참가자 수정" : "참가자 추가"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 멤버 검색 */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="search">멤버 검색</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="search"
                        placeholder="이름, 이메일, 전화번호로 검색..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />

                      {/* 검색 결과 - 절대 위치로 공중에 떠있음 */}
                      {showSearchResults && (
                        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 border border-gray-200 rounded-md bg-white shadow-xl max-h-48 overflow-y-auto">
                          {searchResults.length > 0 ? (
                            searchResults.map((member, index) => (
                              <div
                                key={index}
                                className={`p-3 border-b last:border-b-0 ${
                                  member.isDuplicate
                                    ? "bg-red-50 cursor-not-allowed opacity-60"
                                    : "hover:bg-gray-50 cursor-pointer"
                                }`}
                                onClick={() =>
                                  !member.isDuplicate &&
                                  handleSelectMember(member)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {(() => {
                                        const koreanName = member.korean_name;
                                        const englishName =
                                          `${member.first_name || ""} ${member.last_name || ""}`.trim();

                                        if (koreanName && englishName) {
                                          return `${koreanName} (${englishName})`;
                                        } else if (koreanName) {
                                          return koreanName;
                                        } else if (englishName) {
                                          return englishName;
                                        } else {
                                          return "이름 없음";
                                        }
                                      })()}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {member.email && (
                                        <span>{member.email}</span>
                                      )}
                                      {member.email && member.phone && (
                                        <span> • </span>
                                      )}
                                      {member.phone && (
                                        <span>{member.phone}</span>
                                      )}
                                    </div>
                                  </div>
                                  {member.isDuplicate && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      이미 등록됨
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center text-gray-500">
                              검색 결과가 없습니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 동적 폼 필드 렌더링 */}
                  <div className="space-y-4">
                    {/* 첫 번째 행: 이름, 영어이름 */}
                    <div className="grid grid-cols-2 gap-4">
                      {fieldSettings.name && (
                        <div>
                          <Label htmlFor="name">이름 *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                          />
                        </div>
                      )}
                      {fieldSettings.english_name && (
                        <div>
                          <Label htmlFor="english_name">영어이름</Label>
                          <Input
                            id="english_name"
                            value={formData.english_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                english_name: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* 두 번째 행: 이메일, 연락처 */}
                    {(fieldSettings.email || fieldSettings.phone) && (
                      <div className="grid grid-cols-2 gap-4">
                        {fieldSettings.email && (
                          <div>
                            <Label htmlFor="email">이메일</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                        {fieldSettings.phone && (
                          <div>
                            <Label htmlFor="phone">연락처</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 세 번째 행: 생년월일, 성별 */}
                    {(fieldSettings.birth_date || fieldSettings.gender) && (
                      <div className="grid grid-cols-2 gap-4">
                        {fieldSettings.birth_date && (
                          <div>
                            <Label htmlFor="birth_date">생년월일</Label>
                            <Input
                              id="birth_date"
                              type="date"
                              value={formData.birth_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  birth_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}
                        {fieldSettings.gender && (
                          <div>
                            <Label htmlFor="gender">성별</Label>
                            <Select
                              value={formData.gender}
                              onValueChange={(value) =>
                                setFormData({ ...formData, gender: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="남성">남성</SelectItem>
                                <SelectItem value="여성">여성</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 네 번째 행: 카테고리, 상태 */}
                    {(fieldSettings.category || fieldSettings.status) && (
                      <div className="grid grid-cols-2 gap-4">
                        {fieldSettings.category && (
                          <div>
                            <Label htmlFor="category">카테고리</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) =>
                                setFormData({ ...formData, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {fieldSettings.status && (
                          <div>
                            <Label htmlFor="status">상태</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value) =>
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 비고 필드 */}
                  {fieldSettings.notes && (
                    <div>
                      <Label htmlFor="notes">비고</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="참가자에 대한 메모나 특이사항을 입력하세요..."
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button type="submit">{isEdit ? "수정" : "추가"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div>
        {/* 활성 필터 표시 */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {participantFilters.statuses.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md text-xs">
                <span className="text-blue-800">상태:</span>
                <span className="text-blue-600">
                  {participantFilters.statuses.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setParticipantFilters((prev) => ({ ...prev, statuses: [] }))
                  }
                  className="text-blue-500 hover:text-blue-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {participantFilters.categories.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-md text-xs">
                <span className="text-green-800">카테고리:</span>
                <span className="text-green-600">
                  {participantFilters.categories.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setParticipantFilters((prev) => ({
                      ...prev,
                      categories: [],
                    }))
                  }
                  className="text-green-500 hover:text-green-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {participantFilters.genders.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-md text-xs">
                <span className="text-purple-800">성별:</span>
                <span className="text-purple-600">
                  {participantFilters.genders.join(", ")}
                </span>
                <button
                  onClick={() =>
                    setParticipantFilters((prev) => ({ ...prev, genders: [] }))
                  }
                  className="text-purple-500 hover:text-purple-700 ml-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* 항목 수 선택 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            총 {totalItems}개 중 {startIndex + 1}-
            {Math.min(endIndex, totalItems)}개 표시
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.name && (
                  <TableHead className="w-[180px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("name")}
                    >
                      이름
                      {getSortIcon("name")}
                    </button>
                  </TableHead>
                )}
                {(visibleColumns.email || visibleColumns.phone) && (
                  <TableHead className="w-[200px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("email")}
                    >
                      연락처
                      {getSortIcon("email")}
                    </button>
                  </TableHead>
                )}
                {visibleColumns.birth_date && (
                  <TableHead className="hidden sm:table-cell w-[120px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("birth_date")}
                    >
                      생년월일
                      {getSortIcon("birth_date")}
                    </button>
                  </TableHead>
                )}
                {visibleColumns.gender && (
                  <TableHead className="hidden sm:table-cell w-[80px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("gender")}
                    >
                      성별
                      {getSortIcon("gender")}
                    </button>
                  </TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead className="w-[100px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("status")}
                    >
                      상태
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                )}
                {visibleColumns.category && (
                  <TableHead className="hidden sm:table-cell w-[120px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("category")}
                    >
                      카테고리
                      {getSortIcon("category")}
                    </button>
                  </TableHead>
                )}
                {visibleColumns.notes && (
                  <TableHead className="hidden sm:table-cell w-[150px] text-xs sm:text-sm">
                    <button
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => handleSort("notes")}
                    >
                      비고
                      {getSortIcon("notes")}
                    </button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParticipants.map((participant) => (
                <TableRow
                  key={participant.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => handleParticipantRowClick(participant)}
                  style={{ height: "60px" }}
                >
                  {visibleColumns.name && (
                    <TableCell className="font-medium text-xs sm:text-sm py-2  align-middle">
                      <div className="flex flex-col justify-center ">
                        <span className="font-medium">{participant.name}</span>
                        {participant.english_name && (
                          <span className="text-xs text-gray-500">
                            {participant.english_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {(visibleColumns.email || visibleColumns.phone) && (
                    <TableCell className="py-2  align-middle">
                      <div className="flex flex-col justify-center ">
                        {visibleColumns.email && participant.email && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm mb-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {participant.email}
                            </span>
                          </div>
                        )}
                        {visibleColumns.phone && participant.phone && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {participant.phone}
                          </div>
                        )}
                        {!participant.email && !participant.phone && (
                          <span className="text-gray-400 text-xs sm:text-sm">
                            -
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.birth_date && (
                    <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-2  align-middle">
                      <div className="flex items-center ">
                        {participant.birth_date || "-"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.gender && (
                    <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-2  align-middle">
                      <div className="flex items-center ">
                        {participant.gender || "-"}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell className="py-2  align-middle">
                      <div className="flex items-center ">
                        {getStatusBadge(participant.status)}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.category && (
                    <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-2  align-middle">
                      <div className="flex items-center ">
                        <Badge variant="outline" className="text-xs">
                          {participant.category || "-"}
                        </Badge>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.notes && (
                    <TableCell className="text-xs sm:text-sm text-gray-600 hidden sm:table-cell py-2  align-middle">
                      <div className="max-w-xs flex items-center ">
                        {participant.notes ? (
                          <div className="truncate" title={participant.notes}>
                            {participant.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {paginatedParticipants.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={
                      Object.values(visibleColumns).filter(Boolean).length
                    }
                    className="text-center py-8 text-gray-500"
                  >
                    {getActiveFiltersCount() > 0
                      ? "필터 조건에 맞는 참가자가 없습니다."
                      : "등록된 참가자가 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 컨트롤 */}
        {totalPages > 1 && (
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
                  
                  return Array.from({ length: endPage - startPage + 1 }, (_, i) => (
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
                  ));
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
        )}

        {/* 필터 모달 */}
        <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle>참가자 필터</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Accordion type="multiple" className="w-full space-y-2">
                {/* 상태 필터 */}
                <AccordionItem
                  value="statuses"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-statuses"
                        checked={participantFilters.statuses.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setParticipantFilters((prev) => ({
                              ...prev,
                              statuses: statuses,
                            }));
                          } else {
                            setParticipantFilters((prev) => ({
                              ...prev,
                              statuses: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-statuses"
                        className="text-sm font-medium cursor-pointer"
                      >
                        상태
                      </Label>
                      {participantFilters.statuses.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({participantFilters.statuses.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {statuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={participantFilters.statuses.includes(
                              status
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setParticipantFilters((prev) => ({
                                  ...prev,
                                  statuses: [...prev.statuses, status],
                                }));
                              } else {
                                setParticipantFilters((prev) => ({
                                  ...prev,
                                  statuses: prev.statuses.filter(
                                    (s) => s !== status
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`status-${status}`}
                            className="text-sm"
                          >
                            {status}
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
                        checked={participantFilters.categories.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setParticipantFilters((prev) => ({
                              ...prev,
                              categories: categories,
                            }));
                          } else {
                            setParticipantFilters((prev) => ({
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
                      {participantFilters.categories.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({participantFilters.categories.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {categories.map((category) => (
                        <div
                          key={category}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`category-${category}`}
                            checked={participantFilters.categories.includes(
                              category
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setParticipantFilters((prev) => ({
                                  ...prev,
                                  categories: [...prev.categories, category],
                                }));
                              } else {
                                setParticipantFilters((prev) => ({
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

                {/* 성별 필터 */}
                <AccordionItem
                  value="genders"
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-genders"
                        checked={participantFilters.genders.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setParticipantFilters((prev) => ({
                              ...prev,
                              genders: ["남성", "여성"],
                            }));
                          } else {
                            setParticipantFilters((prev) => ({
                              ...prev,
                              genders: [],
                            }));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor="filter-genders"
                        className="text-sm font-medium cursor-pointer"
                      >
                        성별
                      </Label>
                      {participantFilters.genders.length > 0 && (
                        <span className="text-xs text-gray-500">
                          ({participantFilters.genders.length}개 선택)
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-32 overflow-y-auto space-y-2 pl-6">
                      {["남성", "여성"].map((gender) => (
                        <div
                          key={gender}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`gender-${gender}`}
                            checked={participantFilters.genders.includes(
                              gender
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setParticipantFilters((prev) => ({
                                  ...prev,
                                  genders: [...prev.genders, gender],
                                }));
                              } else {
                                setParticipantFilters((prev) => ({
                                  ...prev,
                                  genders: prev.genders.filter(
                                    (g) => g !== gender
                                  ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`gender-${gender}`}
                            className="text-sm"
                          >
                            {gender}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setParticipantFilters({
                    statuses: [],
                    categories: [],
                    genders: [],
                  });
                }}
              >
                초기화
              </Button>
              <Button onClick={() => setIsFilterModalOpen(false)}>적용</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 참여자 수정/삭제 액션 다이얼로그 */}
        <AlertDialog
          open={isParticipantActionDialogOpen}
          onOpenChange={setIsParticipantActionDialogOpen}
        >
          <AlertDialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>참가자 정보</AlertDialogTitle>
              <AlertDialogDescription>
                선택한 참가자 정보를 확인하고 수정하거나 삭제할 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {selectedParticipantForAction && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">이름:</span>
                      <div className="ml-2 flex flex-col">
                        <span className="font-medium">
                          {selectedParticipantForAction.name}
                        </span>
                        {selectedParticipantForAction.english_name && (
                          <span className="text-xs text-gray-500">
                            {selectedParticipantForAction.english_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">상태:</span>
                      <span className="ml-2">
                        {getStatusBadge(selectedParticipantForAction.status)}
                      </span>
                    </div>
                    {selectedParticipantForAction.email && (
                      <div>
                        <span className="text-gray-500">이메일:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.email}
                        </span>
                      </div>
                    )}
                    {selectedParticipantForAction.phone && (
                      <div>
                        <span className="text-gray-500">연락처:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.phone}
                        </span>
                      </div>
                    )}
                    {selectedParticipantForAction.birth_date && (
                      <div>
                        <span className="text-gray-500">생년월일:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.birth_date}
                        </span>
                      </div>
                    )}
                    {selectedParticipantForAction.gender && (
                      <div>
                        <span className="text-gray-500">성별:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.gender}
                        </span>
                      </div>
                    )}
                    {selectedParticipantForAction.category && (
                      <div>
                        <span className="text-gray-500">카테고리:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.category}
                        </span>
                      </div>
                    )}
                    {selectedParticipantForAction.notes && (
                      <div className="col-span-2">
                        <span className="text-gray-500">비고:</span>
                        <span className="ml-2 font-medium">
                          {selectedParticipantForAction.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setIsParticipantActionDialogOpen(false)}
              >
                닫기
              </AlertDialogCancel>
              {hasEditPermission && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEdit(selectedParticipantForAction);
                      setIsParticipantActionDialogOpen(false);
                    }}
                  >
                    수정
                  </Button>
                  <AlertDialogAction
                    onClick={() => {
                      setIsParticipantActionDialogOpen(false);
                      handleDelete(selectedParticipantForAction.id);
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

        {/* 참여자 삭제 확인 다이얼로그 */}
        <AlertDialog
          open={participantDeleteConfirmOpen}
          onOpenChange={setParticipantDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>참가자 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 참가자를 삭제하시겠습니까? 이 작업은 되돌릴 수
                없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteParticipant}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
