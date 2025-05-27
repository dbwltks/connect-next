"use client";

import { useState, useEffect, useRef } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  MoveVertical,
  Settings,
  Eye,
  Grid3X3,
} from "lucide-react";
import RGL, { WidthProvider, Layout } from "react-grid-layout";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  FileText,
  ImageIcon,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  Move,
} from "lucide-react";
const ReactGridLayout = WidthProvider(RGL);

// 위젯 타입 상수 정의
const WIDGET_TYPES = [
  { id: "menu", name: "메뉴 항목", icon: "Menu" },
  { id: "page", name: "페이지", icon: "FileText" },
  { id: "banner", name: "배너", icon: "Image" },
] as const;

// 위젯 타입 유니온 타입 정의
type WidgetType = (typeof WIDGET_TYPES)[number]["id"];

// Widget 타입 업데이트
export type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  content?: string;
  settings?: any;
  column_position: number;
  order: number;
  width: number;
  height?: number;
  display_options?: {
    item_count?: number;
    show_thumbnail?: boolean;
    show_date?: boolean;
    show_excerpt?: boolean;
    layout_type?: "list" | "grid" | "card";
  };
  is_active: boolean;
};

// 레이아웃 영역 타입 정의
type LayoutArea = {
  id: string;
  name: string;
  widgets: Widget[];
};

// MainDashboard 전용 타입
interface DashboardWidget {
  id: string;
  type: "chart" | "text" | "image" | "clock" | "stats" | "calendar" | "notes";
  title: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  config: {
    padding?: number;
    margin?: number;
    backgroundImage?: string;
    overlayOpacity?: number;
    [key: string]: any;
  };
}

// 사용자 제공 메인 영역 대시보드 컴포넌트 정의
function MainDashboard() {
  const GRID_CELL_SIZE = 100;
  const GRID_COLS = 10;
  const GRID_ROWS = 10;
  const MIN_GRID_WIDTH = 1;
  const MIN_GRID_HEIGHT = 1;
  const MAX_GRID_WIDTH = 10;
  const MAX_GRID_HEIGHT = 4;

  const widgetTypes = [
    {
      value: "chart",
      label: "차트",
      icon: BarChart3,
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      value: "text",
      label: "텍스트",
      icon: FileText,
      defaultWidth: 2,
      defaultHeight: 2,
    },
    {
      value: "image",
      label: "이미지",
      icon: ImageIcon,
      defaultWidth: 2,
      defaultHeight: 2,
    },
    {
      value: "clock",
      label: "시계",
      icon: Clock,
      defaultWidth: 2,
      defaultHeight: 1,
    },
    {
      value: "stats",
      label: "통계",
      icon: TrendingUp,
      defaultWidth: 2,
      defaultHeight: 2,
    },
    {
      value: "calendar",
      label: "캘린더",
      icon: Calendar,
      defaultWidth: 3,
      defaultHeight: 3,
    },
    {
      value: "notes",
      label: "메모",
      icon: MessageSquare,
      defaultWidth: 2,
      defaultHeight: 2,
    },
  ];

  // 위젯 렌더러들
  const ChartWidget = ({ config }: { config: any }) => (
    <div className="h-full flex items-center justify-center p-4">
      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-end justify-around p-4">
        {[40, 70, 30, 90, 60].map((height, i) => (
          <div
            key={i}
            className="bg-white/80 rounded-t"
            style={{ height: `${height}%`, width: "12%" }}
          />
        ))}
      </div>
    </div>
  );
  const TextWidget = ({ config }: { config: any }) => (
    <div className="h-full p-4 overflow-auto">
      <h3 className="font-semibold mb-2">{config.heading || "제목"}</h3>
      <p className="text-sm text-muted-foreground">
        {config.content || "여기에 텍스트 내용이 표시됩니다."}
      </p>
    </div>
  );
  const ImageWidget = ({ config }: { config: any }) => (
    <div className="h-full flex items-center justify-center bg-muted rounded p-4">
      {config.imageUrl ? (
        <img
          src={config.imageUrl || "/placeholder.svg"}
          alt="Widget"
          className="max-w-full max-h-full object-contain rounded"
        />
      ) : (
        <div className="text-center text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">이미지 없음</p>
        </div>
      )}
    </div>
  );
  const ClockWidget = ({ config }: { config: any }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-xl font-mono font-bold">
          {time.toLocaleTimeString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {time.toLocaleDateString()}
        </div>
      </div>
    );
  };
  const StatsWidget = ({ config }: { config: any }) => (
    <div className="h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <Users className="w-6 h-6 text-blue-500" />
        <Badge variant="secondary">+12%</Badge>
      </div>
      <div className="text-xl font-bold">{config.value || "1,234"}</div>
      <div className="text-xs text-muted-foreground">
        {config.label || "총 사용자"}
      </div>
    </div>
  );
  const CalendarWidget = ({ config }: { config: any }) => (
    <div className="h-full p-4">
      <div className="text-sm font-semibold mb-2">2024년 1월</div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} className="text-center font-semibold p-1">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="text-center p-1 hover:bg-muted rounded">
            {i > 6 && i < 32 ? i - 6 : ""}
          </div>
        ))}
      </div>
    </div>
  );
  const NotesWidget = ({ config }: { config: any }) => (
    <div className="h-full p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <span className="text-xs">회의 준비하기</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-xs">프로젝트 리뷰</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-xs">문서 작성</span>
        </div>
      </div>
    </div>
  );
  const WidgetRenderer = ({ widget }: { widget: DashboardWidget }) => {
    const style: React.CSSProperties = {
      padding:
        widget.config.padding !== undefined ? widget.config.padding : undefined,
      margin:
        widget.config.margin !== undefined ? widget.config.margin : undefined,
      backgroundImage: widget.config.backgroundImage
        ? `url(${widget.config.backgroundImage})`
        : undefined,
      backgroundSize: widget.config.backgroundImage ? "cover" : undefined,
      backgroundPosition: widget.config.backgroundImage ? "center" : undefined,
      position: "relative",
    };
    return (
      <div style={style} className="w-full h-full relative">
        {widget.config.backgroundImage &&
          widget.config.overlayOpacity !== undefined && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000",
                opacity: widget.config.overlayOpacity,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          )}
        <div
          style={
            widget.config.backgroundImage
              ? { position: "relative", zIndex: 2 }
              : {}
          }
          className="w-full h-full"
        >
          {/* 기존 위젯 렌더링 */}
          {(() => {
            switch (widget.type) {
              case "chart":
                return <ChartWidget config={widget.config} />;
              case "text":
                return <TextWidget config={widget.config} />;
              case "image":
                return <ImageWidget config={widget.config} />;
              case "clock":
                return <ClockWidget config={widget.config} />;
              case "stats":
                return <StatsWidget config={widget.config} />;
              case "calendar":
                return <CalendarWidget config={widget.config} />;
              case "notes":
                return <NotesWidget config={widget.config} />;
              default:
                return <div>Unknown widget type</div>;
            }
          })()}
        </div>
      </div>
    );
  };

  // 상태 및 핸들러
  const [widgetsState, setWidgets] = React.useState<DashboardWidget[]>([
    {
      id: "1",
      type: "chart",
      title: "매출 차트",
      gridX: 0,
      gridY: 0,
      gridWidth: 3,
      gridHeight: 2,
      config: {},
    },
    {
      id: "2",
      type: "clock",
      title: "현재 시간",
      gridX: 3,
      gridY: 0,
      gridWidth: 2,
      gridHeight: 1,
      config: {},
    },
    {
      id: "3",
      type: "stats",
      title: "사용자 통계",
      gridX: 0,
      gridY: 2,
      gridWidth: 2,
      gridHeight: 2,
      config: { value: "2,456", label: "활성 사용자" },
    },
    {
      id: "4",
      type: "calendar",
      title: "캘린더",
      gridX: 5,
      gridY: 0,
      gridWidth: 3,
      gridHeight: 3,
      config: {},
    },
  ]);
  const [draggedWidget, setDraggedWidget] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = React.useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = React.useState<{
    gridX: number;
    gridY: number;
    valid: boolean;
  } | null>(null);
  const [selectedWidget, setSelectedWidget] =
    React.useState<DashboardWidget | null>(null);
  const [showGrid, setShowGrid] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const lastMousePosition = React.useRef({ x: 0, y: 0 });

  // 유틸 함수들
  const getGridPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { gridX: 0, gridY: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gridX = Math.floor(x / GRID_CELL_SIZE);
    const gridY = Math.floor(y / GRID_CELL_SIZE);
    return {
      gridX: Math.max(0, Math.min(gridX, GRID_COLS - 1)),
      gridY: Math.max(0, Math.min(gridY, GRID_ROWS - 1)),
    };
  };
  const isPositionOccupied = (
    gridX: number,
    gridY: number,
    gridWidth: number,
    gridHeight: number,
    excludeId?: string
  ) => {
    return widgetsState.some((widget) => {
      if (excludeId && widget.id === excludeId) return false;
      return !(
        gridX >= widget.gridX + widget.gridWidth ||
        gridX + gridWidth <= widget.gridX ||
        gridY >= widget.gridY + widget.gridHeight ||
        gridY + gridHeight <= widget.gridY
      );
    });
  };
  const findValidPosition = (
    gridWidth: number,
    gridHeight: number,
    excludeId?: string
  ) => {
    for (let y = 0; y <= GRID_ROWS - gridHeight; y++) {
      for (let x = 0; x <= GRID_COLS - gridWidth; x++) {
        if (!isPositionOccupied(x, y, gridWidth, gridHeight, excludeId)) {
          return { gridX: x, gridY: y };
        }
      }
    }
    return { gridX: 0, gridY: 0 };
  };

  // 드래그 핸들러
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const widget = widgetsState.find((w) => w.id === widgetId);
      if (!widget) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      const widgetX = widget.gridX * GRID_CELL_SIZE;
      const widgetY = widget.gridY * GRID_CELL_SIZE;
      setDragOffset({ x: mouseX - widgetX, y: mouseY - widgetY });
      setDragPosition({ x: widgetX, y: widgetY });
      setDraggedWidget(widgetId);
      setDragPreview(null);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    },
    [widgetsState]
  );
  const updatePreview = React.useCallback(
    (currentX: number, currentY: number, widget: DashboardWidget) => {
      const snappedGridX = Math.round(currentX / GRID_CELL_SIZE);
      const snappedGridY = Math.round(currentY / GRID_CELL_SIZE);
      const clampedGridX = Math.max(
        0,
        Math.min(snappedGridX, GRID_COLS - widget.gridWidth)
      );
      const clampedGridY = Math.max(
        0,
        Math.min(snappedGridY, GRID_ROWS - widget.gridHeight)
      );
      const isValid = !isPositionOccupied(
        clampedGridX,
        clampedGridY,
        widget.gridWidth,
        widget.gridHeight,
        draggedWidget ?? undefined
      );
      setDragPreview({
        gridX: clampedGridX,
        gridY: clampedGridY,
        valid: isValid,
      });
    },
    [draggedWidget, widgetsState]
  );
  const updateDragPosition = React.useCallback(() => {
    if (!draggedWidget || !containerRef.current) return;
    const widget = widgetsState.find((w) => w.id === draggedWidget);
    if (!widget) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = lastMousePosition.current.x - containerRect.left;
    const mouseY = lastMousePosition.current.y - containerRect.top;
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;
    setDragPosition({ x: newX, y: newY });
    updatePreview(newX, newY, widget);
  }, [draggedWidget, dragOffset, widgetsState, updatePreview]);
  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!draggedWidget) return;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateDragPosition);
    },
    [draggedWidget, updateDragPosition]
  );
  const handleMouseUp = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (draggedWidget && dragPreview && dragPreview.valid) {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === draggedWidget
            ? { ...w, gridX: dragPreview.gridX, gridY: dragPreview.gridY }
            : w
        )
      );
    }
    setDraggedWidget(null);
    setDragOffset({ x: 0, y: 0 });
    setDragPosition({ x: 0, y: 0 });
    setDragPreview(null);
  }, [draggedWidget, dragPreview]);
  React.useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  // 위젯 추가/삭제/수정
  const addWidget = (type: DashboardWidget["type"]) => {
    const widgetType = widgetTypes.find((t) => t.value === type);
    if (!widgetType) return;
    const { gridX, gridY } = findValidPosition(
      widgetType.defaultWidth,
      widgetType.defaultHeight
    );
    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      type,
      title: `새 ${widgetType.label}`,
      gridX,
      gridY,
      gridWidth: widgetType.defaultWidth,
      gridHeight: widgetType.defaultHeight,
      config: {},
    };
    setWidgets((prev) => [...prev, newWidget]);
  };
  const deleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSelectedWidget(null);
  };
  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, ...updates };
          if (
            updates.gridWidth !== undefined ||
            updates.gridHeight !== undefined
          ) {
            const maxX = GRID_COLS - updated.gridWidth;
            const maxY = GRID_ROWS - updated.gridHeight;
            updated.gridX = Math.min(updated.gridX, maxX);
            updated.gridY = Math.min(updated.gridY, maxY);
            if (
              isPositionOccupied(
                updated.gridX,
                updated.gridY,
                updated.gridWidth,
                updated.gridHeight,
                id
              )
            ) {
              const validPos = findValidPosition(
                updated.gridWidth,
                updated.gridHeight,
                id
              );
              updated.gridX = validPos.gridX;
              updated.gridY = validPos.gridY;
            }
          }
          return updated;
        }
        return w;
      })
    );
    if (selectedWidget?.id === id) {
      setSelectedWidget((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 툴바 */}
      <div className="p-4 flex items-center gap-4">
        <h1 className="text-xl font-semibold">위젯 대시보드</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              위젯 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 위젯 추가</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {widgetTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() =>
                      addWidget(type.value as DashboardWidget["type"])
                    }
                  >
                    <Icon className="w-6 h-6" />
                    <div className="text-center">
                      <div>{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.defaultWidth}×{type.defaultHeight}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid3X3 className="w-4 h-4 mr-2" />
          그리드 {showGrid ? "숨기기" : "보기"}
        </Button>

        {selectedWidget && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                위젯 설정
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>위젯 설정</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="border-b pb-4 mb-4">
                  <h4 className="font-semibold text-sm mb-2">공통 설정</h4>
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={selectedWidget.title}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gridWidth">가로 크기 (칸)</Label>
                      <Select
                        value={selectedWidget.gridWidth.toString()}
                        onValueChange={(value) =>
                          updateWidget(selectedWidget.id, {
                            gridWidth: Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: MAX_GRID_WIDTH },
                            (_, i) => i + MIN_GRID_WIDTH
                          ).map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}칸
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="gridHeight">세로 크기 (칸)</Label>
                      <Select
                        value={selectedWidget.gridHeight.toString()}
                        onValueChange={(value) =>
                          updateWidget(selectedWidget.id, {
                            gridHeight: Number.parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: MAX_GRID_HEIGHT },
                            (_, i) => i + MIN_GRID_HEIGHT
                          ).map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}칸
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="padding">패딩(px)</Label>
                    <Input
                      id="padding"
                      type="number"
                      value={selectedWidget.config.padding ?? ""}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          config: {
                            ...selectedWidget.config,
                            padding: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin">마진(px)</Label>
                    <Input
                      id="margin"
                      type="number"
                      value={selectedWidget.config.margin ?? ""}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          config: {
                            ...selectedWidget.config,
                            margin: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundImage">배경 이미지 URL</Label>
                    <Input
                      id="backgroundImage"
                      value={selectedWidget.config.backgroundImage || ""}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          config: {
                            ...selectedWidget.config,
                            backgroundImage: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="overlayOpacity">
                      배경 이미지 투명도 (0~1)
                    </Label>
                    <Input
                      id="overlayOpacity"
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={selectedWidget.config.overlayOpacity ?? ""}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          config: {
                            ...selectedWidget.config,
                            overlayOpacity: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {selectedWidget.type === "text" && (
                  <>
                    <div>
                      <Label htmlFor="heading">제목</Label>
                      <Input
                        id="heading"
                        value={selectedWidget.config.heading || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              heading: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">내용</Label>
                      <Textarea
                        id="content"
                        value={selectedWidget.config.content || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              content: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </>
                )}

                {selectedWidget.type === "image" && (
                  <div>
                    <Label htmlFor="imageUrl">이미지 URL</Label>
                    <Input
                      id="imageUrl"
                      value={selectedWidget.config.imageUrl || ""}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, {
                          config: {
                            ...selectedWidget.config,
                            imageUrl: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {selectedWidget.type === "stats" && (
                  <>
                    <div>
                      <Label htmlFor="value">값</Label>
                      <Input
                        id="value"
                        value={selectedWidget.config.value || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              value: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="label">라벨</Label>
                      <Input
                        id="label"
                        value={selectedWidget.config.label || ""}
                        onChange={(e) =>
                          updateWidget(selectedWidget.id, {
                            config: {
                              ...selectedWidget.config,
                              label: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {selectedWidget && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteWidget(selectedWidget.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        )}
      </div>

      {/* 위젯 캔버스 */}
      <div
        ref={containerRef}
        className="mx-auto flex-1 relative overflow-auto bg-muted/20"
        style={{
          backgroundImage: showGrid
            ? `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `
            : "none",
          backgroundSize: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px`,
          width: GRID_COLS * GRID_CELL_SIZE,
          height: GRID_ROWS * GRID_CELL_SIZE,
        }}
      >
        {/* 드래그 미리보기 */}
        {dragPreview && draggedWidget && (
          <div
            className={`absolute border-2 border-dashed rounded-lg ${
              dragPreview.valid
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10"
            }`}
            style={{
              left: dragPreview.gridX * GRID_CELL_SIZE,
              top: dragPreview.gridY * GRID_CELL_SIZE,
              width:
                widgetsState.find((w) => w.id === draggedWidget)!.gridWidth *
                  GRID_CELL_SIZE -
                4,
              height:
                widgetsState.find((w) => w.id === draggedWidget)!.gridHeight *
                  GRID_CELL_SIZE -
                4,
              pointerEvents: "none",
              zIndex: 30,
            }}
          />
        )}

        {widgetsState.map((widget) => (
          <Card
            key={widget.id}
            className={`absolute cursor-move border-2 ${
              selectedWidget?.id === widget.id
                ? "border-blue-500 shadow-lg"
                : "border-border hover:border-blue-300"
            } ${draggedWidget === widget.id ? "opacity-90 z-50 shadow-2xl" : ""}`}
            style={{
              left:
                draggedWidget === widget.id
                  ? dragPosition.x
                  : widget.gridX * GRID_CELL_SIZE,
              top:
                draggedWidget === widget.id
                  ? dragPosition.y
                  : widget.gridY * GRID_CELL_SIZE,
              width: widget.gridWidth * GRID_CELL_SIZE - 4,
              height: widget.gridHeight * GRID_CELL_SIZE - 4,
              transform: draggedWidget === widget.id ? "none" : undefined, // 드래그 중이 아닐 때만 transform 사용
              willChange: draggedWidget === widget.id ? "transform" : "auto", // GPU 가속 최적화
            }}
            onClick={() => setSelectedWidget(widget)}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(e, widget.id);
            }}
          >
            <CardHeader className="p-3 pb-2 select-none">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="truncate">{widget.title}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {widget.gridWidth}×{widget.gridHeight}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 h-[calc(100%-60px)]">
              <WidgetRenderer widget={widget} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MainDashboard;
