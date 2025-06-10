"use client";

import { useState, useEffect } from "react";
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

import { MediaWidget } from "../widgets/media-widget";
import { BoardWidget, BOARD_TEMPLATE } from "../widgets/board-widget";
import { supabase } from "@/db";
import { toast } from "@/components/ui/toaster";
import { Plus, Trash2, MoveVertical, Settings, Eye } from "lucide-react";

// 위젯 타입 정의
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
    media_title?: string; // 미디어 섹션 제목
    media_subtitle?: string; // 미디어 섹션 부제목
    media_more_text?: string; // 더 많은 미디어 보기 텍스트
    page_id?: string; // 미디어 콘텐츠를 가져올 페이지 ID
  };
  is_active: boolean;
};

// 레이아웃 영역 타입 정의
type LayoutArea = {
  id: string;
  name: string;
  widgets: Widget[];
};

// 사용 가능한 위젯 타입
const WIDGET_TYPES = [
  { id: "banner", name: "배너" },
  { id: "board", name: "게시판" },
  { id: "gallery", name: "갤러리" },
  { id: "media", name: "미디어" },
];

export default function LayoutManager(): React.ReactNode {
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [layoutAreas, setLayoutAreas] = useState<LayoutArea[]>([
    { id: "main", name: "메인 영역1", widgets: [] },
  ]);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [boardPosts, setBoardPosts] = useState<{ [key: string]: any[] }>({});

  // 컴포넌트 마운트 시 레이아웃 데이터 및 메뉴 항목 로드
  useEffect(() => {
    fetchLayoutData();
    fetchMenuItems();
    fetchBanners();
    fetchPages();
  }, []);

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
  const fetchLayoutData = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_layout")
        .select("*")
        .order("order", { ascending: true });

      if (error) throw error;

      // 레이아웃 영역별로 위젯 그룹화
      const groupedWidgets: { [key: string]: Widget[] } = {};

      data?.forEach((widget: Widget) => {
        const areaId = "main"; // 현재는 메인 영역만 사용
        if (!groupedWidgets[areaId]) {
          groupedWidgets[areaId] = [];
        }
        groupedWidgets[areaId].push(widget);
      });

      // 레이아웃 영역 설정
      const areas: LayoutArea[] = [
        {
          id: "main",
          name: "",
          widgets: groupedWidgets["main"] || [],
        },
      ];

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

    // 레이아웃 영역 복사
    const newLayoutAreas = [...layoutAreas];

    // 소스 영역 찾기
    const sourceAreaIndex = newLayoutAreas.findIndex(
      (area) => area.id === source.droppableId
    );

    // 대상 영역 찾기
    const destAreaIndex = newLayoutAreas.findIndex(
      (area) => area.id === destination.droppableId
    );

    // 같은 영역 내에서 순서 변경
    if (source.droppableId === destination.droppableId) {
      const widgets = [...newLayoutAreas[sourceAreaIndex].widgets];
      const [movedWidget] = widgets.splice(source.index, 1);
      widgets.splice(destination.index, 0, movedWidget);

      // 순서 업데이트
      const updatedWidgets = widgets.map((widget, index) => ({
        ...widget,
        order: index,
      }));

      newLayoutAreas[sourceAreaIndex].widgets = updatedWidgets;
      setLayoutAreas(newLayoutAreas);

      // DB 업데이트
      try {
        setIsLoading(true);

        // 변경된 위젯들의 순서 업데이트
        for (const widget of updatedWidgets) {
          console.log(`Updating widget ${widget.id} order to ${widget.order}`);
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
        console.error("위젯 순서 업데이트 중 오류가 발생했습니다:", error);
        toast({
          title: "오류",
          description: "위젯 순서 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // 다른 영역으로 이동
      const sourceWidgets = [...newLayoutAreas[sourceAreaIndex].widgets];
      const destWidgets = [...newLayoutAreas[destAreaIndex].widgets];

      // 소스에서 위젯 제거
      const [movedWidget] = sourceWidgets.splice(source.index, 1);

      // 대상 영역의 column 값으로 업데이트
      const updatedWidget = {
        ...movedWidget,
        column_position: parseInt(destination.droppableId.split("-")[1] || "0"),
      };

      // 대상에 위젯 추가
      destWidgets.splice(destination.index, 0, updatedWidget);

      // 소스 영역 위젯 순서 업데이트
      newLayoutAreas[sourceAreaIndex].widgets = sourceWidgets.map(
        (widget, index) => ({
          ...widget,
          order: index,
        })
      );

      // 대상 영역 위젯 순서 업데이트
      newLayoutAreas[destAreaIndex].widgets = destWidgets.map(
        (widget, index) => ({
          ...widget,
          order: index,
        })
      );

      setLayoutAreas(newLayoutAreas);

      // DB 업데이트
      try {
        setIsLoading(true);

        // 이동된 위젯 업데이트
        await supabase
          .from("cms_layout")
          .update({
            column_position: updatedWidget.column_position,
            order: destWidgets.findIndex((w) => w.id === updatedWidget.id),
          })
          .eq("id", updatedWidget.id);

        // 소스 영역 위젯 순서 업데이트
        for (const widget of newLayoutAreas[sourceAreaIndex].widgets) {
          await supabase
            .from("cms_layout")
            .update({ order: widget.order })
            .eq("id", widget.id);
        }

        // 대상 영역 위젯 순서 업데이트
        for (const widget of newLayoutAreas[destAreaIndex].widgets) {
          await supabase
            .from("cms_layout")
            .update({ order: widget.order })
            .eq("id", widget.id);
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
  const addNewWidget = async (type: string, sourceItem?: any) => {
    try {
      setIsLoading(true);

      // 기본 위젯 설정
      const newWidget: Omit<Widget, "id"> = {
        type,
        title:
          sourceItem?.title ||
          WIDGET_TYPES.find((w) => w.id === type)?.name ||
          "새 위젯",
        content: sourceItem?.content || "",
        column_position: 0,
        order: layoutAreas[0].widgets.length,
        width: 12,
        is_active: true,
        settings: {
          source_id: sourceItem?.id || null,
          source_type: type,
          url: sourceItem?.url || null,
        },
      };

      // DB에 위젯 추가
      const { data, error } = await supabase
        .from("cms_layout")
        .insert(newWidget)
        .select()
        .single();

      if (error) throw error;

      // 상태 업데이트
      const newLayoutAreas = [...layoutAreas];
      newLayoutAreas[0].widgets.push(data);
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
      await fetchLayoutData();

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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>위젯 설정: {editingWidget.title}</DialogTitle>
            <DialogDescription>
              위젯의 속성을 설정하고 저장 버튼을 클릭하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="widget-active"
                checked={editingWidget.is_active}
                onCheckedChange={(checked) =>
                  setEditingWidget({
                    ...editingWidget,
                    is_active: checked as boolean,
                  })
                }
              />
              <Label htmlFor="widget-active">활성화</Label>
            </div>
          </div>

          {/* 게시판 위젯 전용 설정 */}
          {editingWidget.type === "board" && (
            <div className="space-y-4 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium text-sm">게시판 설정</h4>

              <div className="space-y-2">
                <Label htmlFor="board-item-count">표시할 게시물 개수</Label>
                <Select
                  value={String(
                    editingWidget.display_options?.item_count || 10
                  )}
                  onValueChange={(value) =>
                    setEditingWidget({
                      ...editingWidget,
                      display_options: {
                        ...editingWidget.display_options,
                        item_count: parseInt(value, 10),
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

          {/* 미디어 위젯 전용 설정 */}
          {editingWidget.type === "media" && (
            <div className="space-y-4 border rounded-md p-3 bg-gray-50">
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
  const renderWidgetPreview = (widget: Widget) => {
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
          <BoardWidget
            widget={widget}
            page={pages.find((p) => p.id === widget.display_options?.page_id)}
          />
        ) : (
          <div className="bg-green-50 p-4 rounded">
            <div className="font-medium">{widget.title || "게시판"}</div>
            <div className="text-sm text-gray-500 mt-1">게시판 위젯</div>
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
          <MediaWidget
            widget={widget}
            page={pages.find((p) => p.id === widget.display_options?.page_id)}
          />
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

      default:
        return <div className="bg-gray-100 p-4 rounded">알 수 없는 위젯</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">홈페이지 레이아웃 관리</h2>
      </div>

      {/* <div className="bg-gray-100 p-4 mb-4 rounded-lg text-center text-sm text-gray-500">
        미리보기 모드: 위젯에 마우스를 올리면 편집 옵션이 표시됩니다. 드래그하여 위치를 변경할 수 있습니다.
          ? "미리보기 모드: 위젯에 마우스를 올리면 편집 옵션이 표시됩니다. 드래그하여 위치를 변경할 수 있습니다."
          : "기본 편집 모드: 위젯을 자유롭게 편집하고 배치할 수 있습니다."
      </div> */}

      {renderWidgetSettingsDialog()}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4">
          {layoutAreas.map((area) => (
            <Card
              key={area.id}
              className={previewMode ? "shadow-none border-0" : ""}
            >
              <CardHeader className={previewMode ? "" : ""}>
                <div className="flex justify-between items-center">
                  <CardTitle>{area.name}</CardTitle>
                  {previewMode}
                </div>
              </CardHeader>
              <CardContent className={previewMode ? "p-0" : ""}>
                <Droppable droppableId={area.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[100px] ${!previewMode ? "border border-dashed border-gray-300 rounded-md p-4" : ""}`}
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
                                draggableId={widget.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`${getWidthClass(widget.width)} ${
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
                          onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                          id={`add-widget-btn-${area.id}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          위젯 추가
                        </Button>

                        {showWidgetMenu && (
                          <div
                            className="fixed bg-black/30 inset-0 z-40"
                            onClick={() => setShowWidgetMenu(false)}
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
                                  <h4 className="text-sm font-medium">
                                    위젯 추가
                                  </h4>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setShowWidgetMenu(false)}
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
                                        addNewWidget("banner", {
                                          title: "배너",
                                        });
                                        setShowWidgetMenu(false);
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
                                        addNewWidget("board", {
                                          title: "게시판",
                                        });
                                        setShowWidgetMenu(false);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      게시판 추가
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start"
                                      onClick={() => {
                                        addNewWidget("gallery", {
                                          title: "갤러리",
                                        });
                                        setShowWidgetMenu(false);
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
                                        addNewWidget("media", {
                                          title: "미디어",
                                        });
                                        setShowWidgetMenu(false);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      미디어 추가
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
