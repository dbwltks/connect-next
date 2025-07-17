"use client";

import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageBrowser from "@/components/ui/image-browser";

import { MediaWidget } from "../widgets/media-widget";
import { BoardlistWidget, BOARD_TEMPLATE } from "../widgets/boardlist-widget";
import { BoardWidget } from "../widgets/board-widget";
import LocationWidget from "../widgets/location-widget";
import MenuListWidget from "../widgets/menu-list-widget";
import { StripWidget } from "../widgets/strip-widget";
import PopularPostsWidget from "../widgets/popular-posts-widget";
import { CarouselWidget, CAROUSEL_TYPES } from "../widgets/carousel-widget";
import {
  OrganizationChartWidget,
  CHART_STYLES,
} from "../widgets/organization-chart-widget";
import CalendarWidget from "../widgets/calendar-widget";
import SimpleCalendarWidget from "../widgets/simple-calendar-widget";
import ProgramsWidget from "../widgets/programs-widget";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  MoveVertical,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { IWidget } from "@/types";

// 위젯 타입 정의 (IWidget으로 대체)
/*
export type Widget = {
  id: string;
  type: string;
  title: string;
  content?: string;
  settings?: any;
  column_position: number;
  order: number;
  width: number; // 1-12 (12 column grid system)
  height?: number; // 위젯 높이 (px 단위)
  display_options?: {
    item_count?: number; // 표시할 아이템 개수
    show_thumbnail?: boolean; // 썸네일 표시 여부
    show_date?: boolean; // 날짜 표시 여부
    show_excerpt?: boolean; // 요약 표시 여부
    layout_type?: string | number; // 레이아웃 타입 (문자열 또는 숫자)
    
    // 미디어 위젯 관련 속성
    media_title?: string; // 미디어 섹션 제목
    media_subtitle?: string; // 미디어 섹션 부제목
    media_more_text?: string; // 더 많은 미디어 보기 텍스트
    
    // 위치 정보 위젯 관련 속성
    location_title?: string; // 위치 정보 섹션 제목
    location_subtitle?: string; // 위치 정보 섹션 부제목
    address?: string; // 주소
    phone?: string; // 전화번호
    email?: string; // 이메일
    map_url?: string; // 지도 링크 URL
    embed_map_url?: string; // 임베드 지도 URL
    
    page_id?: string; // 콘텐츠를 가져올 페이지 ID (미디어, 위치 등 공통)

    // 인기 게시글 위젯 관련 속성
    sort_by?: 'views' | 'likes' | 'comments';

    // 로그인 위젯 관련 속성
    logged_out_title?: string;
    logged_in_title?: string;
  };
  is_active: boolean;
  page_id?: string | null; // 위젯이 속한 페이지 ID
};
*/

// 레이아웃 영역 타입 정의
type LayoutArea = {
  id: string;
  name: string;
  widgets: IWidget[];
};

// 사용 가능한 위젯 타입
const WIDGET_TYPES = [
  { id: "banner", name: "배너" },
  { id: "board", name: "게시판 (목록)" },
  { id: "board-section", name: "게시판 (섹션)" },
  { id: "gallery", name: "갤러리" },
  { id: "media", name: "미디어" },
  { id: "location", name: "위치 정보" },
  { id: "menu-list", name: "메뉴 목록" },
  { id: "recent-comments", name: "최근 댓글" },
  { id: "popular-posts", name: "인기 게시글" },
  { id: "login", name: "로그인" },
  { id: "strip", name: "스트립(띠 배너)" },
  { id: "carousel", name: "캐러셀 슬라이드" },
  { id: "organization-chart", name: "조직도" },
  { id: "calendar", name: "캘린더" },
  { id: "simple-calendar", name: "간단 캘린더" },
  { id: "programs", name: "프로그램 위젯" },
];

export default function LayoutManager(): JSX.Element {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [layoutAreas, setLayoutAreas] = useState<LayoutArea[]>([
    { id: "main", name: "메인 영역1", widgets: [] },
  ]);
  const [editingWidget, setEditingWidget] = useState<IWidget | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingWidgetToArea, setAddingWidgetToArea] = useState<string | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [boardPosts, setBoardPosts] = useState<{ [key: string]: any[] }>({});
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null); // null은 홈페이지
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stripUploading, setStripUploading] = useState(false);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);
  const [carouselUploading, setCarouselUploading] = useState(false);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [memberImageUploading, setMemberImageUploading] = useState(false);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMenuItems();
    fetchBanners();
    fetchPages();
    fetchPrograms();
  }, []);

  // 페이지 또는 레이아웃 구조 변경 시 위젯 데이터 다시 로드
  useEffect(() => {
    const doFetch = async () => {
      setIsLoading(true);
      await fetchLayoutData(selectedPageId);
      setIsLoading(false);
    };
    doFetch();
  }, [selectedPageId]);

  // 메뉴 항목 가져오기
  const fetchMenuItems = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_menus")
        .select("*")
        .order("order_num", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error("메뉴 항목을 불러오는 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "메뉴 항목을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 배너 가져오기
  const fetchBanners = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_banners")
        .select("*")
        .eq("is_active", true)
        .is("menu_id", null)
        .order("order_num", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("배너를 불러오는 중 오류가 발생했습니다:", error);
    }
  };

  // 페이지 가져오기
  const fetchPages = async () => {
    console.log("fetchPages 함수 호출됨");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("cms_pages").select("*");

      if (error) throw error;
      setPages(data || []);

      // 게시판 타입 페이지의 경우 최신글 데이터 가져오기 시도
      const boardPages =
        data?.filter((page: any) => page.page_type === "board") || [];
      if (boardPages.length > 0) {
        try {
          // 각 게시판 페이지에 대한 더미 게시물 데이터 생성 (실제로는 API 호출 필요)
          const boardPostsMap: Record<string, any[]> = {};

          boardPages.forEach((page: any) => {
            // 각 게시판 페이지에 대해 5-10개의 더미 게시물 생성
            const postCount = Math.floor(Math.random() * 6) + 5; // 5-10개
            const posts = [];

            for (let i = 0; i < postCount; i++) {
              const date = new Date();
              date.setDate(date.getDate() - i); // 최근 날짜부터 역순으로

              posts.push({
                id: `dummy-${page.id}-${i}`,
                title: `${page.title} 관련 게시물 ${i + 1}`,
                excerpt: `${page.title}에 대한 간략한 내용이 표시됩니다. 이 부분은 게시물의 요약 내용입니다.`,
                author: "관리자",
                created_at: date.toISOString(),
                view_count: Math.floor(Math.random() * 100),
              });
            }

            boardPostsMap[String(page.id)] = posts;
          });

          setBoardPosts(boardPostsMap);
        } catch (postError) {
          console.error(
            "게시물 데이터를 불러오는 중 오류가 발생했습니다:",
            postError
          );
        }
      }
    } catch (error) {
      console.error("페이지를 불러오는 중 오류가 발생했습니다:", error);
    }
  };

  // 프로그램 데이터 가져오기
  const fetchPrograms = async () => {
    console.log("fetchPrograms 함수 호출됨");
    try {
      const supabase = createClient();
      const { data: programsData, error: programsError } = await supabase
        .from("programs")
        .select("*");
      if (programsError) {
        console.error("프로그램 데이터 로드 실패:", programsError);
      } else {
        console.log("프로그램 데이터 로드 성공:", programsData);
        setPrograms(programsData || []);
      }
    } catch (error) {
      console.error("프로그램을 불러오는 중 오류가 발생했습니다:", error);
    }
  };

  // 레이아웃 데이터 가져오기
  const fetchLayoutData = async (pageId: string | null) => {
    try {
      const supabase = createClient();
      let query = supabase
        .from("cms_layout")
        .select("*")
        .order("order", { ascending: true });

      if (pageId) {
        query = query.eq("page_id", pageId);
      } else {
        query = query.is("page_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const areas: LayoutArea[] = [
        { id: "left", name: "왼쪽 사이드바", widgets: [] },
        { id: "main", name: "메인 영역", widgets: [] },
        { id: "right", name: "오른쪽 사이드바", widgets: [] },
      ];
      const allWidgets = data || [];

      allWidgets.forEach((w: any) => {
        if (w.column_position === 0) areas[0].widgets.push(w);
        else if (w.column_position === 2) areas[2].widgets.push(w);
        else areas[1].widgets.push(w); // main: 1 or null
      });

      // 각 영역 내에서 위젯 순서 정렬
      areas.forEach((area) => {
        area.widgets.sort((a, b) => a.order - b.order);
      });

      setLayoutAreas(areas);
      return true; // 성공적으로 데이터를 가져왔음을 반환
    } catch (error) {
      console.error(
        "레이아웃 데이터를 불러오는 중 오류가 발생했습니다:",
        error
      );
      toast({
        title: "오류",
        description: "레이아웃 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      return false; // 오류 발생 시 false 반환
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragEnd = async (result: any) => {
    const { source, destination } = result;

    // 드롭 위치가 없는 경우 (드래그만 하고 원위치)
    if (!destination) return;

    // 같은 위치로 드롭한 경우
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newLayoutAreas = JSON.parse(JSON.stringify(layoutAreas));

    const sourceArea = newLayoutAreas.find(
      (a: LayoutArea) => a.id === source.droppableId
    );
    const destArea = newLayoutAreas.find(
      (a: LayoutArea) => a.id === destination.droppableId
    );

    // 같은 영역 내에서 순서 변경
    if (source.droppableId === destination.droppableId) {
      const [movedWidget] = sourceArea.widgets.splice(source.index, 1);
      destArea.widgets.splice(destination.index, 0, movedWidget);

      const updatedWidgets = destArea.widgets.map(
        (widget: IWidget, index: number) => ({
          ...widget,
          order: index,
        })
      );
      destArea.widgets = updatedWidgets;

      setLayoutAreas(newLayoutAreas);

      // DB 업데이트
      try {
        setIsLoading(true);
        const supabase = createClient();
        for (const widget of updatedWidgets) {
          await supabase
            .from("cms_layout")
            .update({ order: widget.order })
            .eq("id", widget.id);
        }
        toast({
          title: "성공",
          description: "위젯 순서가 업데이트되었습니다.",
        });
      } catch (error) {
        console.error("위젯 순서 업데이트 중 오류:", error);
        toast({
          title: "오류",
          description: "위젯 순서 업데이트 중 오류 발생",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // 다른 영역으로 이동
      const areaIdToColPos: { [key: string]: number } = {
        left: 0,
        main: 1,
        right: 2,
      };

      const [movedWidget] = sourceArea.widgets.splice(source.index, 1);
      const newColumnPosition = areaIdToColPos[destination.droppableId];
      movedWidget.column_position = newColumnPosition;

      destArea.widgets.splice(destination.index, 0, movedWidget);

      // 각 영역의 순서 업데이트
      sourceArea.widgets.forEach((widget: IWidget, index: number) => {
        widget.order = index;
      });
      destArea.widgets.forEach((widget: IWidget, index: number) => {
        widget.order = index;
      });

      setLayoutAreas(newLayoutAreas);

      // DB 업데이트
      try {
        setIsLoading(true);

        // 이동된 위젯 업데이트 (위치 및 순서)
        const supabase = createClient();
        await supabase
          .from("cms_layout")
          .update({
            column_position: newColumnPosition,
            order: movedWidget.order,
          })
          .eq("id", movedWidget.id);

        // 이전 영역의 위젯들 순서 업데이트
        for (const widget of sourceArea.widgets) {
          await supabase
            .from("cms_layout")
            .update({ order: widget.order })
            .eq("id", widget.id);
        }

        // 새 영역의 위젯들 순서 업데이트 (이동된 위젯 제외)
        for (const widget of destArea.widgets) {
          if (widget.id !== movedWidget.id) {
            await supabase
              .from("cms_layout")
              .update({ order: widget.order })
              .eq("id", widget.id);
          }
        }

        toast({
          title: "성공",
          description: "위젯 위치가 업데이트되었습니다.",
        });
      } catch (error) {
        console.error("위젯 위치 업데이트 중 오류가 발생했습니다:", error);
        toast({
          title: "오류",
          description: "위젯 위치 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 새 위젯 추가
  const addNewWidget = async (
    type: string,
    targetAreaId: string,
    sourceItem?: any
  ) => {
    if (!targetAreaId) {
      console.error("위젯을 추가할 영역이 지정되지 않았습니다.");
      toast({
        title: "오류",
        description: "위젯을 추가할 영역을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const targetArea = layoutAreas.find((a) => a.id === targetAreaId);
      if (!targetArea) {
        console.error(`영역(ID: ${targetAreaId})을 찾을 수 없습니다.`);
        toast({
          title: "오류",
          description: "지정된 영역을 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }
      const areaIdToColPos: { [key: string]: number } = {
        left: 0,
        main: 1,
        right: 2,
      };
      const newColumnPosition = areaIdToColPos[targetAreaId];

      // 기본 위젯 설정
      const newWidgetData: Omit<IWidget, "id" | "created_at"> = {
        type,
        title:
          sourceItem?.title ||
          WIDGET_TYPES.find((w) => w.id === type)?.name ||
          "새 위젯",
        content: sourceItem?.content || "",
        column_position: newColumnPosition,
        order: targetArea.widgets.length,
        width: 12,
        is_active: true,
        settings: {
          source_id: sourceItem?.id || null,
          source_type: type,
          url: sourceItem?.url || null,
          ...(type === "strip" ? { strip_type: "image", strip_value: "" } : {}),
        },
        page_id: selectedPageId,
      };

      // DB에 위젯 추가
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cms_layout")
        .insert(newWidgetData)
        .select()
        .single();

      if (error) throw error;

      // 상태 업데이트
      const newLayoutAreas = [...layoutAreas];
      const finalTargetArea = newLayoutAreas.find((a) => a.id === targetAreaId);
      if (finalTargetArea) {
        finalTargetArea.widgets.push(data);
      }
      setLayoutAreas(newLayoutAreas);

      toast({
        title: "성공",
        description: "새 위젯이 추가되었습니다.",
      });
    } catch (error) {
      console.error("위젯 추가 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "위젯 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 위젯 삭제
  const deleteWidget = async (widgetId: string) => {
    try {
      setIsLoading(true);

      // DB에서 위젯 삭제
      const supabase = createClient();
      const { error } = await supabase
        .from("cms_layout")
        .delete()
        .eq("id", widgetId);

      if (error) throw error;

      // 상태 업데이트
      const newLayoutAreas = layoutAreas.map((area: any) => ({
        ...area,
        widgets: area.widgets.filter((widget: any) => widget.id !== widgetId),
      }));

      setLayoutAreas(newLayoutAreas);

      toast({
        title: "성공",
        description: "위젯이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("위젯 삭제 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "위젯 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 조직원 관리 함수들
  const addOrUpdateMember = (memberData: any) => {
    if (!editingWidget) return;

    let currentMembers = editingWidget.settings?.custom_data || [];

    if (editingMember && editingMember.id) {
      // 기존 멤버 수정 (id가 있는 경우)
      currentMembers = currentMembers.map((member: any) =>
        member.id === editingMember.id
          ? { ...memberData, id: editingMember.id }
          : member
      );
    } else {
      // 새 멤버 추가 (id가 없거나 editingMember가 빈 객체인 경우)
      const newMember = {
        ...memberData,
        id: Date.now().toString(),
      };
      currentMembers = [...currentMembers, newMember];
    }

    setEditingWidget({
      ...editingWidget,
      settings: {
        ...editingWidget.settings,
        custom_data: currentMembers,
      },
    });

    toast({
      title:
        editingMember && editingMember.id
          ? "조직원 수정 완료"
          : "조직원 추가 완료",
      description: `${memberData.name}님이 ${editingMember && editingMember.id ? "수정" : "추가"}되었습니다.`,
    });
  };

  const deleteMember = (memberId: string) => {
    if (!editingWidget) return;

    const currentMembers = editingWidget.settings?.custom_data || [];
    const updatedMembers = currentMembers.filter(
      (member: any) => member.id !== memberId
    );

    setEditingWidget({
      ...editingWidget,
      settings: {
        ...editingWidget.settings,
        custom_data: updatedMembers,
      },
    });

    toast({
      title: "조직원 삭제 완료",
      description: "조직원이 삭제되었습니다.",
    });
  };

  // 조직원 순서 변경 함수 (위/아래 이동)
  const moveMember = (index: number, direction: "up" | "down") => {
    if (!editingWidget) return;

    const currentData = [...(editingWidget.settings?.custom_data || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= currentData.length) return;

    // 두 요소의 위치를 바꿈
    [currentData[index], currentData[newIndex]] = [
      currentData[newIndex],
      currentData[index],
    ];

    setEditingWidget({
      ...editingWidget,
      settings: {
        ...editingWidget.settings,
        custom_data: currentData,
      },
    });

    toast({
      title: "순서 변경",
      description: `조직원이 ${direction === "up" ? "위로" : "아래로"} 이동되었습니다.`,
    });
  };

  // 위젯 설정 저장
  const saveWidgetSettings = async () => {
    if (!editingWidget) return;

    try {
      setIsLoading(true);

      // DB 업데이트
      const supabase = createClient();
      const { error } = await supabase
        .from("cms_layout")
        .update({
          title: editingWidget.title,
          content: editingWidget.content,
          width: editingWidget.width,
          height: editingWidget.height,
          display_options: editingWidget.display_options,
          is_active: editingWidget.is_active,
          settings: editingWidget.settings,
        })
        .eq("id", editingWidget.id);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // 상태 업데이트
      const newLayoutAreas = layoutAreas.map((area: any) => ({
        ...area,
        widgets: area.widgets.map((widget: any) =>
          widget.id === editingWidget.id ? editingWidget : widget
        ),
      }));

      setLayoutAreas(newLayoutAreas);

      toast({
        title: "성공",
        description: "위젯 설정이 저장되었습니다.",
      });

      // 레이아웃 데이터 다시 불러오기 - 비동기 처리 개선
      await fetchLayoutData(selectedPageId);

      // 다이얼로그 상태 초기화는 데이터 로딩 후에 처리
      setDialogOpen(false);
      setShowWidgetSettings(false);
      setEditingWidget(null);
    } catch (error) {
      console.error("위젯 설정 저장 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "위젯 설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      // 반드시 로딩 상태 해제
      setIsLoading(false);
    }
  };

  // 위젯 설정 UI 렌더링
  const renderWidgetSettingsDialog = () => {
    if (!editingWidget) return null;

    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>위젯 설정: {editingWidget.title}</DialogTitle>
            <DialogDescription>
              위젯의 속성을 설정하고 저장 버튼을 클릭하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="widget-title">제목</Label>
              <Input
                id="widget-title"
                value={editingWidget.title}
                onChange={(e) =>
                  setEditingWidget({
                    ...editingWidget,
                    title: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="widget-width">너비</Label>
                <Select
                  value={editingWidget.width.toString()}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      width: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="너비 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">25% (3/12)</SelectItem>
                    <SelectItem value="4">33% (4/12)</SelectItem>
                    <SelectItem value="6">50% (6/12)</SelectItem>
                    <SelectItem value="8">66% (8/12)</SelectItem>
                    <SelectItem value="9">75% (9/12)</SelectItem>
                    <SelectItem value="12">100% (12/12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="widget-height">높이 (px)</Label>
                <Input
                  id="widget-height"
                  type="number"
                  placeholder="자동 조절"
                  value={editingWidget.height || ""}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      height: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* 콘텐츠 표시 옵션 - 페이지 타입인 경우에만 표시 */}
            {editingWidget.type === "page" && (
              <div className="space-y-4 border rounded-md p-3 bg-gray-50">
                <h4 className="font-medium text-sm">콘텐츠 표시 옵션</h4>

                <div className="space-y-2">
                  <Label htmlFor="item-count">표시할 아이템 개수</Label>
                  <Select
                    value={(
                      editingWidget.display_options?.item_count || 5
                    ).toString()}
                    onValueChange={(value) =>
                      setEditingWidget({
                        ...editingWidget,
                        display_options: {
                          ...editingWidget.display_options,
                          item_count: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="개수 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3개</SelectItem>
                      <SelectItem value="5">5개</SelectItem>
                      <SelectItem value="10">10개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layout-type">레이아웃 타입</Label>
                  <Select
                    value={String(
                      editingWidget.display_options?.layout_type || "list"
                    )}
                    onValueChange={(value) =>
                      setEditingWidget({
                        ...editingWidget,
                        display_options: {
                          ...editingWidget.display_options,
                          layout_type: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="레이아웃 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">리스트형</SelectItem>
                      <SelectItem value="grid">그리드형</SelectItem>
                      <SelectItem value="card">카드형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-thumbnail"
                      checked={
                        editingWidget.display_options?.show_thumbnail || false
                      }
                      onCheckedChange={(checked) => {
                        console.log("Thumbnail checked:", checked);
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_thumbnail: checked === true,
                          },
                        });
                      }}
                    />
                    <Label htmlFor="show-thumbnail">썸네일 표시</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-date"
                      checked={
                        editingWidget.display_options?.show_date || false
                      }
                      onCheckedChange={(checked) => {
                        console.log("Date checked:", checked);
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_date: checked === true,
                          },
                        });
                      }}
                    />
                    <Label htmlFor="show-date">날짜 표시</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-excerpt"
                      checked={
                        editingWidget.display_options?.show_excerpt || false
                      }
                      onCheckedChange={(checked) => {
                        console.log("Excerpt checked:", checked);
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            show_excerpt: checked === true,
                          },
                        });
                      }}
                    />
                    <Label htmlFor="show-excerpt">요약 표시</Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 게시판 위젯 전용 설정 */}
          {editingWidget.type === "board" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">게시판 (목록) 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="board-item-count">표시할 게시물 개수</Label>
                <Input
                  id="board-item-count"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  value={editingWidget.display_options?.item_count || 10}
                  onChange={(e) => {
                    let value = parseInt(e.target.value, 10);
                    if (isNaN(value) || value < 1) value = 1;
                    if (value > 10) value = 10;
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: value,
                      },
                    });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  최대 10개까지 입력할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-page">콘텐츠 페이지 선택</Label>
                <Select
                  value={editingWidget.display_options?.page_id || ""}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        page_id: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="페이지 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page: any) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  선택한 페이지의 게시물이 게시판 위젯에 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-layout">게시판 레이아웃 템플릿</Label>
                <Select
                  value={String(
                    editingWidget.display_options?.layout_type ||
                      BOARD_TEMPLATE.CLASSIC
                  )}
                  onValueChange={(value) => {
                    // 문자열을 숫자로 변환
                    const numericValue = parseInt(value, 10);

                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        layout_type: numericValue,
                      },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="템플릿 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(BOARD_TEMPLATE.CLASSIC)}>
                      클래식 - 기본 스타일
                    </SelectItem>
                    <SelectItem value={String(BOARD_TEMPLATE.COMPACT)}>
                      컴팩트 - 간결한 목록형
                    </SelectItem>
                    <SelectItem value={String(BOARD_TEMPLATE.CARD)}>
                      카드형 - 그리드 형태
                    </SelectItem>
                    <SelectItem value={String(BOARD_TEMPLATE.NOTICE)}>
                      공지형
                    </SelectItem>
                    <SelectItem value={String(BOARD_TEMPLATE.GALLERY)}>
                      갤러리형 - 썸네일만 큼직하게
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  게시판의 표시 레이아웃을 선택합니다. 레이아웃에 따라 썸네일 및
                  내용 표시가 달라집니다.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-thumbnail-board"
                    checked={
                      editingWidget.display_options?.show_thumbnail ?? true
                    }
                    onCheckedChange={(checked) => {
                      setEditingWidget({
                        ...editingWidget,
                        display_options: {
                          ...editingWidget.display_options,
                          show_thumbnail: checked === true,
                        },
                      });
                    }}
                  />
                  <Label htmlFor="show-thumbnail-board">썸네일 표시</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-date-board"
                    checked={editingWidget.display_options?.show_date ?? true}
                    onCheckedChange={(checked) => {
                      setEditingWidget({
                        ...editingWidget,
                        display_options: {
                          ...editingWidget.display_options,
                          show_date: checked === true,
                        },
                      });
                    }}
                  />
                  <Label htmlFor="show-date-board">작성일 표시</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-excerpt-board"
                    checked={
                      editingWidget.display_options?.show_excerpt ?? true
                    }
                    onCheckedChange={(checked) => {
                      setEditingWidget({
                        ...editingWidget,
                        display_options: {
                          ...editingWidget.display_options,
                          show_excerpt: checked === true,
                        },
                      });
                    }}
                  />
                  <Label htmlFor="show-excerpt-board">내용 요약 표시</Label>
                </div>
              </div>
            </div>
          )}

          {/* 게시판 섹션 위젯 전용 설정 */}
          {editingWidget.type === "board-section" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">게시판 (섹션) 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="board-section-page">콘텐츠 페이지 선택</Label>
                <Select
                  value={editingWidget.display_options?.page_id || ""}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        page_id: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="페이지 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page: any) => (
                      <SelectItem
                        key={page.id}
                        value={page.id}
                        disabled={page.page_type !== "widget"}
                      >
                        {page.title}{" "}
                        {page.page_type !== "widget" && "(게시판 타입 아님)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  선택한 페이지의 게시물이 위젯에 표시됩니다. 반드시 '게시판'
                  타입의 페이지를 선택해주세요.
                </p>
              </div>
            </div>
          )}

          {/* 미디어 위젯 전용 설정 */}
          {editingWidget.type === "media" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">미디어 설정</h4>

              <div className="space-y-2">
                <Label htmlFor="media-title">미디어 섹션 제목</Label>
                <Input
                  id="media-title"
                  value={editingWidget.display_options?.media_title || ""}
                  placeholder="지금 미디어, 다양한 미디어 콘텐츠를 만나보세요"
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        media_title: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-subtitle">미디어 섹션 부제목</Label>
                <Input
                  id="media-subtitle"
                  value={editingWidget.display_options?.media_subtitle || ""}
                  placeholder="최신 영상, 오디오 콘텐츠를 한 곳에서 확인하세요"
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        media_subtitle: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-more-text">더 많은 미디어 보기</Label>
                <Input
                  id="media-more-text"
                  value={editingWidget.display_options?.media_more_text || ""}
                  placeholder="더 많은 미디어 보기"
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        media_more_text: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-item-count">
                  표시할 미디어 항목 개수
                </Label>
                <Input
                  id="media-item-count"
                  type="number"
                  min="1"
                  max="20"
                  value={editingWidget.display_options?.item_count || 12}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: parseInt(e.target.value) || 12,
                      },
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  최대 표시 개수를 설정합니다. 첫 번째 항목은 반드시 표시되며,
                  나머지 항목은 사이드에 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-page">콘텐츠 페이지 선택</Label>
                <Select
                  value={editingWidget.display_options?.page_id || ""}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        page_id: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="페이지 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page: any) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  선택한 페이지의 콘텐츠가 미디어 섹션에 표시됩니다.
                </p>
              </div>
            </div>
          )}
          {/* 위치 정보 위젯 전용 설정 */}
          {editingWidget.type === "location" && (
            <div className="space-y-4 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium text-sm">위치 정보 설정</h4>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">기본 정보</TabsTrigger>
                  <TabsTrigger value="location">위치</TabsTrigger>
                  <TabsTrigger value="contact">연락처</TabsTrigger>
                </TabsList>

                {/* 기본 정보 설정 탭 */}
                <TabsContent value="info" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-title">위치 섹션 제목</Label>
                    <Input
                      id="location-title"
                      value={
                        editingWidget.display_options?.location_title || ""
                      }
                      placeholder="위치 정보"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            location_title: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-subtitle">위치 섹션 부제목</Label>
                    <Input
                      id="location-subtitle"
                      value={
                        editingWidget.display_options?.location_subtitle || ""
                      }
                      placeholder="저희 위치와 연락처 정보입니다"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            location_subtitle: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-page">
                      연결할 페이지 선택 (선택사항)
                    </Label>
                    <Select
                      value={editingWidget.display_options?.page_id || ""}
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            page_id: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="페이지 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map((page: any) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      문의하기 버튼을 클릭했을 때 이동할 페이지를 선택하세요
                    </p>
                  </div>
                </TabsContent>

                {/* 위치 설정 탭 */}
                <TabsContent value="location" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-address">주소</Label>
                    <textarea
                      id="location-address"
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={editingWidget.display_options?.address || ""}
                      placeholder="상세 주소를 입력하세요"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            address: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-map-url">지도 링크 URL</Label>
                    <Input
                      id="location-map-url"
                      value={editingWidget.display_options?.map_url || ""}
                      placeholder="https://maps.google.com/..."
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            map_url: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      지도 보기 링크로 사용됩니다 (예: 네이버 지도, 구글 지도 등
                      링크)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-embed-map-url">
                      임베드 지도 코드
                    </Label>
                    <textarea
                      id="location-embed-map-url"
                      className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={editingWidget.display_options?.embed_map_url || ""}
                      placeholder="<iframe src='https://www.google.com/maps/embed?...' width='600' height='450' style='border:0;' allowfullscreen='' loading='lazy' referrerpolicy='no-referrer-when-downgrade'></iframe>"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            embed_map_url: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      구글 지도 &gt; 공유 &gt; 지도 퍼가기에서 제공하는 iframe
                      코드 전체를 붙여넣으세요. (iframe 태그 전체를 그대로
                      복사하여 붙여넣으면 됩니다)
                    </p>
                  </div>
                </TabsContent>

                {/* 연락처 설정 탭 */}
                <TabsContent value="contact" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-phone">전화번호</Label>
                    <Input
                      id="location-phone"
                      value={editingWidget.display_options?.phone || ""}
                      placeholder="02-1234-5678"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-email">이메일</Label>
                    <Input
                      id="location-email"
                      type="email"
                      value={editingWidget.display_options?.email || ""}
                      placeholder="contact@example.com"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          display_options: {
                            ...editingWidget.display_options,
                            email: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* 메뉴 목록 위젯 전용 설정 */}
          {editingWidget.type === "menu-list" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">메뉴 목록 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="menu-list-parent">상위 메뉴 선택</Label>
                <Select
                  value={editingWidget.settings?.parent_menu_id || ""}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        parent_menu_id: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="표시할 메뉴 그룹을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems
                      .filter((item) => !item.parent_id) // 최상위 메뉴만 필터링
                      .map((menu: any) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  선택한 메뉴의 하위 메뉴들이 목록으로 표시됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 최근 댓글 위젯 설정 */}
          {editingWidget.type === "recent-comments" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">최근 댓글 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="rc-item-count">표시할 댓글 개수</Label>
                <Select
                  value={String(editingWidget.display_options?.item_count || 5)}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="개수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3개</SelectItem>
                    <SelectItem value="5">5개</SelectItem>
                    <SelectItem value="10">10개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 인기 게시글 위젯 설정 */}
          {editingWidget.type === "popular-posts" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">인기 게시글 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="pp-item-count">표시할 게시글 개수</Label>
                <Select
                  value={String(editingWidget.display_options?.item_count || 5)}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="개수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3개</SelectItem>
                    <SelectItem value="5">5개</SelectItem>
                    <SelectItem value="10">10개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pp-sort-by">정렬 기준</Label>
                <Select
                  value={editingWidget.display_options?.sort_by || "views"}
                  onValueChange={(value: "views" | "likes" | "comments") =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        sort_by: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="정렬 기준 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">조회수</SelectItem>
                    <SelectItem value="likes">좋아요수</SelectItem>
                    <SelectItem value="comments">댓글수</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 로그인 위젯 설정 */}
          {editingWidget.type === "login" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">로그인 위젯 설정</h4>
              <div className="space-y-2">
                <Label htmlFor="login-logged-out-title">
                  로그아웃 상태 문구
                </Label>
                <Input
                  id="login-logged-out-title"
                  value={
                    editingWidget.display_options?.logged_out_title ||
                    "로그인이 필요합니다."
                  }
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        logged_out_title: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-logged-in-title">
                  로그인 상태 환영 문구
                </Label>
                <Input
                  id="login-logged-in-title"
                  value={
                    editingWidget.display_options?.logged_in_title ||
                    "님, 환영합니다!"
                  }
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        logged_in_title: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          {editingWidget.type === "strip" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">스트립(띠 배너) 설정</h4>

              {/* 전체 너비 사용 설정 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-full-width"
                    checked={editingWidget.settings?.use_full_width ?? true}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          use_full_width: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="use-full-width">전체 화면 너비 사용</Label>
                </div>
                <p className="text-xs text-gray-500">
                  체크하면 위젯 컨테이너를 벗어나 전체 화면 너비로 표시됩니다.
                  체크하지 않으면 위젯 컨테이너 안에서만 표시됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strip-type">타입 선택</Label>
                <Select
                  value={editingWidget.settings?.strip_type || "image"}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        strip_type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">이미지 URL/업로드</SelectItem>
                    <SelectItem value="html">HTML 코드</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingWidget.settings?.strip_type === "image" && (
                <div className="space-y-2">
                  <Label htmlFor="strip-image-url">이미지 URL</Label>
                  <Input
                    id="strip-image-url"
                    value={editingWidget.settings?.strip_value || ""}
                    placeholder="https://example.com/banner.jpg"
                    onChange={(e) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          strip_value: e.target.value,
                        },
                      })
                    }
                  />
                  <div className="flex items-center mt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setStripUploading(true);
                        try {
                          const supabase = createClient();
                          const fileName = file.name;
                          const filePath = `strip-banners/${Date.now()}_${fileName}`;
                          const { error: uploadError } = await supabase.storage
                            .from("homepage-banners")
                            .upload(filePath, file, {
                              cacheControl: "3600",
                              upsert: true,
                            });
                          if (uploadError) {
                            throw uploadError;
                          }
                          const { data: publicUrlData } = supabase.storage
                            .from("homepage-banners")
                            .getPublicUrl(filePath);
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              strip_value: publicUrlData.publicUrl,
                            },
                          });
                          toast({
                            title: "이미지 업로드 성공",
                            description:
                              "이미지가 성공적으로 업로드되었습니다.",
                          });
                        } catch (err) {
                          toast({
                            title: "이미지 업로드 실패",
                            description:
                              (err as any).message || "업로드 중 오류 발생",
                            variant: "destructive",
                          });
                        } finally {
                          setStripUploading(false);
                        }
                      }}
                      disabled={stripUploading}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={stripUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="ml-2"
                    >
                      {stripUploading ? "업로드 중..." : "파일 업로드"}
                    </Button>
                  </div>
                  {/* 이미지 높이 설정 */}
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="strip-image-height">이미지 높이</Label>
                    <select
                      id="strip-image-height"
                      className="border rounded px-2 py-1"
                      value={editingWidget.settings?.strip_height || "original"}
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            strip_height: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="original">원본</option>
                      <option value="48px">48px</option>
                      <option value="64px">64px</option>
                      <option value="80px">80px</option>
                      <option value="120px">120px</option>
                      <option value="160px">160px</option>
                      <option value="240px">240px</option>
                      <option value="320px">320px</option>
                      <option value="100vh">100vh</option>
                      <option value="custom">직접입력</option>
                    </select>
                    {editingWidget.settings?.strip_height === "custom" && (
                      <Input
                        className="w-32 ml-2"
                        placeholder="ex) 200px, 20vh"
                        value={
                          editingWidget.settings?.strip_custom_height || ""
                        }
                        onChange={(e) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              strip_custom_height: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              )}
              {editingWidget.settings?.strip_type === "html" && (
                <div className="space-y-2">
                  <Label htmlFor="strip-html">HTML 코드</Label>
                  <textarea
                    id="strip-html"
                    className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={editingWidget.settings?.strip_value || ""}
                    placeholder="<div style='color:red;'>띠 배너 HTML</div>"
                    onChange={(e) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          strip_value: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* 캐러셀 위젯 전용 설정 */}
          {editingWidget.type === "carousel" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">캐러셀 슬라이드 설정</h4>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">기본 설정</TabsTrigger>
                  <TabsTrigger value="data">데이터 관리</TabsTrigger>
                  <TabsTrigger value="display">표시 옵션</TabsTrigger>
                </TabsList>

                {/* 기본 설정 탭 */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="carousel-type">캐러셀 타입</Label>
                    <Select
                      value={
                        editingWidget.settings?.carousel_type ||
                        CAROUSEL_TYPES.BASIC
                      }
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            carousel_type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="캐러셀 타입 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CAROUSEL_TYPES.BASIC}>
                          기본 슬라이드형
                        </SelectItem>
                        <SelectItem value={CAROUSEL_TYPES.GALLERY}>
                          갤러리 카드형
                        </SelectItem>
                        <SelectItem value={CAROUSEL_TYPES.FULLSCREEN}>
                          풀스크린 모드
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      기본: 전체 너비 슬라이드, 갤러리: 카드형 가로 스크롤,
                      풀스크린: 썸네일 클릭 시 전체 화면 보기
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carousel-data-source">데이터 소스</Label>
                    <Select
                      value={editingWidget.settings?.data_source || "sample"}
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            data_source: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="데이터 소스 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sample">기본 샘플 이미지</SelectItem>
                        <SelectItem value="page">페이지 콘텐츠</SelectItem>
                        <SelectItem value="custom">직접 이미지 관리</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      샘플: 기본 더미 이미지, 페이지: 선택한 페이지의 게시물,
                      직접: 업로드한 이미지들
                    </p>
                  </div>
                </TabsContent>

                {/* 데이터 관리 탭 */}
                <TabsContent value="data" className="space-y-4 pt-4">
                  {/* 페이지 선택 (페이지 콘텐츠 모드일 때만) */}
                  {editingWidget.settings?.data_source === "page" && (
                    <div className="space-y-2">
                      <Label htmlFor="carousel-page">콘텐츠 페이지 선택</Label>
                      <Select
                        value={
                          editingWidget.display_options?.page_id || "default"
                        }
                        onValueChange={(value) =>
                          setEditingWidget({
                            ...editingWidget,
                            display_options: {
                              ...editingWidget.display_options,
                              page_id: value === "default" ? undefined : value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="페이지 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((page: any) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        선택한 페이지의 썸네일이 있는 게시물들이 캐러셀에
                        표시됩니다.
                      </p>
                    </div>
                  )}

                  {/* 직접 이미지 관리 (커스텀 모드일 때만) */}
                  {editingWidget.settings?.data_source === "custom" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>이미지 관리</Label>
                        <div className="text-xs text-gray-500">
                          데스크톱{" "}
                          {
                            (editingWidget.settings?.desktop_images || [])
                              .length
                          }
                          개 | 모바일{" "}
                          {(editingWidget.settings?.mobile_images || []).length}
                          개
                        </div>
                      </div>

                      {/* 데스크톱/모바일 이미지 관리 탭 */}
                      <Tabs defaultValue="desktop" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="desktop">
                            데스크톱 이미지
                          </TabsTrigger>
                          <TabsTrigger value="mobile">
                            모바일 이미지
                          </TabsTrigger>
                        </TabsList>

                        {/* 데스크톱 이미지 탭 */}
                        <TabsContent value="desktop" className="space-y-3 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              데스크톱에서 표시될 이미지들을 관리합니다
                            </p>
                            <div className="text-xs text-blue-600 font-medium">
                              {
                                (editingWidget.settings?.desktop_images || [])
                                  .length
                              }
                              개 이미지
                            </div>
                          </div>

                          {/* 데스크톱 이미지 추가 버튼들 */}
                          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                            <Label className="text-sm font-medium text-blue-800">
                              데스크톱 이미지 추가/변경
                            </Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      currentMode: "desktop",
                                    },
                                  });
                                  setShowImageBrowser(true);
                                }}
                                className="flex-1"
                                disabled={
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                              >
                                서버 이미지 브라우저
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      currentMode: "desktop",
                                    },
                                  });
                                  carouselFileInputRef.current?.click();
                                }}
                                disabled={
                                  carouselUploading ||
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                                className="flex-1"
                              >
                                {carouselUploading
                                  ? "업로드 중..."
                                  : "파일 업로드"}
                              </Button>
                            </div>

                            {/* URL 입력 */}
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="이미지 URL을 입력하세요"
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const url = (
                                      e.target as HTMLInputElement
                                    ).value.trim();
                                    if (url) {
                                      const currentImages =
                                        editingWidget.settings?.custom_images ||
                                        [];
                                      if (currentImages.length >= 8) {
                                        toast({
                                          title: "이미지 개수 제한",
                                          description:
                                            "최대 8개까지만 추가할 수 있습니다.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      const newImage = {
                                        image_url: url,
                                        mobile_image_url: "",
                                        title: "",
                                        description: "",
                                        link_url: "",
                                      };
                                      setEditingWidget({
                                        ...editingWidget,
                                        settings: {
                                          ...editingWidget.settings,
                                          custom_images: [
                                            ...currentImages,
                                            newImage,
                                          ],
                                        },
                                      });
                                      (e.target as HTMLInputElement).value = "";
                                      toast({
                                        title: "새 슬라이드 추가 성공",
                                        description:
                                          "URL에서 새 슬라이드가 추가되었습니다.",
                                      });
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement)
                                    .previousElementSibling as HTMLInputElement;
                                  const url = input?.value.trim();
                                  if (url) {
                                    const currentImages =
                                      editingWidget.settings?.desktop_images ||
                                      [];
                                    if (currentImages.length >= 8) {
                                      toast({
                                        title: "이미지 개수 제한",
                                        description:
                                          "최대 8개까지만 추가할 수 있습니다.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    const newImage = {
                                      image_url: url,
                                      title: "",
                                      description: "",
                                      link_url: "",
                                    };
                                    setEditingWidget({
                                      ...editingWidget,
                                      settings: {
                                        ...editingWidget.settings,
                                        desktop_images: [
                                          ...currentImages,
                                          newImage,
                                        ],
                                      },
                                    });
                                    input.value = "";
                                    toast({
                                      title: "새 슬라이드 추가 성공",
                                      description:
                                        "URL에서 새 슬라이드가 추가되었습니다.",
                                    });
                                  }
                                }}
                                disabled={
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                              >
                                추가
                              </Button>
                            </div>
                          </div>

                          {/* 데스크톱 이미지 미리보기 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-800">
                              데스크톱 이미지 미리보기
                            </Label>
                            <div className="bg-white p-3 rounded-lg border border-blue-200">
                              {(editingWidget.settings?.desktop_images || [])
                                .length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {(
                                    editingWidget.settings?.desktop_images || []
                                  ).map((img: any, index: number) => (
                                    <div
                                      key={`desktop-preview-${index}`}
                                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all aspect-video"
                                      onClick={() => {
                                        setEditingWidget({
                                          ...editingWidget,
                                          settings: {
                                            ...editingWidget.settings,
                                            selectedImageIndex: index,
                                            editMode: "desktop",
                                          },
                                        });
                                      }}
                                    >
                                      <img
                                        src={img.image_url}
                                        alt={
                                          img.title ||
                                          `데스크톱 이미지 ${index + 1}`
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                                        {index + 1}
                                      </div>

                                      {/* 왼쪽 이동 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                                        disabled={index === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const images = [
                                            ...(editingWidget.settings
                                              ?.desktop_images || []),
                                          ];
                                          [images[index], images[index - 1]] = [
                                            images[index - 1],
                                            images[index],
                                          ];
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              desktop_images: images,
                                            },
                                          });
                                        }}
                                      >
                                        <ChevronLeft className="h-3 w-3" />
                                      </Button>

                                      {/* 오른쪽 이동 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                                        disabled={
                                          index ===
                                          (
                                            editingWidget.settings
                                              ?.desktop_images || []
                                          ).length -
                                            1
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const images = [
                                            ...(editingWidget.settings
                                              ?.desktop_images || []),
                                          ];
                                          [images[index], images[index + 1]] = [
                                            images[index + 1],
                                            images[index],
                                          ];
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              desktop_images: images,
                                            },
                                          });
                                        }}
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </Button>

                                      {/* 삭제 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updatedImages = [
                                            ...(editingWidget.settings
                                              ?.desktop_images || []),
                                          ];
                                          updatedImages.splice(index, 1);
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              desktop_images: updatedImages,
                                            },
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-8">
                                  <p className="text-sm">
                                    데스크톱용 이미지가 없습니다
                                  </p>
                                  <p className="text-xs mt-1">
                                    위에서 이미지를 추가해주세요
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        {/* 모바일 이미지 탭 */}
                        <TabsContent value="mobile" className="space-y-3 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              모바일에서 표시될 이미지들을 관리합니다
                            </p>
                            <div className="text-xs text-green-600 font-medium">
                              {
                                (editingWidget.settings?.mobile_images || [])
                                  .length
                              }
                              개 이미지
                            </div>
                          </div>

                          {/* 모바일 이미지 추가 버튼들 */}
                          <div className="bg-green-50 p-3 rounded-lg space-y-2">
                            <Label className="text-sm font-medium text-green-800">
                              모바일 이미지 추가/변경
                            </Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      currentMode: "mobile",
                                    },
                                  });
                                  setShowImageBrowser(true);
                                }}
                                className="flex-1"
                                disabled={
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                              >
                                서버 이미지 브라우저
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      currentMode: "mobile",
                                    },
                                  });
                                  carouselFileInputRef.current?.click();
                                }}
                                disabled={
                                  carouselUploading ||
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                                className="flex-1"
                              >
                                {carouselUploading
                                  ? "업로드 중..."
                                  : "파일 업로드"}
                              </Button>
                            </div>

                            {/* URL 입력 */}
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="이미지 URL을 입력하세요"
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const url = (
                                      e.target as HTMLInputElement
                                    ).value.trim();
                                    if (url) {
                                      const currentImages =
                                        editingWidget.settings?.mobile_images ||
                                        [];
                                      if (currentImages.length >= 8) {
                                        toast({
                                          title: "이미지 개수 제한",
                                          description:
                                            "최대 8개까지만 추가할 수 있습니다.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      const newImage = {
                                        image_url: url,
                                        title: "",
                                        description: "",
                                        link_url: "",
                                      };
                                      setEditingWidget({
                                        ...editingWidget,
                                        settings: {
                                          ...editingWidget.settings,
                                          mobile_images: [
                                            ...currentImages,
                                            newImage,
                                          ],
                                        },
                                      });
                                      (e.target as HTMLInputElement).value = "";
                                      toast({
                                        title: "새 슬라이드 추가 성공",
                                        description:
                                          "URL에서 새 슬라이드가 추가되었습니다.",
                                      });
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement)
                                    .previousElementSibling as HTMLInputElement;
                                  const url = input?.value.trim();
                                  if (url) {
                                    const currentImages =
                                      editingWidget.settings?.custom_images ||
                                      [];
                                    if (currentImages.length >= 8) {
                                      toast({
                                        title: "이미지 개수 제한",
                                        description:
                                          "최대 8개까지만 추가할 수 있습니다.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    const newImage = {
                                      image_url: "",
                                      mobile_image_url: url,
                                      title: "",
                                      description: "",
                                      link_url: "",
                                    };
                                    setEditingWidget({
                                      ...editingWidget,
                                      settings: {
                                        ...editingWidget.settings,
                                        custom_images: [
                                          ...currentImages,
                                          newImage,
                                        ],
                                      },
                                    });
                                    input.value = "";
                                    toast({
                                      title: "새 슬라이드 추가 성공",
                                      description:
                                        "URL에서 새 슬라이드가 추가되었습니다.",
                                    });
                                  }
                                }}
                                disabled={
                                  (editingWidget.settings?.custom_images || [])
                                    .length >= 8
                                }
                              >
                                추가
                              </Button>
                            </div>
                          </div>

                          {/* 모바일 이미지 미리보기 */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-800">
                              모바일 이미지 미리보기
                            </Label>
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              {(editingWidget.settings?.mobile_images || [])
                                .length > 0 ? (
                                <div className="grid grid-cols-4 gap-2">
                                  {(
                                    editingWidget.settings?.mobile_images || []
                                  ).map((img: any, index: number) => (
                                    <div
                                      key={`mobile-preview-${index}`}
                                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all aspect-square"
                                      onClick={() => {
                                        setEditingWidget({
                                          ...editingWidget,
                                          settings: {
                                            ...editingWidget.settings,
                                            selectedImageIndex: index,
                                            editMode: "mobile",
                                          },
                                        });
                                      }}
                                    >
                                      <img
                                        src={img.image_url}
                                        alt={
                                          img.title ||
                                          `모바일 이미지 ${index + 1}`
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                                        {index + 1}
                                      </div>

                                      {/* 왼쪽 이동 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                                        disabled={index === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const images = [
                                            ...(editingWidget.settings
                                              ?.mobile_images || []),
                                          ];
                                          [images[index], images[index - 1]] = [
                                            images[index - 1],
                                            images[index],
                                          ];
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              mobile_images: images,
                                            },
                                          });
                                        }}
                                      >
                                        <ChevronLeft className="h-3 w-3" />
                                      </Button>

                                      {/* 오른쪽 이동 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                                        disabled={
                                          index ===
                                          (
                                            editingWidget.settings
                                              ?.mobile_images || []
                                          ).length -
                                            1
                                        }
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const images = [
                                            ...(editingWidget.settings
                                              ?.mobile_images || []),
                                          ];
                                          [images[index], images[index + 1]] = [
                                            images[index + 1],
                                            images[index],
                                          ];
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              mobile_images: images,
                                            },
                                          });
                                        }}
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </Button>

                                      {/* 삭제 버튼 */}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-1 right-1 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updatedImages = [
                                            ...(editingWidget.settings
                                              ?.mobile_images || []),
                                          ];
                                          updatedImages.splice(index, 1);
                                          setEditingWidget({
                                            ...editingWidget,
                                            settings: {
                                              ...editingWidget.settings,
                                              mobile_images: updatedImages,
                                            },
                                          });
                                        }}
                                      >
                                        <Trash2 className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-8">
                                  <p className="text-sm">
                                    모바일용 이미지가 없습니다
                                  </p>
                                  <p className="text-xs mt-1">
                                    위에서 이미지를 추가해주세요
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <input
                        type="file"
                        ref={carouselFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const currentMode =
                            editingWidget.settings?.currentMode || "desktop";
                          const currentImages =
                            currentMode === "desktop"
                              ? editingWidget.settings?.desktop_images || []
                              : editingWidget.settings?.mobile_images || [];

                          if (currentImages.length >= 8) {
                            toast({
                              title: "이미지 개수 제한",
                              description: "최대 8개까지만 추가할 수 있습니다.",
                              variant: "destructive",
                            });
                            return;
                          }

                          setCarouselUploading(true);
                          try {
                            const supabase = createClient();
                            const fileExt = file.name.split(".").pop();
                            const fileName = `carousel-${Date.now()}.${fileExt}`;
                            const filePath = `carousel/${fileName}`;
                            console.log("업로드 시도:", {
                              fileName,
                              filePath,
                              fileSize: file.size,
                            });

                            const { error: uploadError } =
                              await supabase.storage
                                .from("admin")
                                .upload(filePath, file, { upsert: true });

                            if (uploadError) {
                              console.error("업로드 에러 상세:", uploadError);
                              throw uploadError;
                            }

                            const { data: publicUrlData } = supabase.storage
                              .from("admin")
                              .getPublicUrl(filePath);

                            // 새 슬라이드 추가
                            const newImage = {
                              image_url: publicUrlData.publicUrl,
                              title: "",
                              description: "",
                              link_url: "",
                            };

                            const updatedSettings = {
                              ...editingWidget.settings,
                            };
                            if (currentMode === "desktop") {
                              updatedSettings.desktop_images = [
                                ...currentImages,
                                newImage,
                              ];
                            } else {
                              updatedSettings.mobile_images = [
                                ...currentImages,
                                newImage,
                              ];
                            }
                            updatedSettings.currentMode = undefined;

                            setEditingWidget({
                              ...editingWidget,
                              settings: updatedSettings,
                            });

                            toast({
                              title: "새 슬라이드 추가 성공",
                              description: `${currentMode === "mobile" ? "모바일" : "데스크톱"} 이미지와 함께 새 슬라이드가 추가되었습니다.`,
                            });
                          } catch (err) {
                            console.error("Carousel upload error:", err);
                            toast({
                              title: "이미지 업로드 실패",
                              description:
                                (err as any).message || "업로드 중 오류 발생",
                              variant: "destructive",
                            });
                          } finally {
                            setCarouselUploading(false);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* 이미지 상세 설정 모달 */}
                  {editingWidget?.settings?.selectedImageIndex !==
                    undefined && (
                    <Dialog
                      open={
                        editingWidget.settings.selectedImageIndex !== undefined
                      }
                      onOpenChange={() => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            selectedImageIndex: undefined,
                            editMode: undefined,
                          },
                        });
                      }}
                    >
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {editingWidget.settings.editMode === "mobile"
                              ? "모바일"
                              : "데스크톱"}{" "}
                            이미지{" "}
                            {(editingWidget.settings.selectedImageIndex ?? 0) +
                              1}{" "}
                            설정
                          </DialogTitle>
                          <DialogDescription>
                            {editingWidget.settings.editMode === "mobile"
                              ? "모바일 기기에서 표시될 이미지를 편집합니다"
                              : "데스크톱에서 표시될 이미지를 편집합니다"}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* 이미지 미리보기 */}
                          <div className="flex justify-center">
                            <img
                              src={
                                editingWidget.settings.editMode === "mobile"
                                  ? editingWidget.settings.custom_images[
                                      editingWidget.settings.selectedImageIndex
                                    ]?.mobile_image_url ||
                                    editingWidget.settings.custom_images[
                                      editingWidget.settings.selectedImageIndex
                                    ]?.image_url
                                  : editingWidget.settings.custom_images[
                                      editingWidget.settings.selectedImageIndex
                                    ]?.image_url
                              }
                              alt="설정할 이미지"
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>

                          {/* 설정 폼 */}
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">제목</Label>
                              <Input
                                placeholder="이미지 제목을 입력하세요"
                                value={
                                  editingWidget.settings.custom_images[
                                    editingWidget.settings.selectedImageIndex
                                  ]?.title || ""
                                }
                                onChange={(e) => {
                                  const selectedIndex =
                                    editingWidget.settings
                                      ?.selectedImageIndex ?? 0;
                                  const updatedImages = [
                                    ...(editingWidget.settings?.custom_images ||
                                      []),
                                  ];
                                  updatedImages[selectedIndex] = {
                                    ...updatedImages[selectedIndex],
                                    title: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_images: updatedImages,
                                    },
                                  });
                                }}
                              />
                            </div>

                            <div>
                              <Label className="text-sm">설명</Label>
                              <Input
                                placeholder="이미지 설명을 입력하세요"
                                value={
                                  editingWidget.settings.custom_images[
                                    editingWidget.settings.selectedImageIndex
                                  ]?.description || ""
                                }
                                onChange={(e) => {
                                  const selectedIndex =
                                    editingWidget.settings
                                      ?.selectedImageIndex ?? 0;
                                  const updatedImages = [
                                    ...(editingWidget.settings?.custom_images ||
                                      []),
                                  ];
                                  updatedImages[selectedIndex] = {
                                    ...updatedImages[selectedIndex],
                                    description: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_images: updatedImages,
                                    },
                                  });
                                }}
                              />
                            </div>

                            <div>
                              <Label className="text-sm">
                                링크 URL (선택사항)
                              </Label>
                              <Input
                                placeholder="클릭 시 이동할 URL을 입력하세요"
                                value={
                                  editingWidget.settings.custom_images[
                                    editingWidget.settings.selectedImageIndex
                                  ]?.link_url || ""
                                }
                                onChange={(e) => {
                                  const selectedIndex =
                                    editingWidget.settings
                                      ?.selectedImageIndex ?? 0;
                                  const updatedImages = [
                                    ...(editingWidget.settings?.custom_images ||
                                      []),
                                  ];
                                  updatedImages[selectedIndex] = {
                                    ...updatedImages[selectedIndex],
                                    link_url: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_images: updatedImages,
                                    },
                                  });
                                }}
                              />
                            </div>

                            <div
                              className={
                                editingWidget.settings.editMode === "desktop"
                                  ? "p-3 bg-blue-50 rounded-lg border-2 border-blue-200"
                                  : ""
                              }
                            >
                              <Label
                                className={
                                  editingWidget.settings.editMode === "desktop"
                                    ? "text-sm font-semibold text-blue-800"
                                    : "text-sm"
                                }
                              >
                                데스크톱 이미지 URL{" "}
                                {editingWidget.settings.editMode === "desktop"
                                  ? "(현재 편집 중)"
                                  : ""}
                              </Label>
                              <Input
                                className={
                                  editingWidget.settings.editMode === "desktop"
                                    ? "text-xs font-mono border-blue-300 focus:border-blue-500"
                                    : "text-xs font-mono"
                                }
                                value={
                                  editingWidget.settings.custom_images[
                                    editingWidget.settings.selectedImageIndex
                                  ]?.image_url || ""
                                }
                                onChange={(e) => {
                                  const selectedIndex =
                                    editingWidget.settings
                                      ?.selectedImageIndex ?? 0;
                                  const updatedImages = [
                                    ...(editingWidget.settings?.custom_images ||
                                      []),
                                  ];
                                  updatedImages[selectedIndex] = {
                                    ...updatedImages[selectedIndex],
                                    image_url: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_images: updatedImages,
                                    },
                                  });
                                }}
                              />
                            </div>

                            <div
                              className={
                                editingWidget.settings.editMode === "mobile"
                                  ? "p-3 bg-green-50 rounded-lg border-2 border-green-200"
                                  : ""
                              }
                            >
                              <Label
                                className={
                                  editingWidget.settings.editMode === "mobile"
                                    ? "text-sm font-semibold text-green-800"
                                    : "text-sm"
                                }
                              >
                                모바일 이미지 URL{" "}
                                {editingWidget.settings.editMode === "mobile"
                                  ? "(현재 편집 중)"
                                  : ""}
                              </Label>
                              <Input
                                className={
                                  editingWidget.settings.editMode === "mobile"
                                    ? "text-xs font-mono border-green-300 focus:border-green-500"
                                    : "text-xs font-mono"
                                }
                                value={
                                  editingWidget.settings.custom_images[
                                    editingWidget.settings.selectedImageIndex
                                  ]?.mobile_image_url || ""
                                }
                                onChange={(e) => {
                                  const selectedIndex =
                                    editingWidget.settings
                                      ?.selectedImageIndex ?? 0;
                                  const updatedImages = [
                                    ...(editingWidget.settings?.custom_images ||
                                      []),
                                  ];
                                  updatedImages[selectedIndex] = {
                                    ...updatedImages[selectedIndex],
                                    mobile_image_url: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_images: updatedImages,
                                    },
                                  });
                                }}
                              />
                              <p
                                className={
                                  editingWidget.settings.editMode === "mobile"
                                    ? "text-xs mt-1 text-green-700"
                                    : "text-xs mt-1 text-gray-500"
                                }
                              >
                                비워두면 데스크톱 이미지와 동일하게 표시됩니다
                              </p>
                            </div>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  selectedImageIndex: undefined,
                                  editMode: undefined,
                                },
                              });
                            }}
                          >
                            닫기
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* 샘플 데이터 안내 */}
                  {editingWidget.settings?.data_source === "sample" && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">
                        기본 샘플 이미지 3개가 표시됩니다.
                      </p>
                      <p className="text-xs mt-2">
                        다른 데이터 소스를 선택하여 실제 콘텐츠를 표시할 수
                        있습니다.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* 표시 옵션 탭 */}
                <TabsContent value="display" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="carousel-show-title"
                          checked={editingWidget.settings?.show_title ?? true}
                          onCheckedChange={(checked) =>
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                show_title: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="carousel-show-title">제목 표시</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="carousel-auto-play"
                          checked={editingWidget.settings?.auto_play ?? true}
                          onCheckedChange={(checked) =>
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                auto_play: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="carousel-auto-play">자동 재생</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="carousel-show-dots"
                          checked={editingWidget.settings?.show_dots ?? true}
                          onCheckedChange={(checked) =>
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                show_dots: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="carousel-show-dots">도트 표시</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="carousel-show-arrows"
                          checked={editingWidget.settings?.show_arrows ?? true}
                          onCheckedChange={(checked) =>
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                show_arrows: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="carousel-show-arrows">
                          화살표 표시
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="carousel-transparent-background"
                          checked={
                            editingWidget.settings?.transparent_background ??
                            false
                          }
                          onCheckedChange={(checked) =>
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                transparent_background: checked === true,
                              },
                            })
                          }
                        />
                        <Label htmlFor="carousel-transparent-background">
                          투명 배경 사용
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">
                        갤러리형에서 카드 배경을 투명하게 만듭니다
                      </p>

                      {/* 카드 표시 옵션 */}
                      <div className="pt-2 border-t border-gray-200">
                        <Label className="text-sm font-medium mb-2 block">
                          카드 표시 옵션
                        </Label>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="carousel-show-card-title"
                            checked={
                              editingWidget.settings?.show_card_title ?? true
                            }
                            onCheckedChange={(checked) =>
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  show_card_title: checked === true,
                                },
                              })
                            }
                          />
                          <Label htmlFor="carousel-show-card-title">
                            카드 제목 표시
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id="carousel-show-card-description"
                            checked={
                              editingWidget.settings?.show_card_description ??
                              true
                            }
                            onCheckedChange={(checked) =>
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  show_card_description: checked === true,
                                },
                              })
                            }
                          />
                          <Label htmlFor="carousel-show-card-description">
                            카드 설명 표시
                          </Label>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          개별 카드의 제목과 설명 표시를 제어합니다
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="carousel-auto-play-delay">
                        자동 재생 간격 (초)
                      </Label>
                      <Input
                        id="carousel-auto-play-delay"
                        type="number"
                        min="1"
                        max="30"
                        value={
                          (editingWidget.settings?.auto_play_delay || 5000) /
                          1000
                        }
                        onChange={(e) => {
                          const seconds = parseInt(e.target.value) || 5;
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              auto_play_delay: seconds * 1000,
                            },
                          });
                        }}
                        disabled={!editingWidget.settings?.auto_play}
                      />
                      <p className="text-xs text-gray-500">
                        자동 재생이 활성화된 경우 슬라이드 전환 간격을
                        설정합니다.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h5 className="font-medium text-sm mb-3">추가 설정</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• 캐러셀 타입에 따라 표시 방식이 달라집니다</p>
                      <p>
                        • 자동 재생은 사용자가 마우스를 올리면 일시 정지됩니다
                      </p>
                      <p>
                        • 풀스크린 모드에서는 썸네일 클릭 시 전체 화면으로
                        확대됩니다
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* 조직도 위젯 설정 */}
          {editingWidget?.type === "organization-chart" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">조직도 설정</h4>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">기본 설정</TabsTrigger>
                  <TabsTrigger value="people">인사 관리</TabsTrigger>
                  <TabsTrigger value="display">표시 옵션</TabsTrigger>
                  <TabsTrigger value="style">스타일링</TabsTrigger>
                </TabsList>

                {/* 기본 설정 탭 */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="chart-style">조직도 스타일</Label>
                    <Select
                      value={
                        editingWidget.settings?.chart_style || CHART_STYLES.TREE
                      }
                      onValueChange={(value) => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            chart_style: value,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CHART_STYLES.TREE}>
                          트리형 (수직)
                        </SelectItem>
                        <SelectItem value={CHART_STYLES.HORIZONTAL}>
                          수평형
                        </SelectItem>
                        <SelectItem value={CHART_STYLES.COMPACT}>
                          컴팩트형
                        </SelectItem>
                        <SelectItem value={CHART_STYLES.CARDS}>
                          카드형 (그리드)
                        </SelectItem>
                        <SelectItem value={CHART_STYLES.DETAILED}>
                          상세라인형
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      조직도의 표시 방식을 선택합니다.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="org-description">조직도 설명</Label>
                    <textarea
                      id="org-description"
                      className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={editingWidget.settings?.description || ""}
                      placeholder="조직도에 대한 간단한 설명을 입력하세요"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            description: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Label className="text-sm font-medium">
                      계층별 이름 설정
                    </Label>
                    <p className="text-xs text-gray-500">
                      각 계층의 표시 이름을 설정할 수 있습니다. (카드형
                      레이아웃에서 사용)
                    </p>

                    {[0, 1, 2, 3, 4].map((level: any) => (
                      <div
                        key={level}
                        className="grid grid-cols-4 gap-2 items-center"
                      >
                        <Label className="text-xs text-gray-600">
                          Level {level}:
                        </Label>
                        <div className="col-span-3">
                          <Input
                            placeholder={
                              level === 0
                                ? "최고 경영진"
                                : level === 1
                                  ? "임원진"
                                  : level === 2
                                    ? "부서장"
                                    : level === 3
                                      ? "팀장"
                                      : "팀원"
                            }
                            value={
                              editingWidget.settings?.level_names?.[level] || ""
                            }
                            onChange={(e) => {
                              const currentLevelNames =
                                editingWidget.settings?.level_names || {};
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  level_names: {
                                    ...currentLevelNames,
                                    [level]: e.target.value,
                                  },
                                },
                              });
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* 인사 관리 탭 */}
                <TabsContent value="people" className="space-y-4 pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-sm">
                        현재 조직원 (
                        {(editingWidget.settings?.custom_data || []).length}명)
                      </h5>
                      <Button
                        size="sm"
                        onClick={() =>
                          setEditingMember(editingMember ? null : {})
                        }
                        className="h-7"
                      >
                        {editingMember && !editingMember.id
                          ? "취소"
                          : "+ 조직원 추가"}
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(editingWidget.settings?.custom_data || []).length ===
                      0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">등록된 조직원이 없습니다.</p>
                          <p className="text-xs mt-1">
                            위의 '조직원 추가' 버튼을 클릭해서 조직원을
                            추가해보세요.
                          </p>
                        </div>
                      ) : (
                        (editingWidget.settings?.custom_data || []).map(
                          (person: any, index: number) => (
                            <div
                              key={person.id || index}
                              className="flex items-center justify-between bg-white p-3 rounded border hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {person.avatar && (
                                  <img
                                    src={person.avatar}
                                    alt={person.name}
                                    className="w-8 h-8 rounded-full object-cover border"
                                  />
                                )}
                                <div>
                                  <span className="font-medium text-sm block">
                                    {person.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {person.position}
                                  </span>
                                  {person.department && (
                                    <span className="text-xs text-blue-600 ml-2">
                                      · {person.department}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                                  Level {person.level}
                                </span>

                                {/* 순서 변경 버튼 */}
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-4 w-6 p-0 flex-shrink-0"
                                    onClick={() => moveMember(index, "up")}
                                    disabled={index === 0}
                                    title="위로 이동"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 15l7-7 7 7"
                                      />
                                    </svg>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-4 w-6 p-0 flex-shrink-0"
                                    onClick={() => moveMember(index, "down")}
                                    disabled={
                                      index ===
                                      (
                                        editingWidget.settings?.custom_data ||
                                        []
                                      ).length -
                                        1
                                    }
                                    title="아래로 이동"
                                  >
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </Button>
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                  onClick={() =>
                                    setEditingMember(
                                      editingMember?.id === person.id
                                        ? null
                                        : person
                                    )
                                  }
                                >
                                  ✏️
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `'${person.name}' 조직원을 삭제하시겠습니까?`
                                      )
                                    ) {
                                      deleteMember(person.id);
                                    }
                                  }}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    {/* 조직원 편집 폼 */}
                    {editingMember && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <h6 className="font-medium text-sm mb-3">
                          {editingMember.id
                            ? "조직원 정보 수정"
                            : "새 조직원 추가"}
                        </h6>
                        <MemberForm
                          member={editingMember}
                          onSave={(data) => {
                            addOrUpdateMember(data);
                            setEditingMember(null);
                          }}
                          onCancel={() => setEditingMember(null)}
                          existingMembers={
                            editingWidget?.settings?.custom_data || []
                          }
                        />
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // 기존 데이터가 있으면 확인
                          const currentData =
                            editingWidget.settings?.custom_data || [];
                          if (currentData.length > 0) {
                            if (
                              !confirm(
                                "기존 조직원 데이터가 삭제됩니다. 계속하시겠습니까?"
                              )
                            ) {
                              return;
                            }
                          }

                          // 샘플 데이터로 초기화 (계층별 하나씩)
                          const sampleData = [
                            {
                              id: "1",
                              name: "홍대표",
                              position: "대표",
                              department: "경영진",
                              level: 0,
                              email: "ceo@example.com",
                              phone: "02-1234-5678",
                              avatar:
                                "https://via.placeholder.com/80x80/6366f1/ffffff?text=홍대표",
                            },
                            {
                              id: "2",
                              name: "김부장",
                              position: "부장",
                              department: "개발팀",
                              level: 1,
                              parentId: "1",
                              email: "manager@example.com",
                              phone: "02-1234-5679",
                              avatar:
                                "https://via.placeholder.com/80x80/3b82f6/ffffff?text=김부장",
                            },
                            {
                              id: "3",
                              name: "이팀장",
                              position: "팀장",
                              department: "개발팀",
                              level: 2,
                              parentId: "2",
                              email: "team@example.com",
                              avatar:
                                "https://via.placeholder.com/80x80/06b6d4/ffffff?text=이팀장",
                            },
                          ];
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              custom_data: sampleData,
                            },
                          });

                          // 편집 모드 리셋
                          setEditingMember(null);

                          toast({
                            title: "샘플 데이터 로드",
                            description: "샘플 조직도 데이터가 로드되었습니다.",
                          });
                        }}
                      >
                        📋 샘플 조직도 데이터 불러오기
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-green-700">
                      ✅ 조직원을 추가, 편집, 삭제할 수 있습니다. 변경사항은
                      저장 버튼을 클릭해야 적용됩니다.
                    </p>
                  </div>
                </TabsContent>

                {/* 표시 옵션 탭 */}
                <TabsContent value="display" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-avatars"
                        checked={editingWidget.settings?.show_avatars ?? true}
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_avatars: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="show-avatars" className="text-sm">
                        아바타 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-departments"
                        checked={
                          editingWidget.settings?.show_departments ?? true
                        }
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_departments: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="show-departments" className="text-sm">
                        부서 정보 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-contact"
                        checked={editingWidget.settings?.show_contact ?? false}
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_contact: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="show-contact" className="text-sm">
                        연락처 정보 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-position-icons"
                        checked={
                          editingWidget.settings?.show_position_icons ?? true
                        }
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_position_icons: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="show-position-icons" className="text-sm">
                        직책 아이콘 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-expand-collapse"
                        checked={
                          editingWidget.settings?.enable_expand_collapse ?? true
                        }
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              enable_expand_collapse: checked,
                            },
                          });
                        }}
                      />
                      <Label
                        htmlFor="enable-expand-collapse"
                        className="text-sm"
                      >
                        펼치기/접기 기능 사용
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-size">카드 크기</Label>
                    <Select
                      value={editingWidget.settings?.card_size || "medium"}
                      onValueChange={(value) => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            card_size: value,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작음</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="large">큼</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* 스타일링 탭 */}
                <TabsContent value="style" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme-color">테마 색상</Label>
                    <Select
                      value={editingWidget.settings?.theme_color || "blue"}
                      onValueChange={(value) => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            theme_color: value,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">파란색</SelectItem>
                        <SelectItem value="purple">보라색</SelectItem>
                        <SelectItem value="green">초록색</SelectItem>
                        <SelectItem value="orange">주황색</SelectItem>
                        <SelectItem value="gray">회색</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background-style">배경 스타일</Label>
                    <Select
                      value={
                        editingWidget.settings?.background_style || "gradient"
                      }
                      onValueChange={(value) => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            background_style: value,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gradient">그라데이션</SelectItem>
                        <SelectItem value="solid">단색</SelectItem>
                        <SelectItem value="transparent">투명</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card-spacing">카드 간격</Label>
                    <Select
                      value={editingWidget.settings?.card_spacing || "normal"}
                      onValueChange={(value) => {
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            card_spacing: value,
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tight">좁음</SelectItem>
                        <SelectItem value="normal">보통</SelectItem>
                        <SelectItem value="wide">넓음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-animations"
                        checked={
                          editingWidget.settings?.enable_animations ?? true
                        }
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              enable_animations: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="enable-animations" className="text-sm">
                        애니메이션 효과 사용
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enable-shadows"
                        checked={editingWidget.settings?.enable_shadows ?? true}
                        onCheckedChange={(checked) => {
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              enable_shadows: checked,
                            },
                          });
                        }}
                      />
                      <Label htmlFor="enable-shadows" className="text-sm">
                        카드 그림자 효과
                      </Label>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      스타일 설정은 실시간으로 미리보기에 반영됩니다.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t">
                <h5 className="font-medium text-sm mb-3">조직도 정보</h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 현재 샘플 데이터가 표시됩니다</p>
                  <p>
                    • 실제 조직도 데이터는 인사 관리 탭에서 설정할 수 있습니다
                  </p>
                  <p>
                    • 트리형은 계층 구조를, 카드형은 레벨별 그리드로 표시됩니다
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 캘린더 위젯 전용 설정 */}
          {editingWidget.type === "calendar" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">캘린더 설정</h4>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">기본 설정</TabsTrigger>
                  <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
                  <TabsTrigger value="departments">부서 관리</TabsTrigger>
                  <TabsTrigger value="display">표시 옵션</TabsTrigger>
                </TabsList>

                {/* 기본 설정 탭 */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="calendar-title">캘린더 제목</Label>
                    <Input
                      id="calendar-title"
                      value={
                        editingWidget.settings?.calendar_title || "일정관리"
                      }
                      placeholder="일정관리"
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            calendar_title: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      캘린더 위젯 상단에 표시될 제목을 설정합니다.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendar-height">캘린더 높이 (px)</Label>
                    <Input
                      id="calendar-height"
                      type="number"
                      min={400}
                      max={800}
                      value={editingWidget.settings?.calendar_height || 600}
                      onChange={(e) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            calendar_height: parseInt(e.target.value) || 600,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      캘린더의 높이를 설정합니다. (기본값: 600px)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-view">기본 보기 모드</Label>
                    <Select
                      value={editingWidget.settings?.default_view || "month"}
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            default_view: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">주간 보기</SelectItem>
                        <SelectItem value="month">월간 보기</SelectItem>
                        <SelectItem value="year">연간 보기</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      캘린더가 처음 로드될 때의 기본 보기 모드를 설정합니다.
                    </p>
                  </div>
                </TabsContent>

                {/* 카테고리 관리 탭 */}
                <TabsContent value="categories" className="space-y-4 pt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-sm">
                        카테고리 관리 (
                        {
                          (editingWidget.settings?.custom_categories || [])
                            .length
                        }
                        개)
                      </h5>
                      <Button
                        size="sm"
                        onClick={() => {
                          const newCategory = {
                            id: Date.now().toString(),
                            name: "",
                            color: "#6B7280",
                            description: "",
                          };
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              custom_categories: [
                                ...(editingWidget.settings?.custom_categories ||
                                  []),
                                newCategory,
                              ],
                            },
                          });
                        }}
                        className="h-7"
                      >
                        + 카테고리 추가
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {/* 기본 카테고리들 - 이제 편집 가능 */}
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        기본 카테고리
                      </div>
                      {(
                        editingWidget.settings?.base_categories || [
                          { id: "worship", name: "예배", color: "#3B82F6" },
                          { id: "meeting", name: "모임", color: "#10B981" },
                          { id: "education", name: "교육", color: "#F59E0B" },
                          { id: "event", name: "행사", color: "#EF4444" },
                          { id: "service", name: "봉사", color: "#8B5CF6" },
                          { id: "fellowship", name: "친교", color: "#EC4899" },
                          { id: "mission", name: "선교", color: "#06B6D4" },
                          { id: "other", name: "기타", color: "#6B7280" },
                        ]
                      ).map((category: any, index: number) => (
                        <div
                          key={category.id}
                          className="flex items-center gap-2 bg-white p-3 rounded border"
                        >
                          <input
                            type="color"
                            value={category.color}
                            onChange={(e) => {
                              const baseCategories = editingWidget.settings
                                ?.base_categories || [
                                {
                                  id: "worship",
                                  name: "예배",
                                  color: "#3B82F6",
                                },
                                {
                                  id: "meeting",
                                  name: "모임",
                                  color: "#10B981",
                                },
                                {
                                  id: "education",
                                  name: "교육",
                                  color: "#F59E0B",
                                },
                                { id: "event", name: "행사", color: "#EF4444" },
                                {
                                  id: "service",
                                  name: "봉사",
                                  color: "#8B5CF6",
                                },
                                {
                                  id: "fellowship",
                                  name: "친교",
                                  color: "#EC4899",
                                },
                                {
                                  id: "mission",
                                  name: "선교",
                                  color: "#06B6D4",
                                },
                                { id: "other", name: "기타", color: "#6B7280" },
                              ];
                              const updatedCategories = [...baseCategories];
                              updatedCategories[index] = {
                                ...category,
                                color: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_categories: updatedCategories,
                                },
                              });
                            }}
                            className="w-8 h-8 rounded border-0 cursor-pointer"
                          />
                          <Input
                            placeholder="카테고리 이름"
                            value={category.name}
                            onChange={(e) => {
                              const baseCategories = editingWidget.settings
                                ?.base_categories || [
                                {
                                  id: "worship",
                                  name: "예배",
                                  color: "#3B82F6",
                                },
                                {
                                  id: "meeting",
                                  name: "모임",
                                  color: "#10B981",
                                },
                                {
                                  id: "education",
                                  name: "교육",
                                  color: "#F59E0B",
                                },
                                { id: "event", name: "행사", color: "#EF4444" },
                                {
                                  id: "service",
                                  name: "봉사",
                                  color: "#8B5CF6",
                                },
                                {
                                  id: "fellowship",
                                  name: "친교",
                                  color: "#EC4899",
                                },
                                {
                                  id: "mission",
                                  name: "선교",
                                  color: "#06B6D4",
                                },
                                { id: "other", name: "기타", color: "#6B7280" },
                              ];
                              const updatedCategories = [...baseCategories];
                              updatedCategories[index] = {
                                ...category,
                                name: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_categories: updatedCategories,
                                },
                              });
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="설명 (선택사항)"
                            value={category.description || ""}
                            onChange={(e) => {
                              const baseCategories = editingWidget.settings
                                ?.base_categories || [
                                {
                                  id: "worship",
                                  name: "예배",
                                  color: "#3B82F6",
                                },
                                {
                                  id: "meeting",
                                  name: "모임",
                                  color: "#10B981",
                                },
                                {
                                  id: "education",
                                  name: "교육",
                                  color: "#F59E0B",
                                },
                                { id: "event", name: "행사", color: "#EF4444" },
                                {
                                  id: "service",
                                  name: "봉사",
                                  color: "#8B5CF6",
                                },
                                {
                                  id: "fellowship",
                                  name: "친교",
                                  color: "#EC4899",
                                },
                                {
                                  id: "mission",
                                  name: "선교",
                                  color: "#06B6D4",
                                },
                                { id: "other", name: "기타", color: "#6B7280" },
                              ];
                              const updatedCategories = [...baseCategories];
                              updatedCategories[index] = {
                                ...category,
                                description: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_categories: updatedCategories,
                                },
                              });
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const baseCategories = editingWidget.settings
                                ?.base_categories || [
                                {
                                  id: "worship",
                                  name: "예배",
                                  color: "#3B82F6",
                                },
                                {
                                  id: "meeting",
                                  name: "모임",
                                  color: "#10B981",
                                },
                                {
                                  id: "education",
                                  name: "교육",
                                  color: "#F59E0B",
                                },
                                { id: "event", name: "행사", color: "#EF4444" },
                                {
                                  id: "service",
                                  name: "봉사",
                                  color: "#8B5CF6",
                                },
                                {
                                  id: "fellowship",
                                  name: "친교",
                                  color: "#EC4899",
                                },
                                {
                                  id: "mission",
                                  name: "선교",
                                  color: "#06B6D4",
                                },
                                { id: "other", name: "기타", color: "#6B7280" },
                              ];
                              const updatedCategories = baseCategories.filter(
                                (_: any, i: number) => i !== index
                              );
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_categories: updatedCategories,
                                },
                              });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}

                      {/* 커스텀 카테고리들 */}
                      {(editingWidget.settings?.custom_categories || [])
                        .length > 0 && (
                        <>
                          <div className="text-xs font-medium text-gray-600 mb-2 mt-4">
                            추가 카테고리
                          </div>
                          {(
                            editingWidget.settings?.custom_categories || []
                          ).map((category: any, index: number) => (
                            <div
                              key={category.id}
                              className="flex items-center gap-2 bg-white p-3 rounded border"
                            >
                              <input
                                type="color"
                                value={category.color}
                                onChange={(e) => {
                                  const updatedCategories = [
                                    ...(editingWidget.settings
                                      ?.custom_categories || []),
                                  ];
                                  updatedCategories[index] = {
                                    ...category,
                                    color: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_categories: updatedCategories,
                                    },
                                  });
                                }}
                                className="w-8 h-8 rounded border-0 cursor-pointer"
                              />
                              <Input
                                placeholder="카테고리 이름"
                                value={category.name}
                                onChange={(e) => {
                                  const updatedCategories = [
                                    ...(editingWidget.settings
                                      ?.custom_categories || []),
                                  ];
                                  updatedCategories[index] = {
                                    ...category,
                                    name: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_categories: updatedCategories,
                                    },
                                  });
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="설명 (선택사항)"
                                value={category.description || ""}
                                onChange={(e) => {
                                  const updatedCategories = [
                                    ...(editingWidget.settings
                                      ?.custom_categories || []),
                                  ];
                                  updatedCategories[index] = {
                                    ...category,
                                    description: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_categories: updatedCategories,
                                    },
                                  });
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const updatedCategories = (
                                    editingWidget.settings?.custom_categories ||
                                    []
                                  ).filter((_: any, i: number) => i !== index);
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_categories: updatedCategories,
                                    },
                                  });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </>
                      )}

                      {(editingWidget.settings?.custom_categories || [])
                        .length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">커스텀 카테고리가 없습니다.</p>
                          <p className="text-xs mt-1">
                            위의 '카테고리 추가' 버튼을 클릭해서 새 카테고리를
                            추가해보세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 부서 관리 탭 */}
                <TabsContent value="departments" className="space-y-4 pt-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-sm">
                        부서 관리 (
                        {
                          (editingWidget.settings?.custom_departments || [])
                            .length
                        }
                        개)
                      </h5>
                      <Button
                        size="sm"
                        onClick={() => {
                          const newDepartment = {
                            id: Date.now().toString(),
                            name: "",
                            description: "",
                            manager: "",
                          };
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              custom_departments: [
                                ...(editingWidget.settings
                                  ?.custom_departments || []),
                                newDepartment,
                              ],
                            },
                          });
                        }}
                        className="h-7"
                      >
                        + 부서 추가
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {/* 기본 부서들 - 이제 편집 가능 */}
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        기본 부서
                      </div>
                      {(
                        editingWidget.settings?.base_departments || [
                          {
                            id: "all",
                            name: "전체",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "ministry",
                            name: "목회부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "education",
                            name: "교육부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "worship",
                            name: "찬양부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "mission",
                            name: "선교부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "service",
                            name: "봉사부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "youth",
                            name: "청년부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "adult",
                            name: "장년부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "children",
                            name: "유년부",
                            manager: "",
                            description: "",
                          },
                          {
                            id: "other",
                            name: "기타",
                            manager: "",
                            description: "",
                          },
                        ]
                      ).map((department: any, index: number) => (
                        <div
                          key={department.id}
                          className="flex items-center gap-2 bg-white p-3 rounded border"
                        >
                          <Input
                            placeholder="부서 이름"
                            value={department.name}
                            onChange={(e) => {
                              const baseDepartments = editingWidget.settings
                                ?.base_departments || [
                                {
                                  id: "all",
                                  name: "전체",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "ministry",
                                  name: "목회부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "education",
                                  name: "교육부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "worship",
                                  name: "찬양부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "mission",
                                  name: "선교부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "service",
                                  name: "봉사부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "youth",
                                  name: "청년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "adult",
                                  name: "장년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "children",
                                  name: "유년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "other",
                                  name: "기타",
                                  manager: "",
                                  description: "",
                                },
                              ];
                              const updatedDepartments = [...baseDepartments];
                              updatedDepartments[index] = {
                                ...department,
                                name: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_departments: updatedDepartments,
                                },
                              });
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="담당자 (선택사항)"
                            value={department.manager || ""}
                            onChange={(e) => {
                              const baseDepartments = editingWidget.settings
                                ?.base_departments || [
                                {
                                  id: "all",
                                  name: "전체",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "ministry",
                                  name: "목회부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "education",
                                  name: "교육부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "worship",
                                  name: "찬양부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "mission",
                                  name: "선교부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "service",
                                  name: "봉사부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "youth",
                                  name: "청년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "adult",
                                  name: "장년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "children",
                                  name: "유년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "other",
                                  name: "기타",
                                  manager: "",
                                  description: "",
                                },
                              ];
                              const updatedDepartments = [...baseDepartments];
                              updatedDepartments[index] = {
                                ...department,
                                manager: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_departments: updatedDepartments,
                                },
                              });
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="설명 (선택사항)"
                            value={department.description || ""}
                            onChange={(e) => {
                              const baseDepartments = editingWidget.settings
                                ?.base_departments || [
                                {
                                  id: "all",
                                  name: "전체",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "ministry",
                                  name: "목회부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "education",
                                  name: "교육부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "worship",
                                  name: "찬양부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "mission",
                                  name: "선교부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "service",
                                  name: "봉사부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "youth",
                                  name: "청년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "adult",
                                  name: "장년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "children",
                                  name: "유년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "other",
                                  name: "기타",
                                  manager: "",
                                  description: "",
                                },
                              ];
                              const updatedDepartments = [...baseDepartments];
                              updatedDepartments[index] = {
                                ...department,
                                description: e.target.value,
                              };
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_departments: updatedDepartments,
                                },
                              });
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const baseDepartments = editingWidget.settings
                                ?.base_departments || [
                                {
                                  id: "all",
                                  name: "전체",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "ministry",
                                  name: "목회부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "education",
                                  name: "교육부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "worship",
                                  name: "찬양부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "mission",
                                  name: "선교부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "service",
                                  name: "봉사부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "youth",
                                  name: "청년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "adult",
                                  name: "장년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "children",
                                  name: "유년부",
                                  manager: "",
                                  description: "",
                                },
                                {
                                  id: "other",
                                  name: "기타",
                                  manager: "",
                                  description: "",
                                },
                              ];
                              const updatedDepartments = baseDepartments.filter(
                                (_: any, i: number) => i !== index
                              );
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  base_departments: updatedDepartments,
                                },
                              });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}

                      {/* 커스텀 부서들 */}
                      {(editingWidget.settings?.custom_departments || [])
                        .length > 0 && (
                        <>
                          <div className="text-xs font-medium text-gray-600 mb-2 mt-4">
                            추가 부서
                          </div>
                          {(
                            editingWidget.settings?.custom_departments || []
                          ).map((department: any, index: number) => (
                            <div
                              key={department.id}
                              className="flex items-center gap-2 bg-white p-3 rounded border"
                            >
                              <Input
                                placeholder="부서 이름"
                                value={department.name}
                                onChange={(e) => {
                                  const updatedDepartments = [
                                    ...(editingWidget.settings
                                      ?.custom_departments || []),
                                  ];
                                  updatedDepartments[index] = {
                                    ...department,
                                    name: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_departments: updatedDepartments,
                                    },
                                  });
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="담당자 (선택사항)"
                                value={department.manager || ""}
                                onChange={(e) => {
                                  const updatedDepartments = [
                                    ...(editingWidget.settings
                                      ?.custom_departments || []),
                                  ];
                                  updatedDepartments[index] = {
                                    ...department,
                                    manager: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_departments: updatedDepartments,
                                    },
                                  });
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="설명 (선택사항)"
                                value={department.description || ""}
                                onChange={(e) => {
                                  const updatedDepartments = [
                                    ...(editingWidget.settings
                                      ?.custom_departments || []),
                                  ];
                                  updatedDepartments[index] = {
                                    ...department,
                                    description: e.target.value,
                                  };
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_departments: updatedDepartments,
                                    },
                                  });
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const updatedDepartments = (
                                    editingWidget.settings
                                      ?.custom_departments || []
                                  ).filter((_: any, i: number) => i !== index);
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      custom_departments: updatedDepartments,
                                    },
                                  });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                        </>
                      )}

                      {(editingWidget.settings?.custom_departments || [])
                        .length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">커스텀 부서가 없습니다.</p>
                          <p className="text-xs mt-1">
                            위의 '부서 추가' 버튼을 클릭해서 새 부서를
                            추가해보세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 표시 옵션 탭 */}
                <TabsContent value="display" className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm">UI 표시 옵션</h5>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-add-button"
                        checked={
                          editingWidget.settings?.show_add_button ?? true
                        }
                        onCheckedChange={(checked) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_add_button: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-add-button">
                        일정 추가 버튼 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-category-filter"
                        checked={
                          editingWidget.settings?.show_category_filter ?? true
                        }
                        onCheckedChange={(checked) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_category_filter: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-category-filter">
                        카테고리 필터 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-department-filter"
                        checked={
                          editingWidget.settings?.show_department_filter ?? true
                        }
                        onCheckedChange={(checked) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_department_filter: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-department-filter">
                        부서 필터 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-view-toggle"
                        checked={
                          editingWidget.settings?.show_view_toggle ?? true
                        }
                        onCheckedChange={(checked) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_view_toggle: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-view-toggle">
                        보기 모드 토글 버튼 표시
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-navigation"
                        checked={
                          editingWidget.settings?.show_navigation ?? true
                        }
                        onCheckedChange={(checked) =>
                          setEditingWidget({
                            ...editingWidget,
                            settings: {
                              ...editingWidget.settings,
                              show_navigation: checked === true,
                            },
                          })
                        }
                      />
                      <Label htmlFor="show-navigation">
                        날짜 네비게이션 버튼 표시
                      </Label>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-3">캘린더 정보</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• 사용자가 일정을 추가, 편집, 삭제할 수 있습니다</p>
                      <p>• 카테고리별로 색상을 구분하여 표시됩니다</p>
                      <p>• 부서별 필터링이 가능합니다</p>
                      <p>• 종일 일정과 시간 지정 일정을 모두 지원합니다</p>
                      <p>• 기본 카테고리/부서 외에 커스텀 추가가 가능합니다</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* 간단 캘린더 위젯 전용 설정 */}
          {editingWidget.type === "simple-calendar" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">간단 캘린더 설정</h4>

              <div className="space-y-2">
                <Label htmlFor="simple-calendar-event-count">
                  표시할 일정 개수
                </Label>
                <Input
                  id="simple-calendar-event-count"
                  type="number"
                  min="1"
                  max="50"
                  value={editingWidget.settings?.event_count || 10}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        event_count: Math.max(
                          1,
                          Math.min(50, parseInt(e.target.value) || 10)
                        ),
                      },
                    })
                  }
                  placeholder="일정 개수 입력"
                />
                <p className="text-xs text-gray-500">
                  각 탭(다가올 일정, 지난 일정)에 표시할 일정의 개수를
                  설정합니다. (1-50개)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="simple-calendar-default-tab">
                  기본 표시 탭
                </Label>
                <Select
                  value={editingWidget.settings?.default_tab || "upcoming"}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        default_tab: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="기본 탭 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">다가올 일정</SelectItem>
                    <SelectItem value="past">지난 일정</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  위젯이 처음 로드될 때 기본으로 표시할 탭을 선택합니다.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-category-colors"
                    checked={
                      editingWidget.settings?.show_category_colors ?? true
                    }
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          show_category_colors: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="show-category-colors">
                    카테고리 색상 표시
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  일정 왼쪽에 카테고리를 나타내는 색상 점을 표시합니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-all-day-badge"
                    checked={editingWidget.settings?.show_all_day_badge ?? true}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          show_all_day_badge: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="show-all-day-badge">
                    종일 일정 배지 표시
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  종일 일정에 "종일" 배지를 표시합니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-tab-buttons"
                    checked={editingWidget.settings?.show_tab_buttons ?? true}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          show_tab_buttons: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="show-tab-buttons">탭 버튼 표시</Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  다가올 일정/지난 일정 전환 탭 버튼을 표시합니다.
                </p>
              </div>
            </div>
          )}

          {/* 프로그램 위젯 전용 설정 */}
          {editingWidget.type === "programs" && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">프로그램 위젯 설정</h4>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">기본 설정</TabsTrigger>
                  <TabsTrigger value="tabs">탭 설정</TabsTrigger>
                  <TabsTrigger value="advanced">고급 설정</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">프로그램 선택</Label>
                    <Select
                      value={editingWidget.settings?.selected_program || ""}
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            selected_program: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="프로그램을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs?.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      위젯에서 표시할 프로그램을 선택합니다.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">기본 탭</Label>
                    <Select
                      value={editingWidget.settings?.default_tab || "overview"}
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            default_tab: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="기본 탭 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">개요</SelectItem>
                        <SelectItem value="calendar">일정</SelectItem>
                        <SelectItem value="participants">참가자</SelectItem>
                        <SelectItem value="finance">재정</SelectItem>
                        <SelectItem value="teams">팀</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      위젯이 처음 로드될 때 기본으로 표시할 탭을 선택합니다.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="tabs" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      공통 탭에 표시할 기능
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "calendar", label: "일정" },
                        { key: "participants", label: "참가자" },
                        { key: "finance", label: "재정" },
                        { key: "overview", label: "개요" },
                      ].map((tab) => (
                        <div
                          key={tab.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`common-${tab.key}`}
                            checked={
                              editingWidget.settings?.common_tabs?.includes(
                                tab.key
                              ) || false
                            }
                            onCheckedChange={(checked) => {
                              const currentTabs =
                                editingWidget.settings?.common_tabs || [];
                              const newTabs = checked
                                ? [...currentTabs, tab.key]
                                : currentTabs.filter(
                                    (t: string) => t !== tab.key
                                  );
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  common_tabs: newTabs,
                                },
                              });
                            }}
                          />
                          <Label
                            htmlFor={`common-${tab.key}`}
                            className="text-sm font-normal"
                          >
                            {tab.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      공통 탭에서 표시할 기능들을 선택합니다.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      팀 탭에 표시할 기능
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "calendar", label: "일정" },
                        { key: "participants", label: "참가자" },
                        { key: "finance", label: "재정" },
                        { key: "overview", label: "개요" },
                      ].map((tab) => (
                        <div
                          key={tab.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`team-${tab.key}`}
                            checked={
                              editingWidget.settings?.team_tabs?.includes(
                                tab.key
                              ) || false
                            }
                            onCheckedChange={(checked) => {
                              const currentTabs =
                                editingWidget.settings?.team_tabs || [];
                              const newTabs = checked
                                ? [...currentTabs, tab.key]
                                : currentTabs.filter(
                                    (t: string) => t !== tab.key
                                  );
                              setEditingWidget({
                                ...editingWidget,
                                settings: {
                                  ...editingWidget.settings,
                                  team_tabs: newTabs,
                                },
                              });
                            }}
                          />
                          <Label
                            htmlFor={`team-${tab.key}`}
                            className="text-sm font-normal"
                          >
                            {tab.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      팀 탭에서 표시할 기능들을 선택합니다.
                    </p>
                  </div>

                  {/* 팀 선택 설정 */}
                  {editingWidget.settings?.selected_program && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        표시할 팀 선택
                      </Label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                        {(() => {
                          const selectedProgram = programs.find(
                            (p) =>
                              p.id === editingWidget.settings?.selected_program
                          );
                          const teams = selectedProgram?.teams || [];

                          if (teams.length === 0) {
                            return (
                              <p className="text-sm text-gray-500 text-center py-4">
                                선택된 프로그램에 등록된 팀이 없습니다.
                              </p>
                            );
                          }

                          return teams.map((team: any) => (
                            <div
                              key={team.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`team-select-${team.id}`}
                                checked={
                                  editingWidget.settings?.selected_teams?.includes(
                                    team.id
                                  ) || false
                                }
                                onCheckedChange={(checked) => {
                                  const currentTeams =
                                    editingWidget.settings?.selected_teams ||
                                    [];
                                  const newTeams = checked
                                    ? [...currentTeams, team.id]
                                    : currentTeams.filter(
                                        (t: string) => t !== team.id
                                      );
                                  setEditingWidget({
                                    ...editingWidget,
                                    settings: {
                                      ...editingWidget.settings,
                                      selected_teams: newTeams,
                                    },
                                  });
                                }}
                              />
                              <Label
                                htmlFor={`team-select-${team.id}`}
                                className="text-sm font-normal flex-1"
                              >
                                {team.name}
                                {team.description && (
                                  <span className="text-xs text-gray-500 block">
                                    {team.description}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ));
                        })()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const selectedProgram = programs.find(
                              (p) =>
                                p.id ===
                                editingWidget.settings?.selected_program
                            );
                            const teams = selectedProgram?.teams || [];
                            const allTeamIds = teams.map(
                              (team: any) => team.id
                            );
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                selected_teams: allTeamIds,
                              },
                            });
                          }}
                        >
                          전체 선택
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                selected_teams: [],
                              },
                            });
                          }}
                        >
                          전체 해제
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        팀 탭에서 표시할 팀들을 선택합니다. 선택하지 않으면 모든
                        팀이 표시됩니다.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="programs-default-main-tab">
                      기본 상위 탭
                    </Label>
                    <Select
                      value={
                        editingWidget.settings?.default_main_tab || "common"
                      }
                      onValueChange={(value) =>
                        setEditingWidget({
                          ...editingWidget,
                          settings: {
                            ...editingWidget.settings,
                            default_main_tab: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="기본 상위 탭 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">공통</SelectItem>
                        <SelectItem value="team">팀</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      위젯이 처음 로드될 때 기본으로 표시할 상위 탭을
                      선택합니다.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="programs-tab-permissions">
                      탭별 권한 설정
                    </Label>
                    <p className="text-xs text-gray-500">
                      각 탭에 접근할 수 있는 사용자 권한을 설정합니다. 선택하지
                      않으면 모든 사용자가 접근할 수 있습니다.
                    </p>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">
                        탭별 권한 설정
                      </Label>

                      {/* 탭 설정 */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          탭 접근 권한
                        </Label>
                        {[
                          "calendar",
                          "participants",
                          "finance",
                          "checklist",
                          "overview",
                        ].map((subTab) => (
                          <div key={subTab} className="space-y-2">
                            <Label className="text-sm font-medium">
                              {subTab === "calendar"
                                ? "일정"
                                : subTab === "participants"
                                  ? "참가자"
                                  : subTab === "finance"
                                    ? "재정"
                                    : subTab === "checklist"
                                      ? "확인사항"
                                      : "개요"}{" "}
                              탭
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                "admin",
                                "tier0",
                                "tier1",
                                "tier2",
                                "tier3",
                                "guest",
                              ].map((role) => (
                                <div
                                  key={role}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={`${subTab}-${role}`}
                                    checked={
                                      editingWidget.settings?.tab_permissions?.[
                                        subTab
                                      ]?.includes(role) || false
                                    }
                                    onChange={(e) => {
                                      const currentPermissions =
                                        editingWidget.settings
                                          ?.tab_permissions || {};
                                      const currentTabPermissions =
                                        currentPermissions[subTab] || [];
                                      const newTabPermissions = e.target.checked
                                        ? [...currentTabPermissions, role]
                                        : currentTabPermissions.filter(
                                            (r: string) => r !== role
                                          );

                                      setEditingWidget({
                                        ...editingWidget,
                                        settings: {
                                          ...editingWidget.settings,
                                          tab_permissions: {
                                            ...currentPermissions,
                                            [subTab]: newTabPermissions,
                                          },
                                        },
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`${subTab}-${role}`}
                                    className="text-xs"
                                  >
                                    {role === "admin"
                                      ? "관리자"
                                      : role === "tier0"
                                        ? "Tier 0"
                                        : role === "tier1"
                                          ? "Tier 1"
                                          : role === "tier2"
                                            ? "Tier 2"
                                            : role === "tier3"
                                              ? "Tier 3"
                                              : "게스트"}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 빠른 설정 버튼 */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allPermissions = {
                              calendar: [
                                "admin",
                                "tier0",
                                "tier1",
                                "tier2",
                                "tier3",
                                "guest",
                              ],
                              participants: [
                                "admin",
                                "tier0",
                                "tier1",
                                "tier2",
                              ],
                              finance: ["admin", "tier0", "tier1"],
                              checklist: ["admin", "tier0", "tier1", "tier2"],
                              overview: [
                                "admin",
                                "tier0",
                                "tier1",
                                "tier2",
                                "tier3",
                                "guest",
                              ],
                            };

                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                tab_permissions: allPermissions,
                              },
                            });
                          }}
                        >
                          기본 권한 설정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const adminOnlyPermissions = {
                              calendar: ["admin", "tier0"],
                              participants: ["admin", "tier0"],
                              finance: ["admin", "tier0"],
                              checklist: ["admin", "tier0"],
                              overview: ["admin", "tier0"],
                            };

                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                tab_permissions: adminOnlyPermissions,
                              },
                            });
                          }}
                        >
                          관리자만
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWidget({
                              ...editingWidget,
                              settings: {
                                ...editingWidget.settings,
                                tab_permissions: {},
                              },
                            });
                          }}
                        >
                          모든 권한 해제
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="programs-subtitle">부제목</Label>
                <Input
                  id="programs-subtitle"
                  value={editingWidget.settings?.subtitle || ""}
                  onChange={(e) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        subtitle: e.target.value,
                      },
                    })
                  }
                  placeholder="프로그램별 주요 정보를 한눈에 확인하세요"
                />
                <p className="text-xs text-gray-500">
                  위젯 하단에 표시될 부제목을 설정합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="programs-selected-program">
                  선택된 프로그램
                </Label>
                <Select
                  value={editingWidget.settings?.selected_program || ""}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      settings: {
                        ...editingWidget.settings,
                        selected_program: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="프로그램 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.length > 0 ? (
                      programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        프로그램 로딩 중...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  위젯에서 표시할 특정 프로그램을 선택합니다. (현재{" "}
                  {programs.length}개 프로그램)
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-statistics"
                    checked={editingWidget.settings?.show_statistics ?? true}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          show_statistics: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="show-statistics">통계 카드 표시</Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  상단에 참가자, 일정, 재정 통계 카드를 표시합니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compact-view"
                    checked={editingWidget.settings?.compact_view ?? false}
                    onCheckedChange={(checked) =>
                      setEditingWidget({
                        ...editingWidget,
                        settings: {
                          ...editingWidget.settings,
                          compact_view: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="compact-view">컴팩트 보기</Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  위젯을 더 작은 크기로 표시합니다.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingWidget(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={async () => {
                await saveWidgetSettings();
                // setDialogOpen(false); // saveWidgetSettings 내부에서 처리
              }}
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // 위젯 너비에 따른 클래스 반환
  const getWidthClass = (width: number) => {
    switch (width) {
      case 3:
        return "w-[calc(25%-12px)]";
      case 4:
        return "w-[calc(33.333%-12px)]";
      case 6:
        return "w-[calc(50%-12px)]";
      case 8:
        return "w-[calc(66.666%-12px)]";
      case 9:
        return "w-[calc(75%-12px)]";
      case 12:
        return "w-full";
      default:
        return "w-full";
    }
  };
  // 위젯 타입에 따른 미리보기 렌더링
  const renderWidgetPreview = (widget: IWidget) => {
    const sourceId = widget.settings?.source_id;

    switch (widget.type) {
      case "banner":
        return (
          <div
            className={
              previewMode ? "" : "bg-white rounded overflow-hidden shadow"
            }
            style={
              previewMode && banners.length > 0
                ? { height: banners[0]?.image_height || "400px" }
                : {}
            }
          >
            {banners.length > 0 ? (
              <div
                className={`relative w-full ${previewMode ? "h-full" : "h-48"}`}
              >
                <img
                  src={banners[0]?.image_url}
                  alt="배너"
                  className="w-full h-full object-cover"
                />
                {banners[0]?.title && (
                  <div
                    className="absolute inset-0 bg-black flex items-center justify-center"
                    style={{ opacity: banners[0]?.overlay_opacity || 0.4 }}
                  >
                    <div className="text-white text-center p-4">
                      <h3 className="text-xl font-bold">{banners[0]?.title}</h3>
                      {banners[0]?.subtitle && (
                        <p className="text-sm mt-2">{banners[0]?.subtitle}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-purple-100 flex items-center justify-center">
                <div className="text-purple-500 font-medium">배너</div>
              </div>
            )}
          </div>
        );

      case "page":
        const page = pages.find((item) => item.id === sourceId);
        const pagePosts =
          page && page.page_type === "board"
            ? boardPosts[String(page.id)] || []
            : [];

        // 게시판 형식의 페이지인 경우
        if (page?.page_type === "board" && previewMode) {
          return (
            <div className="bg-white shadow rounded overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-bold">{widget.title}</h3>
              </div>

              {pagePosts.length > 0 ? (
                <div className="divide-y">
                  {pagePosts
                    .slice(0, widget.width >= 6 ? 5 : 3)
                    .map((post, index: any) => (
                      <div
                        key={post.id}
                        className="p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm truncate">
                            {post.title}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {widget.width >= 6 && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  등록된 게시물이 없습니다.
                </div>
              )}

              <div className="p-3 border-t text-center">
                <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                  더보기
                </span>
              </div>
            </div>
          );
        }

        // 일반 페이지인 경우
        return previewMode ? (
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">{widget.title}</h3>
              <p className="text-gray-600 line-clamp-3">
                {page?.description || "페이지 내용이 표시됩니다."}
              </p>
              <div className="mt-6 text-center">
                <a
                  href="#"
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300 text-sm font-medium"
                >
                  {widget.display_options?.media_more_text ||
                    "더 많은 미디어 보기"}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded">
            <div className="font-medium">{widget.title}</div>
            {page && (
              <div className="text-sm text-gray-500 mt-1">
                슬러그: {page.slug || "/"}
                {page.page_type === "board" && (
                  <span className="ml-2 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    게시판
                  </span>
                )}
              </div>
            )}
          </div>
        );
      case "board":
        return previewMode ? (
          <BoardlistWidget
            widget={widget}
            page={pages.find((p) => p.id === widget.display_options?.page_id)}
          />
        ) : (
          <div className="bg-green-50 p-4 rounded">
            <div className="font-medium">{widget.title || "게시판"}</div>
            <div className="text-sm text-gray-500 mt-1">게시판 (목록) 위젯</div>
            {widget.display_options?.page_id && (
              <div className="text-xs text-blue-500 mt-1">
                선택된 페이지:{" "}
                {pages.find((p) => p.id === widget.display_options?.page_id)
                  ?.title || "없음"}
              </div>
            )}
          </div>
        );

      case "board-section":
        return previewMode ? (
          <BoardWidget widget={widget} />
        ) : (
          <div className="bg-teal-50 p-4 rounded">
            <div className="font-medium">{widget.title || "게시판 (섹션)"}</div>
            <div className="text-sm text-gray-500 mt-1">게시판 (섹션) 위젯</div>
            {widget.display_options?.page_id && (
              <div className="text-xs text-blue-500 mt-1">
                선택된 페이지:{" "}
                {pages.find((p) => p.id === widget.display_options?.page_id)
                  ?.title || "없음"}
              </div>
            )}
          </div>
        );

      case "gallery":
        return previewMode ? (
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">{widget.title}</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {Array(6)
                  .fill(0)
                  .map((_, index: any) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded overflow-hidden relative"
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        이미지 {index + 1}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-3 border-t text-center">
              <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                갤러리 더보기
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-pink-50 p-4 rounded">
            <div className="font-medium">{widget.title}</div>
            <div className="text-sm text-gray-500 mt-1">갤러리 위젯</div>
          </div>
        );

      case "media":
        return previewMode ? (
          <MediaWidget widget={widget} />
        ) : (
          <div className="bg-purple-50 p-4 rounded">
            <div className="font-medium">{widget.title || "미디어 콘텐츠"}</div>
            <div className="text-sm text-gray-500 mt-1">
              미디어 위젯 (영상 및 오디오 콘텐츠)
            </div>
            {widget.display_options?.page_id && (
              <div className="text-xs text-blue-500 mt-1">
                선택된 페이지:{" "}
                {pages.find((p) => p.id === widget.display_options?.page_id)
                  ?.title || "없음"}
              </div>
            )}
          </div>
        );

      case "location":
        return previewMode ? (
          <LocationWidget
            id={`location-widget-${widget.id}`}
            widget={widget}
            page={pages.find((p) => p.id === widget.display_options?.page_id)}
          />
        ) : (
          <div className="bg-blue-50 p-4 rounded">
            <div className="font-medium">{widget.title || "위치 정보"}</div>
            <div className="text-sm text-gray-500 mt-1">
              위치 위젯 (지도 및 연락처)
            </div>
            {widget.display_options?.address && (
              <div className="text-xs text-blue-500 mt-1 truncate">
                주소: {widget.display_options.address.split("\n")[0]}
              </div>
            )}
          </div>
        );

      case "menu-list":
        const parentMenuId = widget.settings?.parent_menu_id;
        const parentMenu = menuItems.find((m) => m.id === parentMenuId);
        const childMenus = menuItems.filter(
          (m) => m.parent_id === parentMenuId
        );

        return previewMode ? (
          <MenuListWidget widget={widget} />
        ) : (
          <div className="bg-indigo-50 p-4 rounded">
            <div className="font-medium">{widget.title || "메뉴 목록"}</div>
            <div className="text-sm text-gray-500 mt-1">
              {parentMenu
                ? `그룹: ${parentMenu.title}`
                : "메뉴 그룹이 선택되지 않았습니다."}
            </div>
          </div>
        );

      case "recent-comments":
        return previewMode ? (
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">{widget.title}</h3>
            </div>
            <ul className="p-4 space-y-3">
              <li className="text-sm">
                <p className="truncate">
                  첫 번째 댓글 미리보기입니다. 반갑습니다.
                </p>
                <span className="text-xs text-gray-500">- 첫 번째 게시글</span>
              </li>
              <li className="text-sm">
                <p className="truncate">
                  두 번째 댓글은 내용이 조금 더 길 수 있습니다.
                </p>
                <span className="text-xs text-gray-500">- 공지사항</span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded">
            <div className="font-medium">{widget.title || "최근 댓글"}</div>
          </div>
        );

      case "popular-posts":
        return previewMode ? (
          <PopularPostsWidget widget={widget} />
        ) : (
          <div className="bg-red-50 p-4 rounded">
            <div className="font-medium">{widget.title || "인기 게시글"}</div>
          </div>
        );

      case "login":
        return previewMode ? (
          <div className="bg-white shadow rounded p-4 text-center">
            <h3 className="font-bold mb-3">
              {widget.title || "로그인/프로필"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {widget.display_options?.logged_out_title ||
                "로그인이 필요합니다."}
            </p>
            <Button size="sm" className="w-full">
              로그인
            </Button>
            <Button size="sm" variant="ghost" className="w-full mt-2">
              회원가입
            </Button>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <div className="font-medium">{widget.title || "로그인"}</div>
          </div>
        );

      case "strip":
        return <StripWidget widget={widget} />;

      case "carousel":
        return previewMode ? (
          <CarouselWidget widget={widget} />
        ) : (
          <div className="bg-orange-50 p-4 rounded">
            <div className="font-medium">
              {widget.title || "캐러셀 슬라이드"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              타입:{" "}
              {widget.settings?.carousel_type === CAROUSEL_TYPES.BASIC
                ? "기본 슬라이드"
                : widget.settings?.carousel_type === CAROUSEL_TYPES.GALLERY
                  ? "갤러리 카드"
                  : widget.settings?.carousel_type === CAROUSEL_TYPES.FULLSCREEN
                    ? "풀스크린 모드"
                    : "기본 슬라이드"}
            </div>
            {widget.display_options?.page_id && (
              <div className="text-xs text-blue-500 mt-1">
                선택된 페이지:{" "}
                {pages.find((p) => p.id === widget.display_options?.page_id)
                  ?.title || "없음"}
              </div>
            )}
          </div>
        );

      case "organization-chart":
        return previewMode ? (
          <OrganizationChartWidget widget={widget} />
        ) : (
          <div className="bg-teal-50 p-4 rounded">
            <div className="font-medium">{widget.title || "조직도"}</div>
            <div className="text-sm text-gray-500 mt-1">조직도 위젯</div>
            {widget.display_options?.page_id && (
              <div className="text-xs text-blue-500 mt-1">
                선택된 페이지:{" "}
                {pages.find((p) => p.id === widget.display_options?.page_id)
                  ?.title || "없음"}
              </div>
            )}
          </div>
        );

      case "calendar":
        return previewMode ? (
          <CalendarWidget
            widgetId={widget.id}
            settings={{
              ...widget.settings,
              title: widget.title,
            }}
          />
        ) : (
          <div className="bg-blue-50 p-4 rounded">
            <div className="font-medium">{widget.title || "캘린더"}</div>
            <div className="text-sm text-gray-500 mt-1">캘린더 위젯</div>
            {widget.settings?.calendar_title && (
              <div className="text-xs text-blue-500 mt-1">
                캘린더 제목: {widget.settings.calendar_title}
              </div>
            )}
          </div>
        );

      case "simple-calendar":
        return previewMode ? (
          <SimpleCalendarWidget widget={widget} />
        ) : (
          <div className="bg-purple-50 p-4 rounded">
            <div className="font-medium">{widget.title || "간단 캘린더"}</div>
            <div className="text-sm text-gray-500 mt-1">간단 캘린더 위젯</div>
            {widget.settings?.event_count && (
              <div className="text-xs text-purple-500 mt-1">
                표시 개수: {widget.settings.event_count}개
              </div>
            )}
            {widget.settings?.default_tab && (
              <div className="text-xs text-purple-500 mt-1">
                기본 탭:{" "}
                {widget.settings.default_tab === "upcoming"
                  ? "다가올 일정"
                  : "지난 일정"}
              </div>
            )}
          </div>
        );

      case "programs":
        return previewMode ? (
          <ProgramsWidget programs={programs} widget={widget} />
        ) : (
          <div className="bg-indigo-50 p-4 rounded">
            <div className="font-medium">{widget.title || "프로그램 위젯"}</div>
            <div className="text-sm text-gray-500 mt-1">프로그램 관리 위젯</div>
            {widget.settings?.selected_program && (
              <div className="text-xs text-indigo-500 mt-1">
                선택된 프로그램:{" "}
                {programs.find(
                  (p) => p.id === widget.settings?.selected_program
                )?.name || widget.settings.selected_program}
              </div>
            )}
            {widget.settings?.default_tab && (
              <div className="text-xs text-indigo-500 mt-1">
                기본 탭: {widget.settings.default_tab}
              </div>
            )}
          </div>
        );

      default:
        return <div className="bg-gray-100 p-4 rounded">알 수 없는 위젯</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">레이아웃 관리</h2>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select
              onValueChange={(value) => {
                setSelectedPageId(value === "homepage" ? null : value);
              }}
              defaultValue={
                selectedPageId === null ? "homepage" : selectedPageId
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="편집할 페이지를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homepage">홈페이지 (기본)</SelectItem>
                {pages.map((page: any) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {renderWidgetSettingsDialog()}

      {addingWidgetToArea && (
        <div
          className="fixed bg-black/30 inset-0 z-40"
          onClick={() => setAddingWidgetToArea(null)}
        >
          <div
            className="absolute bg-white rounded-md shadow-lg border p-4 w-64 z-50"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium">위젯 추가</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setAddingWidgetToArea(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-1">
                <div className="sticky top-0 bg-white z-10 pb-1 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("banner", addingWidgetToArea, {
                        title: "배너",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    배너 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("board", addingWidgetToArea, {
                        title: "게시판 (목록)",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    게시판 (목록) 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("board-section", addingWidgetToArea, {
                        title: "게시판 (섹션)",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    게시판 (섹션) 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("gallery", addingWidgetToArea, {
                        title: "갤러리",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    갤러리 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("media", addingWidgetToArea, {
                        title: "미디어",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    미디어 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("location", addingWidgetToArea, {
                        title: "위치 정보",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    위치 정보 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("menu-list", addingWidgetToArea, {
                        title: "하위 메뉴 목록",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    메뉴 목록 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("recent-comments", addingWidgetToArea, {
                        title: "최신 댓글",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    최근 댓글 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("popular-posts", addingWidgetToArea, {
                        title: "인기 게시글",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    인기 게시글 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("login", addingWidgetToArea, {
                        title: "로그인",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    로그인 위젯 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("strip", addingWidgetToArea, {
                        title: "스트립(띠 배너)",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    스트립(띠 배너) 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("carousel", addingWidgetToArea, {
                        title: "캐러셀 슬라이드",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    캐러셀 슬라이드 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("organization-chart", addingWidgetToArea, {
                        title: "조직도",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    조직도 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("calendar", addingWidgetToArea, {
                        title: "캘린더",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    캘린더 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("simple-calendar", addingWidgetToArea, {
                        title: "간단 캘린더",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    간단 캘린더 추가
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      addNewWidget("programs", addingWidgetToArea, {
                        title: "프로그램 위젯",
                      });
                      setAddingWidgetToArea(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    프로그램 위젯 추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={`grid gap-6 grid-cols-12 w-full max-w-screen-2xl mx-auto`}
        >
          {layoutAreas.map((area: any) => {
            let colSpanClass = area.id === "main" ? "col-span-8" : "col-span-2";

            return (
              <div key={area.id} className={colSpanClass}>
                <Card
                  key={area.id}
                  className={
                    previewMode
                      ? "shadow-none border-0 bg-transparent"
                      : "bg-gray-50/50"
                  }
                >
                  <CardHeader
                    className={
                      previewMode
                        ? "py-2 px-2 font-semibold"
                        : "py-4 px-4 font-semibold"
                    }
                  >
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{area.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent
                    className={previewMode ? "p-0 space-y-4" : "space-y-4"}
                  >
                    <Droppable droppableId={area.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`min-h-[100px] rounded-md ${!previewMode ? "border border-dashed border-gray-300 p-4" : ""}`}
                        >
                          <div>
                            {area.widgets.length === 0 ? (
                              <div className="text-center text-gray-500 py-8">
                                이 영역에 위젯을 추가하세요
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-4 w-full">
                                {area.widgets.map(
                                  (widget: any, index: number) => (
                                    <Draggable
                                      key={widget.id}
                                      draggableId={widget.id.toString()}
                                      index={index}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`${getWidthClass(
                                            widget.width
                                          )} ${
                                            !widget.is_active
                                              ? "opacity-50"
                                              : ""
                                          }`}
                                        >
                                          {previewMode ? (
                                            <div className="w-full relative group">
                                              {renderWidgetPreview(widget)}
                                              {/* 미리보기 모드에서도 편집 컨트롤 표시 (호버 시) */}
                                              <div className="absolute top-2 right-2 flex space-x-1 bg-white/80 backdrop-blur-sm rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  {...provided.dragHandleProps}
                                                >
                                                  <MoveVertical className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  onClick={() => {
                                                    setEditingWidget(widget);
                                                    setDialogOpen(true);
                                                  }}
                                                >
                                                  <Settings className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  onClick={() =>
                                                    deleteWidget(widget.id)
                                                  }
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <Card>
                                              <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
                                                <CardTitle className="text-sm font-medium">
                                                  {widget.title}
                                                </CardTitle>
                                                <div className="flex space-x-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    {...provided.dragHandleProps}
                                                  >
                                                    <MoveVertical className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                      setEditingWidget(widget);
                                                      setDialogOpen(true);
                                                    }}
                                                  >
                                                    <Settings className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                      deleteWidget(widget.id)
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </CardHeader>
                                              <CardContent className="p-3">
                                                {renderWidgetPreview(widget)}
                                              </CardContent>
                                            </Card>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          {provided.placeholder}
                          <div className="mt-4 flex justify-center relative">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAddingWidgetToArea(area.id)}
                              id={`add-widget-btn-${area.id}`}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              위젯 추가
                            </Button>
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* 이미지 브라우저 컴포넌트 */}
      <ImageBrowser
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onImageSelect={(imageUrl: string, imageName?: string) => {
          if (!editingWidget) return;

          const currentMode = editingWidget.settings?.currentMode || "desktop";
          const currentImages =
            currentMode === "desktop"
              ? editingWidget.settings?.desktop_images || []
              : editingWidget.settings?.mobile_images || [];

          if (currentImages.length >= 8) {
            toast({
              title: "이미지 개수 제한",
              description: "최대 8개까지만 추가할 수 있습니다.",
              variant: "destructive",
            });
            return;
          }

          // 새 슬라이드 추가
          const newImage = {
            image_url: imageUrl,
            title: "",
            description: "",
            link_url: "",
          };

          const updatedSettings = { ...editingWidget.settings };
          if (currentMode === "desktop") {
            updatedSettings.desktop_images = [...currentImages, newImage];
          } else {
            updatedSettings.mobile_images = [...currentImages, newImage];
          }
          updatedSettings.currentMode = undefined;

          setEditingWidget({
            ...editingWidget,
            settings: updatedSettings,
          });

          toast({
            title: "새 슬라이드 추가 성공",
            description: `${currentMode === "mobile" ? "모바일" : "데스크톱"} 이미지와 함께 새 슬라이드가 추가되었습니다.`,
          });
        }}
        buckets={["homepage-banners", "images", "admin"]}
        title="캐러셀용 이미지 선택"
      />
    </div>
  );
}

// 조직원 추가/편집 폼 컴포넌트
function MemberForm({
  member,
  onSave,
  onCancel,
  existingMembers,
}: {
  member?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  existingMembers: any[];
}) {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    position: member?.position || "",
    department: member?.department || "",
    level: member?.level || 0,
    parentId: member?.parentId || "",
    email: member?.email || "",
    phone: member?.phone || "",
    avatar: member?.avatar || "",
    social_links: member?.social_links || {
      facebook: "",
      twitter: "",
      linkedin: "",
      instagram: "",
      youtube: "",
      threads: "",
    },
  });
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [memberImageUploading, setMemberImageUploading] = useState(false);
  const memberFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.position.trim()) {
      return;
    }
    onSave(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const availableParents = existingMembers.filter(
    (m) => m.id !== member?.id && m.level < (formData.level || 0)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="이름을 입력하세요"
            required
          />
        </div>
        <div>
          <Label htmlFor="position">직책 *</Label>
          <Input
            id="position"
            list="position-suggestions"
            value={formData.position}
            onChange={(e) => handleChange("position", e.target.value)}
            placeholder="직책을 입력하세요"
            required
          />
          <datalist id="position-suggestions">
            {/* 교회 직책 */}
            <option value="담임목사" />
            <option value="부목사" />
            <option value="전도사" />
            <option value="장로" />
            <option value="안수집사" />
            <option value="집사" />
            <option value="권사" />
            <option value="서리집사" />
            <option value="교육부장" />
            <option value="찬양팀장" />

            {/* 일반 조직 직책 */}
            <option value="대표이사" />
            <option value="부사장" />
            <option value="상무" />
            <option value="이사" />
            <option value="부장" />
            <option value="차장" />
            <option value="과장" />
            <option value="대리" />
            <option value="주임" />
            <option value="사원" />

            {/* 학교 직책 */}
            <option value="교장" />
            <option value="교감" />
            <option value="부장교사" />
            <option value="교사" />

            {/* 정부/공공기관 직책 */}
            <option value="국장" />
            <option value="과장" />
            <option value="팀장" />
            <option value="주무관" />

            {/* 병원 직책 */}
            <option value="원장" />
            <option value="부원장" />
            <option value="진료부장" />
            <option value="과장" />
            <option value="전문의" />
            <option value="간호사" />
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">부서</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="부서명을 입력하세요"
          />
        </div>
        <div>
          <Label htmlFor="level">계층 레벨</Label>
          <Select
            value={formData.level.toString()}
            onValueChange={(value) => handleChange("level", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0 (최상위)</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.level > 0 && availableParents.length > 0 && (
        <div>
          <Label htmlFor="parent">상위자</Label>
          <Select
            value={formData.parentId || "none"}
            onValueChange={(value) =>
              handleChange("parentId", value === "none" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="상위자를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              {availableParents.map((parent: any) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name} ({parent.position})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="010-1234-5678"
          />
        </div>
      </div>

      <div>
        <Label>프로필 이미지</Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={formData.avatar}
              onChange={(e) => handleChange("avatar", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImageBrowser(true)}
              className="whitespace-nowrap"
            >
              📁 서버 이미지
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => memberFileInputRef.current?.click()}
              disabled={memberImageUploading}
              className="whitespace-nowrap"
            >
              {memberImageUploading ? "업로드 중..." : "📤 업로드"}
            </Button>
          </div>
          {formData.avatar && (
            <div className="flex items-center gap-3">
              <img
                src={formData.avatar}
                alt="미리보기"
                className="w-16 h-16 rounded-full object-cover border"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/80x80/gray/white?text=?";
                }}
              />
              <div className="text-sm text-gray-600">
                <p>미리보기</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleChange("avatar", "")}
                  className="mt-1"
                >
                  이미지 제거
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 파일 업로드 input */}
        <input
          type="file"
          ref={memberFileInputRef}
          className="hidden"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setMemberImageUploading(true);
            try {
              const supabase = createClient();
              const fileName = file.name;
              const filePath = `organization-avatars/${Date.now()}_${fileName}`;
              const { error: uploadError } = await supabase.storage
                .from("homepage-banners")
                .upload(filePath, file, {
                  cacheControl: "3600",
                  upsert: true,
                });

              if (uploadError) throw uploadError;

              const { data: publicUrlData } = supabase.storage
                .from("homepage-banners")
                .getPublicUrl(filePath);

              handleChange("avatar", publicUrlData.publicUrl);

              toast({
                title: "이미지 업로드 성공",
                description: "프로필 이미지가 성공적으로 업로드되었습니다.",
              });
            } catch (err) {
              toast({
                title: "이미지 업로드 실패",
                description: (err as any).message || "업로드 중 오류 발생",
                variant: "destructive",
              });
            } finally {
              setMemberImageUploading(false);
            }
          }}
        />
      </div>

      {/* 소셜 링크 섹션 */}
      <div className="pt-4 border-t border-gray-200">
        <Label className="text-sm font-medium mb-3 block">
          소셜 링크 (선택사항)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="facebook" className="text-xs text-gray-600">
              Facebook
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <Input
                id="facebook"
                value={formData.social_links.facebook}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    facebook: e.target.value,
                  })
                }
                placeholder="https://facebook.com/username"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="twitter" className="text-xs text-gray-600">
              X (Twitter)
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <Input
                id="twitter"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    twitter: e.target.value,
                  })
                }
                placeholder="https://x.com/username"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="linkedin" className="text-xs text-gray-600">
              LinkedIn
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <Input
                id="linkedin"
                value={formData.social_links.linkedin}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    linkedin: e.target.value,
                  })
                }
                placeholder="https://linkedin.com/in/username"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instagram" className="text-xs text-gray-600">
              Instagram
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <Input
                id="instagram"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    instagram: e.target.value,
                  })
                }
                placeholder="https://instagram.com/username"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="threads" className="text-xs text-gray-600">
              Threads
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.589-1.293-.2-2.253-.2-.809 0-1.612.159-2.38.472l-.48-1.874c.912-.375 1.918-.563 2.99-.563 1.505 0 2.658.483 3.425 1.437.637.793.951 1.824 1.034 2.958.085.05.168.102.249.156 1.16.784 1.857 1.751 2.095 2.882.309 1.471.157 3.307-1.188 5.185C17.999 22.663 15.598 23.971 12.186 24zM9.225 15.15c.49 0 .965-.04 1.41-.119.565-.095 1.023-.283 1.323-.544.328-.286.551-.679.652-1.14a11.459 11.459 0 0 0-2.717-.285c-.715.042-1.224.25-1.414.576-.146.251-.1.464-.025.617.117.238.342.386.771.386z" />
                </svg>
              </div>
              <Input
                id="threads"
                value={formData.social_links.threads}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    threads: e.target.value,
                  })
                }
                placeholder="https://threads.net/@username"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="youtube" className="text-xs text-gray-600">
              YouTube
            </Label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <Input
                id="youtube"
                value={formData.social_links.youtube}
                onChange={(e) =>
                  handleChange("social_links", {
                    ...formData.social_links,
                    youtube: e.target.value,
                  })
                }
                placeholder="https://youtube.com/@username"
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">{member ? "수정" : "추가"}</Button>
      </div>

      {/* 이미지 브라우저 다이얼로그 */}
      <ImageBrowser
        isOpen={showImageBrowser}
        onClose={() => setShowImageBrowser(false)}
        onImageSelect={(imageUrl: string, imageName?: string) => {
          handleChange("avatar", imageUrl);
          setShowImageBrowser(false);
          toast({
            title: "이미지 선택 완료",
            description: `${imageName || "이미지"}가 선택되었습니다.`,
          });
        }}
        buckets={["homepage-banners", "images", "admin"]}
        title="프로필 이미지 선택"
      />
    </form>
  );
}
