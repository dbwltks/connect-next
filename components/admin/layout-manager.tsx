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

import { MediaWidget } from "../widgets/media-widget";
import { BoardlistWidget, BOARD_TEMPLATE } from "../widgets/boardlist-widget";
import { BoardWidget } from "../widgets/board-widget";
import LocationWidget from "../widgets/location-widget";
import MenuListWidget from "../widgets/menu-list-widget";
import { StripWidget } from "../widgets/strip-widget";
import { supabase } from "@/db";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, MoveVertical, Settings, Eye } from "lucide-react";
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
];

export default function LayoutManager(): React.ReactNode {
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
  const [boardPosts, setBoardPosts] = useState<{ [key: string]: any[] }>({});
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null); // null은 홈페이지
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stripUploading, setStripUploading] = useState(false);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMenuItems();
    fetchBanners();
    fetchPages();
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
    try {
      const { data, error } = await supabase.from("cms_pages").select("*");

      if (error) throw error;
      setPages(data || []);

      // 게시판 타입 페이지의 경우 최신글 데이터 가져오기 시도
      const boardPages =
        data?.filter((page) => page.page_type === "board") || [];
      if (boardPages.length > 0) {
        try {
          // 각 게시판 페이지에 대한 더미 게시물 데이터 생성 (실제로는 API 호출 필요)
          const boardPostsMap: Record<string, any[]> = {};

          boardPages.forEach((page) => {
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
      const allWidgets = data || [];

      allWidgets.forEach((w) => {
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

  // 위젯 설정 저장
  const saveWidgetSettings = async () => {
    if (!editingWidget) return;

    try {
      setIsLoading(true);

      // DB 업데이트
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
      const newLayoutAreas = layoutAreas.map((area) => ({
        ...area,
        widgets: area.widgets.map((widget) =>
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
        <DialogContent className="sm:max-w-[700px]">
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
                    {pages.map((page) => (
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
                    {pages.map((page) => (
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
                    {pages.map((page) => (
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
                        {pages.map((page) => (
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
                      .map((menu) => (
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
                    .map((post, index) => (
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
                  .map((_, index) => (
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
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-bold">{widget.title}</h3>
            </div>
            <ol className="p-4 space-y-2 list-decimal list-inside">
              <li className="text-sm truncate">가장 인기있는 게시글 제목</li>
              <li className="text-sm truncate">두 번째로 인기있는 글</li>
              <li className="text-sm truncate">세 번째 글입니다.</li>
            </ol>
          </div>
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
          {layoutAreas.map((area) => {
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
                                {area.widgets.map((widget, index) => (
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
                                          !widget.is_active ? "opacity-50" : ""
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
                                ))}
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
    </div>
  );
}
