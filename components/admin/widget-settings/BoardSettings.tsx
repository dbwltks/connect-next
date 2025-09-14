"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BOARD_TEMPLATE } from "@/components/widgets/boardlist-widget";
import { WidgetSettingsComponentProps } from "./types";

export function BoardSettings({ widget, onSave, pages = [], setEditingWidget }: WidgetSettingsComponentProps & { setEditingWidget?: (widget: any) => void }) {
  const updateWidget = (updates: any) => {
    if (setEditingWidget) {
      setEditingWidget({
        ...widget,
        ...updates,
      });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">게시판 (목록) 설정</h4>
      
      <div className="space-y-2">
        <Label htmlFor="board-title">위젯 제목</Label>
        <Input
          id="board-title"
          value={widget.title || ""}
          placeholder="게시판"
          onChange={(e) =>
            updateWidget({
              title: e.target.value,
            })
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="board-item-count">표시할 게시물 개수</Label>
        <Input
          id="board-item-count"
          type="number"
          min={1}
          max={10}
          step={1}
          value={widget.display_options?.item_count || 10}
          onChange={(e) => {
            let value = parseInt(e.target.value, 10);
            if (isNaN(value) || value < 1) value = 1;
            if (value > 10) value = 10;
            updateWidget({
              display_options: {
                ...widget.display_options,
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
          value={widget.display_options?.page_id || ""}
          onValueChange={(value) =>
            updateWidget({
              display_options: {
                ...widget.display_options,
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
            widget.display_options?.layout_type ||
              BOARD_TEMPLATE.CLASSIC
          )}
          onValueChange={(value) => {
            // 문자열을 숫자로 변환
            const numericValue = parseInt(value, 10);

            updateWidget({
              display_options: {
                ...widget.display_options,
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
              widget.display_options?.show_thumbnail ?? true
            }
            onCheckedChange={(checked) => {
              updateWidget({
                display_options: {
                  ...widget.display_options,
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
            checked={widget.display_options?.show_date ?? true}
            onCheckedChange={(checked) => {
              updateWidget({
                display_options: {
                  ...widget.display_options,
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
              widget.display_options?.show_excerpt ?? true
            }
            onCheckedChange={(checked) => {
              updateWidget({
                display_options: {
                  ...widget.display_options,
                  show_excerpt: checked === true,
                },
              });
            }}
          />
          <Label htmlFor="show-excerpt-board">요약 표시</Label>
        </div>
      </div>
    </div>
  );
}