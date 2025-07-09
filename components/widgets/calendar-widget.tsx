"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/hooks/use-toast";
import {
  logCalendarEventCreate,
  logCalendarEventUpdate,
  logCalendarEventDelete,
} from "@/services/activityLogService";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  category: string;
  color: string;
  created_by: string;
  department?: string;
  is_all_day: boolean;
  created_at: string;
}

interface CalendarWidgetProps {
  widgetId: string;
  settings?: {
    title?: string;
    calendar_title?: string;
    calendar_height?: number;
    default_view?: "week" | "month" | "year";
    show_add_button?: boolean;
    show_category_filter?: boolean;
    show_department_filter?: boolean;
    show_view_toggle?: boolean;
    show_navigation?: boolean;
    base_categories?: Array<{
      id: string;
      name: string;
      color: string;
      description?: string;
    }>;
    custom_categories?: Array<{
      id: string;
      name: string;
      color: string;
      description?: string;
    }>;
    base_departments?: Array<{
      id: string;
      name: string;
      manager?: string;
      description?: string;
    }>;
    custom_departments?: Array<{
      id: string;
      name: string;
      manager?: string;
      description?: string;
    }>;
    allowed_categories?: string[];
    allowed_departments?: string[];
    height?: string;
  };
}

const CATEGORY_COLORS = {
  worship: "#3B82F6", // 예배
  meeting: "#10B981", // 모임
  education: "#F59E0B", // 교육
  event: "#EF4444", // 행사
  service: "#8B5CF6", // 봉사
  fellowship: "#EC4899", // 친교
  mission: "#06B6D4", // 선교
  other: "#6B7280", // 기타
};

const DEPARTMENTS = [
  "전체",
  "목회부",
  "교육부",
  "찬양부",
  "선교부",
  "봉사부",
  "청년부",
  "장년부",
  "유년부",
  "기타",
];

export default function CalendarWidget({
  widgetId,
  settings = {},
}: CalendarWidgetProps) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month" | "year">(
    settings.default_view || "month"
  );
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // 폼 상태
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    category: "other",
    department: "전체",
    is_all_day: false,
  });

  // 기본 카테고리와 커스텀 카테고리 합치기
  const getAllCategories = () => {
    const baseCategories = settings.base_categories || [
      { id: "worship", name: "예배", color: "#3B82F6" },
      { id: "meeting", name: "모임", color: "#10B981" },
      { id: "education", name: "교육", color: "#F59E0B" },
      { id: "event", name: "행사", color: "#EF4444" },
      { id: "service", name: "봉사", color: "#8B5CF6" },
      { id: "fellowship", name: "친교", color: "#EC4899" },
      { id: "mission", name: "선교", color: "#06B6D4" },
      { id: "other", name: "기타", color: "#6B7280" },
    ];

    const customCategories = settings.custom_categories || [];
    return [...baseCategories, ...customCategories];
  };

  // 기본 부서와 커스텀 부서 합치기
  const getAllDepartments = () => {
    const baseDepartments = (
      settings.base_departments || [
        { id: "all", name: "전체", manager: "", description: "" },
        { id: "ministry", name: "목회부", manager: "", description: "" },
        { id: "education", name: "교육부", manager: "", description: "" },
        { id: "worship", name: "찬양부", manager: "", description: "" },
        { id: "mission", name: "선교부", manager: "", description: "" },
        { id: "service", name: "봉사부", manager: "", description: "" },
        { id: "youth", name: "청년부", manager: "", description: "" },
        { id: "adult", name: "장년부", manager: "", description: "" },
        { id: "children", name: "유년부", manager: "", description: "" },
        { id: "other", name: "기타", manager: "", description: "" },
      ]
    ).map((dept: any) => dept.name);

    const customDepartments = (settings.custom_departments || []).map(
      (dept) => dept.name
    );
    return [...baseDepartments, ...customDepartments];
  };

  // 카테고리 색상 가져오기
  const getCategoryColor = (categoryId: string) => {
    // 기본 카테고리 색상 확인
    if (CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS]) {
      return CATEGORY_COLORS[categoryId as keyof typeof CATEGORY_COLORS];
    }

    // 커스텀 카테고리 색상 확인
    const customCategory = settings.custom_categories?.find(
      (cat) => cat.id === categoryId
    );
    if (customCategory) {
      return customCategory.color;
    }

    return "#6B7280"; // 기본 색상
  };

  // 시간 포맷팅 함수 (초 제거)
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    return timeString.substring(0, 5); // HH:MM 형식으로 자르기
  };

  // 필터링된 이벤트 가져오기
  const getFilteredEvents = () => {
    return events.filter((event: any) => {
      const categoryMatch =
        categoryFilter === "all" || event.category === categoryFilter;
      const departmentMatch =
        departmentFilter === "all" || event.department === departmentFilter;
      return categoryMatch && departmentMatch;
    });
  };

  // SWR로 일정 데이터 관리
  const { data: events = [], error, isLoading, mutate } = useSWR(
    ["calendar_events", currentDate, view],
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    {
      // 전역 설정 사용
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "오류",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    // 필수 필드 검증
    if (!formData.title.trim()) {
      toast({
        title: "오류",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_date) {
      toast({
        title: "오류",
        description: "시작일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      ...formData,
      // 종일 일정일 때는 시간 필드를 null로 설정
      start_time: formData.is_all_day ? null : formData.start_time,
      end_time: formData.is_all_day ? null : formData.end_time,
      color: getCategoryColor(formData.category),
      created_by: user.id,
    };

    // 로그에 사용할 세부 정보
    const logDetails = {
      start_date: formData.start_date,
      end_date: formData.end_date,
      category: formData.category,
      department: formData.department,
      is_all_day: formData.is_all_day,
      has_location: !!formData.location,
      has_description: !!formData.description,
    };

    if (isEditing && selectedEvent) {
      const supabase = createClient();
      const { error } = await supabase
        .from("calendar_events")
        .update(eventData)
        .eq("id", selectedEvent.id);
      if (error) {
        toast({
          title: "저장 오류",
          description: error.message || "일정 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      // 수정 로그 기록
      await logCalendarEventUpdate(
        user.id,
        selectedEvent.id,
        formData.title,
        logDetails
      );

      toast({
        title: "성공",
        description: "일정이 수정되었습니다.",
      });
    } else {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("calendar_events")
        .insert([eventData])
        .select()
        .single();
      if (error) {
        toast({
          title: "저장 오류",
          description: error.message || "일정 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      // 생성 로그 기록
      if (data?.id) {
        await logCalendarEventCreate(
          user.id,
          data.id,
          formData.title,
          logDetails
        );
      }

      toast({
        title: "성공",
        description: "일정이 추가되었습니다.",
      });
    }

    mutate();
    resetForm();
    setShowEventDialog(false);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("정말로 이 일정을 삭제하시겠습니까?")) return;

    // 삭제할 이벤트 정보 미리 저장 (로그용)
    const eventToDelete = events.find((event: any) => event.id === eventId);
    const eventTitle = eventToDelete?.title || "제목 없음";
    const logDetails = {
      start_date: eventToDelete?.start_date,
      category: eventToDelete?.category,
      department: eventToDelete?.department,
      was_all_day: eventToDelete?.is_all_day,
    };

    const supabase = createClient();
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast({
        title: "삭제 오류",
        description: error.message || "일정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return;
    }

    // 삭제 로그 기록 (사용자 정보가 있는 경우)
    if (user?.id) {
      await logCalendarEventDelete(user.id, eventId, eventTitle, logDetails);
    }

    toast({
      title: "성공",
      description: "일정이 삭제되었습니다.",
    });

    mutate();
    setShowEventDialog(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      category: "other",
      department: "전체",
      is_all_day: false,
    });
    setIsEditing(false);
    setSelectedEvent(null);
  };

  const openDetailDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailDialog(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      start_date: event.start_date,
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      location: event.location || "",
      category: event.category,
      department: event.department || "전체",
      is_all_day: event.is_all_day,
    });
    setSelectedEvent(event);
    setIsEditing(true);
    setShowEventDialog(true);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "year") {
      newDate.setFullYear(
        newDate.getFullYear() + (direction === "next" ? 1 : -1)
      );
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    if (view === "month") {
      return `${year}년 ${month}월`;
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return `${startOfWeek.getMonth() + 1}월 ${startOfWeek.getDate()}일 - ${endOfWeek.getMonth() + 1}월 ${endOfWeek.getDate()}일`;
    } else {
      return `${year}년`;
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const dayEvents = getFilteredEvents().filter((event: any) => {
      return event.start_date === dateString;
    });

    // 시간순으로 정렬: 종일 일정 먼저, 그 다음 시간순
    return dayEvents.sort((a: any, b: any) => {
      // 종일 일정은 맨 위에
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;

      // 둘 다 종일 일정이면 제목순
      if (a.is_all_day && b.is_all_day) {
        return a.title.localeCompare(b.title);
      }

      // 둘 다 시간이 있는 일정이면 시간순
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }

      // 시간이 없는 일정은 뒤로
      if (a.start_time && !b.start_time) return -1;
      if (!a.start_time && b.start_time) return 1;

      // 둘 다 시간이 없으면 제목순
      return a.title.localeCompare(b.title);
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            일정을 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 pb-4">
            <Calendar className="w-5 h-5" />
            {settings.calendar_title || settings.title || "일정관리"}
          </CardTitle>

          {settings.show_add_button !== false && isAdmin && (
            <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  일정 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "일정 수정" : "새 일정 추가"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="start_date">시작일 *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">종료일</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_all_day"
                      checked={formData.is_all_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_all_day: e.target.checked,
                          // 종일 일정으로 변경 시 시간 필드 초기화
                          start_time: e.target.checked
                            ? ""
                            : formData.start_time,
                          end_time: e.target.checked ? "" : formData.end_time,
                        })
                      }
                    />
                    <Label htmlFor="is_all_day">종일</Label>
                  </div>

                  {!formData.is_all_day && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start_time">시작 시간</Label>
                        <Input
                          id="start_time"
                          type="time"
                          step="60"
                          value={formData.start_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">종료 시간</Label>
                        <Input
                          id="end_time"
                          type="time"
                          step="60"
                          value={formData.end_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="location">장소</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                          {getAllCategories().map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">부서</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) =>
                          setFormData({ ...formData, department: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllDepartments().map((dept: any) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      {isEditing && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            selectedEvent && handleDelete(selectedEvent.id)
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEventDialog(false)}
                      >
                        취소
                      </Button>
                      <Button type="submit">
                        {isEditing ? "수정" : "추가"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* 일정 상세보기 다이얼로그 */}
          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedEvent?.title}</span>
                  {isAdmin && selectedEvent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowDetailDialog(false);
                        openEditDialog(selectedEvent);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      편집
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4">
                  {selectedEvent.description && (
                    <div>
                      <Label className="text-sm font-medium">설명</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">시작일</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(selectedEvent.start_date).toLocaleDateString(
                          "ko-KR"
                        )}
                      </p>
                    </div>
                    {selectedEvent.end_date && (
                      <div>
                        <Label className="text-sm font-medium">종료일</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(selectedEvent.end_date).toLocaleDateString(
                            "ko-KR"
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {!selectedEvent.is_all_day &&
                    (selectedEvent.start_time || selectedEvent.end_time) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEvent.start_time && (
                          <div>
                            <Label className="text-sm font-medium">
                              시작 시간
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatTime(selectedEvent.start_time)}
                            </p>
                          </div>
                        )}
                        {selectedEvent.end_time && (
                          <div>
                            <Label className="text-sm font-medium">
                              종료 시간
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatTime(selectedEvent.end_time)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {selectedEvent.location && (
                    <div>
                      <Label className="text-sm font-medium">장소</Label>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">카테고리</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: selectedEvent.color }}
                        />
                        <span className="text-sm text-gray-600">
                          {getAllCategories().find(
                            (cat) => cat.id === selectedEvent.category
                          )?.name || selectedEvent.category}
                        </span>
                      </div>
                    </div>
                    {selectedEvent.department && (
                      <div>
                        <Label className="text-sm font-medium">부서</Label>
                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {selectedEvent.department}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedEvent.is_all_day && (
                    <div>
                      <Badge variant="secondary" className="text-xs">
                        종일 일정
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* 필터 섹션 */}
        {(settings.show_category_filter !== false ||
          settings.show_department_filter !== false) && (
          <div className="flex flex-wrap gap-3 mt-6 p-3 bg-gray-50 rounded-lg">
            {settings.show_category_filter !== false && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">카테고리:</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {getAllCategories().map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {settings.show_department_filter !== false && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">부서:</Label>
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {getAllDepartments().map((dept: any) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 활성 필터 표시 */}
            <div className="flex items-center gap-2 ml-auto">
              {(categoryFilter !== "all" || departmentFilter !== "all") && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">
                    필터: {getFilteredEvents().length}개 일정
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setCategoryFilter("all");
                      setDepartmentFilter("all");
                    }}
                    title="필터 초기화"
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          {settings.show_navigation !== false && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="font-medium text-lg min-w-[200px] text-center">
                {getDateRangeText()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {settings.show_view_toggle !== false && (
            <div className="flex gap-1">
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
              >
                주간
              </Button>
              <Button
                variant={view === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("month")}
              >
                월간
              </Button>
              <Button
                variant={view === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("year")}
              >
                연간
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">일정을 불러오는 중...</div>
          </div>
        ) : (
          <div>
            {view === "month" && <MonthView />}
            {view === "week" && <WeekView />}
            {view === "year" && <YearView />}
          </div>
        )}
      </CardContent>
    </Card>
  );

  function MonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="flex flex-col">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day: any) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index: any) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`p-1 border rounded min-h-[120px] ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
              >
                <div
                  className={`text-sm mb-1 ${
                    isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  } ${isToday ? "font-bold" : ""}`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 4).map((event: any) => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded cursor-pointer hover:opacity-80 relative group"
                      style={{
                        backgroundColor: getCategoryColor(event.category),
                        color: "white",
                      }}
                      onClick={() => openDetailDialog(event)}
                      title={`${event.title} ${event.department ? `(${event.department})` : ""}`}
                    >
                      <div className="leading-tight">
                        {event.title.length > 8
                          ? event.title.substring(0, 8) + "..."
                          : event.title}
                      </div>
                      {isAdmin && (
                        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
                            }}
                          >
                            <Edit className="h-2.5 w-2.5 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayEvents.length - 4}개 더
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function WeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return (
      <div className="flex flex-col">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map((day, index: any) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);

            return (
              <div
                key={index}
                className={`p-3 border rounded min-h-[200px] ${
                  isToday ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white"
                }`}
              >
                <div
                  className={`text-center mb-2 ${
                    isToday ? "font-bold text-blue-600" : "text-gray-700"
                  }`}
                >
                  <div className="text-xs">
                    {["일", "월", "화", "수", "목", "금", "토"][index]}
                  </div>
                  <div className="text-lg">{day.getDate()}</div>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="text-xs p-2 rounded cursor-pointer hover:opacity-80 relative group"
                      style={{
                        backgroundColor: getCategoryColor(event.category),
                        color: "white",
                      }}
                      onClick={() => openDetailDialog(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      {event.start_time && (
                        <div className="opacity-80">
                          {formatTime(event.start_time)}
                        </div>
                      )}
                      {event.department && (
                        <div className="opacity-80">({event.department})</div>
                      )}
                      {isAdmin && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(event);
                            }}
                          >
                            <Edit className="h-3 w-3 text-white" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function YearView() {
    const year = currentDate.getFullYear();
    const months = [];

    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }

    return (
      <div>
        <div className="grid grid-cols-3 gap-4">
          {months.map((month, index: any) => {
            const monthEvents = getFilteredEvents()
              .filter((event: any) => {
                const eventDate = new Date(event.start_date);
                return (
                  eventDate.getFullYear() === year &&
                  eventDate.getMonth() === index
                );
              })
              .sort((a: any, b: any) => {
                // 날짜순 먼저, 그 다음 시간순
                const dateCompare = a.start_date.localeCompare(b.start_date);
                if (dateCompare !== 0) return dateCompare;

                // 같은 날짜 내에서 시간순 정렬
                if (a.is_all_day && !b.is_all_day) return -1;
                if (!a.is_all_day && b.is_all_day) return 1;

                if (a.is_all_day && b.is_all_day) {
                  return a.title.localeCompare(b.title);
                }

                if (a.start_time && b.start_time) {
                  return a.start_time.localeCompare(b.start_time);
                }

                if (a.start_time && !b.start_time) return -1;
                if (!a.start_time && b.start_time) return 1;

                return a.title.localeCompare(b.title);
              });

            return (
              <div
                key={index}
                className="p-3 border rounded bg-white cursor-pointer hover:bg-gray-50 min-h-[150px]"
                onClick={() => {
                  setCurrentDate(month);
                  setView("month");
                }}
              >
                <div className="text-center font-medium mb-2">
                  {month.getMonth() + 1}월
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {monthEvents.length}개 일정
                </div>
                {monthEvents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {monthEvents.slice(0, 10).map((event: any) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded"
                        style={{
                          backgroundColor: getCategoryColor(event.category),
                          color: "white",
                        }}
                      >
                        {event.title.length > 10
                          ? event.title.substring(0, 10) + "..."
                          : event.title}
                      </div>
                    ))}
                    {monthEvents.length > 10 && (
                      <div className="text-xs text-gray-500">
                        +{monthEvents.length - 10}개 더
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
