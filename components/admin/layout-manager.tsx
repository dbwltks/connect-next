"use client";

// React imports
import React, { useState, useEffect } from "react";

// Third-party imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, MoveVertical, Settings } from "lucide-react";

// UI component imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Widget imports
import { MediaWidget } from "../widgets/media-widget";
import { BoardlistWidget } from "../widgets/boardlist-widget";
import { BoardWidget } from "../widgets/board-widget";
import { BannerWidget } from "../widgets/banner-widget";
import { ContainerWidget } from "../widgets/container-widget";
import LocationWidget from "../widgets/location-widget";
import MenuListWidget from "../widgets/menu-list-widget";
import RecentCommentsWidget from "../widgets/recent-comments-widget";
import PopularPostsWidget from "../widgets/popular-posts-widget";
import LoginWidget from "../widgets/login-widget";
import { StripWidget } from "../widgets/strip-widget";
import { CarouselWidget } from "../widgets/carousel-widget";
import { OrganizationChartWidget } from "../widgets/organization-chart-widget";
import CalendarWidget from "../widgets/calendar-widget";
import SimpleCalendarWidget from "../widgets/simple-calendar-widget";
import ProgramsWidget from "../widgets/programs-widget";
import BannerSlider from "../home/banner-slider";

// Component imports
import { WidgetSettings } from "./WidgetSettings";

// Utility imports
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";

// Type imports
import { IWidget } from "@/types";

// 레이아웃 영역 타입 정의
type LayoutArea = {
  id: string;
  name: string;
  widgets: IWidget[];
};

// 메뉴 아이템 타입 정의
interface MenuItem {
  id: string;
  title: string;
  parent_id?: string | null;
  order_num: number;
}

// 배너 타입 정의
interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  image_height?: string;
  overlay_opacity?: number;
  is_active: boolean;
  menu_id?: string | null;
  order_num: number;
}

// 페이지 타입 정의
interface Page {
  id: string;
  title: string;
  description?: string;
  page_type: string;
}

// 프로그램 타입 정의
interface Program {
  id: string;
  title: string;
  description?: string;
}

// 역할 타입 정의
interface Role {
  id: string;
  name: string;
  description?: string;
}

// 권한 타입 정의
interface Permission {
  id: string;
  name: string;
  description?: string;
}

// 게시글 타입 정의
interface BoardPost {
  id: string;
  title: string;
  excerpt?: string;
  author: string;
  created_at: string;
  view_count: number;
}

// 위젯 크기에 따른 그리드 클래스 함수
const getWidgetGridClass = (width: number, isMainArea: boolean = true) => {
  if (!isMainArea) {
    // 사이드바에서는 항상 전체 너비
    return "col-span-12";
  }

  switch (width) {
    case 3:
      return "col-span-3";
    case 4:
      return "col-span-4";
    case 6:
      return "col-span-6";
    case 8:
      return "col-span-8";
    case 9:
      return "col-span-9";
    case 12:
      return "col-span-12";
    default:
      return "col-span-12";
  }
};

const getBackgroundClass = (bgColor: string) => {
  switch (bgColor) {
    case "white":
      return "bg-white";
    case "light-blue":
      return "bg-blue-50";
    case "light-green":
      return "bg-green-50";
    case "light-yellow":
      return "bg-yellow-50";
    case "light-pink":
      return "bg-pink-50";
    case "default":
    default:
      return "";
  }
};

const getScreenSizeClass = (size: string) => {
  switch (size) {
    case "sm":
      return "max-w-sm";
    case "md":
      return "max-w-md";
    case "lg":
      return "max-w-lg";
    case "xl":
      return "max-w-xl";
    case "2xl":
      return "max-w-2xl";
    case "3xl":
      return "max-w-3xl";
    case "4xl":
      return "max-w-4xl";
    case "5xl":
      return "max-w-5xl";
    case "6xl":
      return "max-w-6xl";
    case "7xl":
      return "max-w-7xl";
    case "screen-sm":
      return "max-w-screen-sm";
    case "screen-md":
      return "max-w-screen-md";
    case "screen-lg":
      return "max-w-screen-lg";
    case "screen-xl":
      return "max-w-screen-xl";
    case "screen-2xl":
      return "max-w-screen-2xl";
    case "full":
      return "max-w-full";
    case "none":
    default:
      return "max-w-none";
  }
};

// SortableItem 컴포넌트
function SortableItem({
  widget,
  renderWidget,
  setEditingWidget,
  setDialogOpen,
  deleteWidget,
  setAddingWidgetToArea,
  isMainArea = true,
}: {
  widget: IWidget;
  renderWidget: (widget: IWidget) => React.ReactNode;
  setEditingWidget: (widget: IWidget) => void;
  setDialogOpen: (open: boolean) => void;
  deleteWidget: (id: string) => void;
  setAddingWidgetToArea: (areaId: string | null) => void;
  isMainArea?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: widget.id.toString() });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  const gridClass = getWidgetGridClass(widget.width, isMainArea);

  const [isNearEdge, setIsNearEdge] = useState(false);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const edgeDistance = 40; // 가장자리 40px 범위
    
    const nearRightEdge = mouseX > rect.width - edgeDistance;
    const nearTopEdge = mouseY < edgeDistance;
    
    setIsNearEdge(nearRightEdge && nearTopEdge);

    // 드롭 위치 계산 (컨테이너일 때만)
    if (isOver && widget.type === 'container') {
      const middleY = rect.height / 2;
      setDropPosition(mouseY < middleY ? 'above' : 'below');
    }
  };
  
  const handleMouseLeave = () => {
    setIsNearEdge(false);
    setDropPosition(null);
  };

  return (
    <div
      className={`${gridClass} relative group ${!widget.is_active ? "opacity-50" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 위/아래 드롭 인디케이터 (컨테이너용) */}
      {isOver && widget.type === 'container' && dropPosition && (
        <>
          {/* 위쪽 드롭 인디케이터 */}
          {dropPosition === 'above' && (
            <div className="absolute -top-1 left-0 right-0 h-2 bg-blue-500 rounded-full pointer-events-none z-20 opacity-80" />
          )}
          {/* 아래쪽 드롭 인디케이터 */}
          {dropPosition === 'below' && (
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-blue-500 rounded-full pointer-events-none z-20 opacity-80" />
          )}
          {/* 전체 영역 하이라이트 */}
          <div className="absolute inset-0 bg-blue-100 border-2 border-blue-400 border-dashed rounded-md opacity-30 pointer-events-none z-10" />
        </>
      )}
      
      {/* 드래그 가능한 위젯 컨텐츠 */}
      <div
        ref={setNodeRef}
        style={dragStyle}
        {...attributes}
        className="w-full border-2 border-dashed border-transparent hover:border-blue-300 transition-colors cursor-grab active:cursor-grabbing"
      >
        {renderWidget(widget)}
      </div>
      
      {/* 드래그 핸들과 편집 컨트롤 (분리됨) */}
      <div className={`absolute ${widget.type === 'container' ? 'top-1 right-1' : widget.parent_id ? 'bottom-1 right-1' : 'bottom-1 right-1'} flex space-x-1 bg-white/95 backdrop-blur-sm rounded-lg p-1.5 transition-all duration-300 ease-out shadow-md z-20 border border-gray-200/50 ${isNearEdge ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} hover:opacity-100`}>
        <div
          {...listeners}
          className="h-7 w-7 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 rounded cursor-grab active:cursor-grabbing"
          onMouseDown={() => console.log("Drag started for:", widget.title)}
        >
          <MoveVertical className="h-3.5 w-3.5" />
        </div>
        {widget.type === 'container' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-blue-100 hover:text-blue-600"
            onClick={() => setAddingWidgetToArea(`container-${widget.id}`)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-green-100 hover:text-green-600"
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
          className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
          onClick={() => deleteWidget(widget.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// DroppableArea 컴포넌트
function DroppableArea({
  area,
  children,
}: {
  area: LayoutArea;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: area.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-md transition-colors border-2 border-dashed ${
        isOver 
          ? "border-blue-400 bg-blue-50/30" 
          : "border-transparent"
      }`}
    >
      {children}
    </div>
  );
}


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

// 영역 ID와 컬럼 위치 매핑
const AREA_ID_TO_COLUMN_POSITION: { [key: string]: number } = {
  left: 0,
  main: 1,
  right: 2,
};

export default function LayoutManager(): JSX.Element {
  // 유틸리티 함수 - Supabase 쿼리 헬퍼
  const supabase = createClient();

  const handleSupabaseError = (error: any, operation: string) => {
    console.error(`${operation} 중 오류가 발생했습니다:`, error);
    toast({
      title: "오류",
      description: `${operation} 중 오류가 발생했습니다.`,
      variant: "destructive",
    });
  };

  const fetchSupabaseData = async (
    table: string,
    select: string = "*",
    filters?: Array<{ column: string; value: any; operator?: string }>
  ) => {
    let query = supabase.from(table).select(select);

    if (filters) {
      filters.forEach((filter) => {
        const { column, value, operator = "eq" } = filter;
        if (operator === "is") {
          query = query.is(column, value);
        } else if (operator === "order") {
          query = query.order(column, { ascending: value });
        } else {
          query = (query as any)[operator](column, value);
        }
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // 위젯 업데이트 공통 헬퍼 함수
  const updateWidgetInDatabase = async (
    widgets: IWidget[],
    updateFields: { [key: string]: any } = {}
  ) => {
    for (const widget of widgets) {
      const updateData = { ...updateFields, ...widget };
      console.log('Updating widget in database:', { 
        id: widget.id, 
        settings: widget.settings,
        updateData 
      });
      
      const { error } = await supabase.from("cms_layout").update(updateData).eq("id", widget.id);
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
    }
  };

  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [allWidgets, setAllWidgets] = useState<IWidget[]>([]);  // 모든 위젯 저장
  const [layoutAreas, setLayoutAreas] = useState<LayoutArea[]>([
    { id: "left", name: "좌측 사이드바", widgets: [] },
    { id: "main", name: "메인 영역", widgets: [] },
    { id: "right", name: "우측 사이드바", widgets: [] },
  ]);
  const [editingWidget, setEditingWidget] = useState<IWidget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingWidgetToArea, setAddingWidgetToArea] = useState<string | null>(
    null
  );
  const [addingContainerToArea, setAddingContainerToArea] = useState<string | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null); // 드래그 중인 위젯 ID
  const [pages, setPages] = useState<Page[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // 권한 시스템 관련 상태
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [boardPosts, setBoardPosts] = useState<{ [key: string]: BoardPost[] }>(
    {}
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null); // null은 홈페이지
  const [layoutConfig, setLayoutConfig] = useState<string>("full");
  const [pageBackgroundColor, setPageBackgroundColor] = useState<string>("default");
  const [screenSize, setScreenSize] = useState<string>("none");

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMenuItems();
    fetchBanners();
    fetchPages();
    fetchPrograms();
    fetchRolesAndPermissions();
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
      const data = await fetchSupabaseData("cms_menus", "*", [
        { column: "order_num", value: true, operator: "order" },
      ]);
      setMenuItems(data);
    } catch (error) {
      handleSupabaseError(error, "메뉴 항목을 불러오는");
    }
  };

  // 배너 가져오기
  const fetchBanners = async () => {
    try {
      const data = await fetchSupabaseData("cms_banners", "*", [
        { column: "is_active", value: true },
        { column: "menu_id", value: null, operator: "is" },
        { column: "order_num", value: true, operator: "order" },
      ]);
      setBanners(data);
    } catch (error) {
      handleSupabaseError(error, "배너를 불러오는");
    }
  };

  // 더미 게시물 데이터 생성
  const generateDummyBoardPosts = (boardPages: Page[]) => {
    const boardPostsMap: Record<string, BoardPost[]> = {};

    boardPages.forEach((page) => {
      const postCount = Math.floor(Math.random() * 6) + 5; // 5-10개
      const posts: BoardPost[] = [];

      for (let i = 0; i < postCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

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

    return boardPostsMap;
  };

  // 페이지 가져오기
  const fetchPages = async () => {
    try {
      const data = await fetchSupabaseData("cms_pages");
      setPages(data);

      // 게시판 타입 페이지의 경우 최신글 데이터 가져오기 시도
      const boardPages =
        data?.filter((page: any) => page.page_type === "board") || [];
      if (boardPages.length > 0) {
        try {
          const boardPostsMap = generateDummyBoardPosts(boardPages);
          setBoardPosts(boardPostsMap);
        } catch (postError) {
          console.error(
            "게시물 데이터를 불러오는 중 오류가 발생했습니다:",
            postError
          );
        }
      }
    } catch (error) {
      handleSupabaseError(error, "페이지를 불러오는");
    }
  };

  // 프로그램 데이터 가져오기
  const fetchPrograms = async () => {
    try {
      const data = await fetchSupabaseData("programs");
      setPrograms(data);
    } catch (error) {
      handleSupabaseError(error, "프로그램을 불러오는");
    }
  };

  // 역할 데이터 가져오기
  const fetchRolesAndPermissions = async () => {
    try {
      // 역할 목록 로딩
      const rolesResponse = await fetch("/api/admin/roles");
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setAvailableRoles(rolesData.roles || []);
      }
    } catch (error) {
      console.error("권한 데이터 로딩 실패:", error);
    }
  };

  // 레이아웃 데이터 가져오기
  const fetchLayoutData = async (pageId: string | null) => {
    try {
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
      const widgets = data || [];
      
      // 모든 위젯 저장
      setAllWidgets(widgets);

      // 루트 레벨 위젯들만 영역에 배치 (parent_id가 null인 것들)
      widgets
        .filter((w: IWidget) => !w.parent_id)  // parent_id가 null 또는 undefined인 위젯들만
        .forEach((w: IWidget) => {
          if (w.column_position === 0) areas[0].widgets.push(w);
          else if (w.column_position === 2) areas[2].widgets.push(w);
          else areas[1].widgets.push(w); // main: 1 or null
        });

      // 각 영역 내에서 위젯 순서 정렬 (루트 레벨은 order 사용)
      areas.forEach((area) => {
        area.widgets.sort((a, b) => (a.order || 0) - (b.order || 0));
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

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 시작 처리
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  // 드래그 종료 처리 - 새로운 로직
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const draggedWidget = allWidgets.find((w) => w.id.toString() === activeId);
    if (!draggedWidget) return;

    // 드래그앤드롭 로직 분기
    if (draggedWidget.type === 'container') {
      await handleContainerDrop(draggedWidget, overId);
    } else {
      await handleWidgetDrop(draggedWidget, overId);
    }
  };

  // 컨테이너 드롭 처리 함수
  const handleContainerDrop = async (draggedContainer: IWidget, overId: string) => {
    const sourceArea = layoutAreas.find(area => 
      area.widgets.some(w => w.id === draggedContainer.id)
    );
    
    if (!sourceArea) return;

    // 다른 컨테이너 위에 드롭하는 경우 (위아래 순서 변경)
    const targetWidget = allWidgets.find(w => w.id.toString() === overId && w.type === 'container');
    if (targetWidget && !targetWidget.parent_id) {
      const targetWidgetArea = layoutAreas.find(area => 
        area.widgets.some(w => w.id === targetWidget.id)
      );
      
      if (targetWidgetArea && targetWidgetArea.id === sourceArea.id) {
        const sourceIndex = sourceArea.widgets.findIndex(w => w.id === draggedContainer.id);
        const targetIndex = sourceArea.widgets.findIndex(w => w.id === targetWidget.id);
        
        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
          const reorderedWidgets = arrayMove(sourceArea.widgets, sourceIndex, targetIndex);
          const updatedWidgets = reorderedWidgets.map((widget, index) => ({
            ...widget,
            order: index,
          }));
          
          setLayoutAreas(layoutAreas.map(area => 
            area.id === sourceArea.id ? { ...area, widgets: updatedWidgets } : area
          ));
          
          setAllWidgets(allWidgets.map(w => {
            const updated = updatedWidgets.find(uw => uw.id === w.id);
            return updated || w;
          }));
          
          try {
            setIsLoading(true);
            await updateWidgetInDatabase(updatedWidgets);
            toast({
              title: "성공",
              description: "컨테이너 순서가 변경되었습니다.",
            });
          } catch (error) {
            console.error("컨테이너 순서 업데이트 중 오류:", error);
            toast({
              title: "오류",
              description: "컨테이너 순서 업데이트 중 오류 발생",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        }
      }
    }

    // 영역으로 드롭하는 경우
    const targetArea = layoutAreas.find(area => area.id === overId);
    if (targetArea && targetArea.id !== sourceArea.id) {
      const sourceIndex = sourceArea.widgets.findIndex(w => w.id === draggedContainer.id);
      
      if (sourceIndex !== -1) {
        const movedContainer = { 
          ...draggedContainer, 
          column_position: AREA_ID_TO_COLUMN_POSITION[targetArea.id],
          order: targetArea.widgets.length
        };
        
        setLayoutAreas(layoutAreas.map(area => {
          if (area.id === sourceArea.id) {
            return { 
              ...area, 
              widgets: area.widgets.filter(w => w.id !== draggedContainer.id)
                .map((widget, index) => ({ ...widget, order: index }))
            };
          } else if (area.id === targetArea.id) {
            return { 
              ...area, 
              widgets: [...area.widgets, movedContainer]
            };
          }
          return area;
        }));
        
        setAllWidgets(allWidgets.map(w => 
          w.id === draggedContainer.id ? movedContainer : w
        ));
        
        try {
          setIsLoading(true);
          await supabase
            .from("cms_layout")
            .update({
              column_position: movedContainer.column_position,
              order: movedContainer.order,
            })
            .eq("id", draggedContainer.id);
          
          toast({
            title: "성공",
            description: "컨테이너가 다른 영역으로 이동되었습니다.",
          });
        } catch (error) {
          console.error("컨테이너 영역 이동 중 오류:", error);
          toast({
            title: "오류",
            description: "컨테이너 이동 중 오류 발생",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // 위젯 드롭 처리 함수
  const handleWidgetDrop = async (draggedWidget: IWidget, overId: string) => {
    // 위젯이 컨테이너 안에 있는 경우
    if (draggedWidget.parent_id) {
      const overWidget = allWidgets.find((w) => w.id.toString() === overId);
      
      // 같은 컨테이너 내에서 순서 변경
      if (overWidget && overWidget.parent_id === draggedWidget.parent_id) {
        const containerWidgets = allWidgets.filter(w => 
          w.parent_id === draggedWidget.parent_id
        ).sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));
        
        const activeIndex = containerWidgets.findIndex(w => w.id === draggedWidget.id);
        const overIndex = containerWidgets.findIndex(w => w.id === overWidget.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          const reorderedWidgets = arrayMove(containerWidgets, activeIndex, overIndex);
          const updatedWidgets = reorderedWidgets.map((widget, index) => ({
            ...widget,
            order_in_parent: index,
          }));
          
          // allWidgets 상태 업데이트
          const newAllWidgets = allWidgets.map(w => {
            const updated = updatedWidgets.find(uw => uw.id === w.id);
            return updated || w;
          });
          setAllWidgets(newAllWidgets);
          
          // DB 업데이트
          try {
            setIsLoading(true);
            for (const widget of updatedWidgets) {
              await supabase
                .from("cms_layout")
                .update({ order_in_parent: widget.order_in_parent })
                .eq("id", widget.id);
            }
            toast({
              title: "성공",
              description: "컨테이너 내 위젯 순서가 업데이트되었습니다.",
            });
          } catch (error) {
            console.error("컨테이너 위젯 순서 업데이트 중 오류:", error);
            toast({
              title: "오류",
              description: "위젯 순서 업데이트 중 오류 발생",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        }
        return;
      }
      
      // 다른 컨테이너로 이동
      if (overId.startsWith('container-')) {
        const newContainerId = overId.replace('container-', '');
        const updatedWidget = {
          ...draggedWidget,
          parent_id: newContainerId,
          order_in_parent: allWidgets.filter(w => w.parent_id === newContainerId).length,
        };
        
        setAllWidgets(allWidgets.map(w => 
          w.id === draggedWidget.id ? updatedWidget : w
        ));
        
        // DB 업데이트
        try {
          setIsLoading(true);
          await supabase
            .from("cms_layout")
            .update({ 
              parent_id: newContainerId,
              order_in_parent: updatedWidget.order_in_parent 
            })
            .eq("id", draggedWidget.id);
          
          toast({
            title: "성공",
            description: "위젯이 다른 컨테이너로 이동되었습니다.",
          });
        } catch (error) {
          console.error("위젯 컨테이너 이동 중 오류:", error);
          toast({
            title: "오류",
            description: "위젯 이동 중 오류 발생",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 컨테이너에서 일반 영역으로 이동
      const targetArea = layoutAreas.find(area => area.id === overId);
      if (targetArea) {
        const updatedWidget = {
          ...draggedWidget,
          parent_id: null,
          level: 0,
          order: targetArea.widgets.length,
          order_in_parent: undefined,
          column_position: AREA_ID_TO_COLUMN_POSITION[targetArea.id],
        } as IWidget;
        
        // 상태 업데이트
        const newAllWidgets = allWidgets.map(w => 
          w.id === draggedWidget.id ? updatedWidget : w
        );
        
        const newLayoutAreas = layoutAreas.map(area => {
          if (area.id === targetArea.id) {
            return {
              ...area,
              widgets: [...area.widgets, updatedWidget]
            };
          }
          return area;
        });
        
        setAllWidgets(newAllWidgets);
        setLayoutAreas(newLayoutAreas);
        
        // DB 업데이트
        try {
          setIsLoading(true);
          await supabase
            .from("cms_layout")
            .update({ 
              parent_id: null,
              level: 0,
              order: updatedWidget.order,
              order_in_parent: null,
              column_position: updatedWidget.column_position
            })
            .eq("id", draggedWidget.id);
          
          toast({
            title: "성공",
            description: "위젯이 컨테이너에서 영역으로 이동되었습니다.",
          });
        } catch (error) {
          console.error("위젯 영역 이동 중 오류:", error);
          toast({
            title: "오류",
            description: "위젯 이동 중 오류 발생",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
    } else {
      // 일반 영역에 있는 위젯이 컨테이너로 이동
      if (overId.startsWith('container-')) {
        const containerId = overId.replace('container-', '');
        
        // 소스 영역에서 위젯 제거
        const sourceArea = layoutAreas.find(area => 
          area.widgets.some(w => w.id === draggedWidget.id)
        );
        
        if (sourceArea) {
          const sourceIndex = sourceArea.widgets.findIndex(w => w.id === draggedWidget.id);
          
          if (sourceIndex !== -1) {
            // 위젯을 컨테이너로 이동
            const updatedWidget = {
              ...draggedWidget,
              parent_id: containerId,
              level: 1,
              order_in_parent: allWidgets.filter(w => w.parent_id === containerId).length,
            };
            
            // 상태 업데이트
            const newLayoutAreas = layoutAreas.map(area => {
              if (area.id === sourceArea.id) {
                return {
                  ...area,
                  widgets: area.widgets.filter(w => w.id !== draggedWidget.id)
                    .map((widget, index) => ({ ...widget, order: index }))
                };
              }
              return area;
            });
            
            const newAllWidgets = allWidgets.map(w => 
              w.id === draggedWidget.id ? updatedWidget : w
            );
            
            setAllWidgets(newAllWidgets);
            setLayoutAreas(newLayoutAreas);
            
            // DB 업데이트
            try {
              setIsLoading(true);
              
              await supabase
                .from("cms_layout")
                .update({ 
                  parent_id: containerId,
                  level: 1,
                  order_in_parent: updatedWidget.order_in_parent 
                })
                .eq("id", draggedWidget.id);
              
              // 소스 영역의 다른 위젯들 순서 업데이트
              const sourceWidgets = newLayoutAreas.find(a => a.id === sourceArea.id)?.widgets || [];
              if (sourceWidgets.length > 0) {
                await updateWidgetInDatabase(sourceWidgets);
              }
              
              toast({
                title: "성공",
                description: "위젯이 컨테이너로 이동되었습니다.",
              });
            } catch (error) {
              console.error("위젯 컨테이너 이동 중 오류:", error);
              toast({
                title: "오류",
                description: "위젯 이동 중 오류 발생",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          }
        }
        return;
      }
    }
  };

  // 새 컨테이너(줄) 추가
  const addNewContainer = async (targetAreaId: string) => {
    if (!targetAreaId) {
      console.error("컨테이너를 추가할 영역이 지정되지 않았습니다.");
      toast({
        title: "오류",
        description: "컨테이너를 추가할 영역을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const targetArea = layoutAreas.find((a) => a.id === targetAreaId);
      if (!targetArea) {
        throw new Error("대상 영역을 찾을 수 없습니다.");
      }

      // 새 컨테이너 데이터
      const newContainerData = {
        type: "container",
        title: "새 컨테이너",
        width: 12,
        height: null,
        order: targetArea.widgets.length,
        column_position: targetAreaId === "left" ? 0 : targetAreaId === "main" ? 1 : 2,
        is_active: true,
        display_options: {},
        settings: {
          background_color: "#ffffff",
          padding: "normal",
          content_align: "left",
          border_style: "none",
          border_radius: "none",
          use_full_width: false,
        },
        page_id: selectedPageId,
      };

      // DB에 컨테이너 추가
      const { data, error } = await supabase
        .from("cms_layout")
        .insert(newContainerData)
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
      setAddingContainerToArea(null);

      toast({
        title: "성공",
        description: "새 컨테이너가 추가되었습니다.",
      });
    } catch (error) {
      console.error("컨테이너 추가 중 오류가 발생했습니다:", error);
      toast({
        title: "오류",
        description: "컨테이너 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 새 위젯 추가
  const addNewWidget = async (
    type: string,
    targetAreaId: string,
    sourceItem?: { id?: string; title?: string; content?: string; url?: string }
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

    // 컨테이너 안에만 추가 가능
    const isContainerTarget = targetAreaId.startsWith("container-");
    if (!isContainerTarget) {
      toast({
        title: "오류", 
        description: "위젯은 컨테이너 안에만 추가할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    
    const containerId = targetAreaId.replace("container-", "");

    try {
      setIsLoading(true);

      // 컨테이너 안에 추가 - 컨테이너를 찾아서 그 영역을 타겟으로 설정
      const containerWidget = layoutAreas.flatMap(area => area.widgets)
        .find(w => w.id === containerId);
      
      if (!containerWidget) {
        throw new Error("컨테이너를 찾을 수 없습니다.");
      }
      
      // 컨테이너가 있는 영역을 타겟으로 설정
      const targetArea = layoutAreas.find(area => 
        area.widgets.some(w => w.id === containerId)
      );
      const newColumnPosition = containerWidget.column_position;
      
      if (!targetArea) {
        console.error(`영역을 찾을 수 없습니다.`);
        toast({
          title: "오류",
          description: "지정된 영역을 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 기본 위젯 설정
      const newWidgetData: Omit<IWidget, "id" | "created_at"> = {
        type,
        title:
          sourceItem?.title ||
          WIDGET_TYPES.find((w) => w.id === type)?.name ||
          "새 위젯",
        content: sourceItem?.content || "",
        column_position: newColumnPosition,
        order: targetArea.widgets.length, // 기존 order 유지 (호환성)
        order_in_parent: allWidgets.filter(w => w.parent_id === containerId).length,  // 컨테이너 안 위젯 개수
        width: 12,
        is_active: true,
        parent_id: containerId,
        level: 1,
        settings: {
          source_id: sourceItem?.id || null,
          source_type: type,
          url: sourceItem?.url || null,
          ...(type === "strip" ? { strip_type: "image", strip_value: "" } : {}),
        },
        page_id: selectedPageId,
      };

      // DB에 위젯 추가
      const { data, error } = await supabase
        .from("cms_layout")
        .insert(newWidgetData)
        .select()
        .single();

      if (error) throw error;

      // 상태 업데이트 - 컨테이너 안에만 추가되므로 일반 영역에는 추가하지 않음
      const newLayoutAreas = [...layoutAreas];
      const newAllWidgets = [...allWidgets, data]; // 모든 위젯 배열에 추가
      
      setAllWidgets(newAllWidgets);
      setLayoutAreas(newLayoutAreas);
      setAddingWidgetToArea(null); // 위젯 추가 다이얼로그 닫기

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
      const { error } = await supabase
        .from("cms_layout")
        .delete()
        .eq("id", widgetId);

      if (error) throw error;

      // 상태 업데이트
      const newLayoutAreas = layoutAreas.map((area) => ({
        ...area,
        widgets: area.widgets.filter((widget) => widget.id !== widgetId),
      }));

      // allWidgets에서도 삭제된 위젯 제거
      const newAllWidgets = allWidgets.filter((widget) => widget.id !== widgetId);
      
      setLayoutAreas(newLayoutAreas);
      setAllWidgets(newAllWidgets);

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


  // 컨테이너 렌더링 컴포넌트
  const renderContainerWidget = (widget: IWidget, allWidgets?: IWidget[]): React.ReactElement => {
    // 모든 위젯에서 이 컨테이너의 자식 위젯들을 찾기
    const containerWidgets = (allWidgets || [])
      .filter(w => w.parent_id === widget.id && w.is_active)
      .sort((a, b) => (a.order_in_parent || 0) - (b.order_in_parent || 0));
    
    return (
      <ContainerWidget 
        widget={widget}
        containerSettings={widget.settings}
      >
        <DroppableArea area={{ id: `container-${widget.id}`, name: widget.title || '', widgets: containerWidgets }}>
          <div className="min-h-[120px] relative">
            {containerWidgets.length === 0 ? (
              // 빈 컨테이너일 때
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center text-gray-600 mb-4">
                  <div className="text-sm font-medium">📦 컨테이너</div>
                  <div className="text-xs mt-1">이 컨테이너 안에 위젯들을 추가하세요</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingWidgetToArea(`container-${widget.id}`)}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  위젯 추가
                </Button>
              </div>
            ) : (
              // 컨테이너에 위젯들이 있을 때
              <SortableContext
                items={containerWidgets.map((w) => w.id.toString())}
                strategy={verticalListSortingStrategy}
              >  
                <div 
                  className="grid grid-cols-12"
                  style={{ gap: `${(widget.settings?.spacing || 4) * 4}px` }}
                >
                  {containerWidgets.map((containerWidget) => {
                    const getColSpanClass = (width: number): string => {
                      switch (width) {
                        case 3: return "col-span-3";
                        case 4: return "col-span-4";
                        case 6: return "col-span-6";
                        case 8: return "col-span-8";
                        case 9: return "col-span-9";
                        case 12: return "col-span-12";
                        default: return "col-span-12";
                      }
                    };
                    
                    return (
                      <div
                        key={containerWidget.id}
                        className={getColSpanClass(containerWidget.width || 12)}
                      >
                        <SortableItem
                          widget={containerWidget}
                          renderWidget={renderWidgetPreview}
                          setEditingWidget={setEditingWidget}
                          setDialogOpen={setDialogOpen}
                          deleteWidget={deleteWidget}
                          setAddingWidgetToArea={setAddingWidgetToArea}
                          isMainArea={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            )}
          </div>
        </DroppableArea>
      </ContainerWidget>
    );
  };

  // 공통 위젯 래퍼 컴포넌트
  // 위젯 타입에 따른 미리보기 렌더링
  const renderWidgetPreview = (widget: IWidget): React.ReactElement | null => {
    switch (widget.type) {
      case "container":
        return renderContainerWidget(widget, allWidgets);
      case "banner":
        return <BannerWidget widget={widget} banners={banners} menuId={selectedPageId} />;
      case "page":
      case "board":
        return <BoardlistWidget widget={widget} />;
      case "board-section":
        return <BoardWidget widget={widget} />;

      case "gallery":
        return <MediaWidget widget={widget} />;
      case "media":
        return <MediaWidget widget={widget} />;
      case "location":
        return <LocationWidget id={`location-widget-${widget.id}`} widget={widget} />;
      case "menu-list":
        return <MenuListWidget widget={widget} />;

      case "recent-comments":
        return <RecentCommentsWidget widget={widget} />;
      case "popular-posts":
        return <PopularPostsWidget widget={widget} />;
      case "login":
        return <LoginWidget widget={widget} />;
      case "strip":
        return <StripWidget widget={widget} />;
      case "carousel":
        return <CarouselWidget widget={widget} />;
      case "organization-chart":
        return <OrganizationChartWidget widget={widget} />;

      case "calendar":
        return <CalendarWidget widgetId={widget.id} settings={{ ...widget.settings, title: widget.title }} />;
      case "simple-calendar":
        return <SimpleCalendarWidget widget={widget} />;
      case "programs":
        return <ProgramsWidget programs={[]} widget={widget} />;

      default:
        return <div className="bg-gray-100 p-4 rounded">알 수 없는 위젯</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">레이아웃 관리</h2>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <label className="text-sm font-medium">레이아웃 구성</label>
            <Select
              value={layoutConfig}
              onValueChange={(value) => setLayoutConfig(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="레이아웃 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main-only">메인만</SelectItem>
                <SelectItem value="left-main">좌측 + 메인</SelectItem>
                <SelectItem value="main-right">메인 + 우측</SelectItem>
                <SelectItem value="full">좌측 + 메인 + 우측</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium">화면 크기</label>
            <Select
              value={screenSize}
              onValueChange={(value) => setScreenSize(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="화면 크기 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">기본 (max-w-none)</SelectItem>
                <SelectItem value="screen-2xl">max-w-screen-2xl</SelectItem>
                <SelectItem value="screen-xl">max-w-screen-xl</SelectItem>
                <SelectItem value="screen-lg">max-w-screen-lg</SelectItem>
                <SelectItem value="7xl">max-w-7xl</SelectItem>
                <SelectItem value="6xl">max-w-6xl</SelectItem>
                <SelectItem value="5xl">max-w-5xl</SelectItem>
                <SelectItem value="4xl">max-w-4xl</SelectItem>
                <SelectItem value="full">max-w-full</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium">배경색</label>
            <Select
              value={pageBackgroundColor}
              onValueChange={(value) => setPageBackgroundColor(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="배경색 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본 (#f1f5f9b3)</SelectItem>
                <SelectItem value="white">화이트</SelectItem>
                <SelectItem value="light-blue">연한 파랑</SelectItem>
                <SelectItem value="light-green">연한 초록</SelectItem>
                <SelectItem value="light-yellow">연한 노랑</SelectItem>
                <SelectItem value="light-pink">연한 핑크</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium">편집할 페이지</label>
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
                {pages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <WidgetSettings
        editingWidget={editingWidget}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        setEditingWidget={setEditingWidget}
        onSave={async (widget: IWidget) => { 
          await updateWidgetInDatabase([widget]); 
          
          // 전체 데이터를 다시 불러오는 대신 현재 상태만 업데이트
          const newAllWidgets = allWidgets.map(w => 
            w.id === widget.id ? widget : w
          );
          setAllWidgets(newAllWidgets);
          
          // layoutAreas도 업데이트 (루트 레벨 위젯인 경우에만)
          if (!widget.parent_id) {
            const newLayoutAreas = layoutAreas.map(area => ({
              ...area,
              widgets: area.widgets.map(w => 
                w.id === widget.id ? widget : w
              )
            }));
            setLayoutAreas(newLayoutAreas);
          }
        }}
        menuItems={menuItems}
        pages={pages}
        roles={availableRoles}
        programs={programs}
      />

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
                  {WIDGET_TYPES.map((widgetType) => (
                    <Button
                      key={widgetType.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        addNewWidget(widgetType.id, addingWidgetToArea, {
                          title: widgetType.name,
                        });
                        setAddingWidgetToArea(null);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {widgetType.name} 추가
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
          <div
            className={`lg:container mx-auto lg:px-6 py-0 lg:py-6 ${getBackgroundClass(pageBackgroundColor)}`}
          >
            <div
              className={`grid gap-6 grid-cols-12 w-full ${getScreenSizeClass(screenSize)} mx-auto`}
            >
            {layoutAreas.filter((area) => {
              if (layoutConfig === "main-only") return area.id === "main";
              if (layoutConfig === "left-main") return area.id === "left" || area.id === "main";
              if (layoutConfig === "main-right") return area.id === "main" || area.id === "right";
              return true;
            }).map((area) => {
              let colSpanClass = "col-span-12";
              if (layoutConfig === "left-main") {
                colSpanClass = area.id === "main" ? "col-span-9" : "col-span-3";
              } else if (layoutConfig === "main-right") {
                colSpanClass = area.id === "main" ? "col-span-9" : "col-span-3";
              } else if (layoutConfig === "full") {
                colSpanClass = area.id === "main" ? "col-span-8" : "col-span-2";
              }

              return (
                <div key={area.id} className={colSpanClass}>
                  <div key={area.id} className="">
                    <div className="py-2 px-2 font-semibold">
                      <div className="flex justify-between items-center">
                        <h3 className="text-base">{area.name}</h3>
                      </div>
                    </div>
                    <div className="">
                      <DroppableArea area={area}>
                        {area.widgets.length === 0 ? (
                          <div className="text-center text-gray-500 py-8">
                            이 영역에 위젯을 추가하세요
                          </div>
                        ) : (
                          <SortableContext
                            items={area.widgets.map((w) => w.id.toString())}
                            strategy={verticalListSortingStrategy}
                          >
                            <div
                              className={`${
                                area.id === "main"
                                  ? "grid grid-cols-12 gap-4"
                                  : "space-y-4"
                              }`}
                            >
                              {area.widgets.map((widget) => (
                                <SortableItem
                                  key={widget.id}
                                  widget={widget}
                                  renderWidget={renderWidgetPreview}
                                  setEditingWidget={setEditingWidget}
                                  setDialogOpen={setDialogOpen}
                                  deleteWidget={deleteWidget}
                                  setAddingWidgetToArea={setAddingWidgetToArea}
                                  isMainArea={area.id === "main"}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}
                      </DroppableArea>
                      <div className="mt-4 flex justify-center gap-2 relative">
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => addNewContainer(area.id)}
                          id={`add-container-btn-${area.id}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          컨테이너 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="opacity-95 shadow-xl">
              {(() => {
                const draggedWidget = allWidgets.find(w => w.id.toString() === activeId);
                if (draggedWidget) {
                  return renderWidgetPreview(draggedWidget);
                }
                return null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
