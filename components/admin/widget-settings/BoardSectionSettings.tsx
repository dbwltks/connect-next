"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetSettingsComponentProps } from "./types";

export function BoardSectionSettings({ widget, onSave, pages = [] }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">게시판 (섹션) 설정</h4>
      <div className="space-y-2">
        <Label htmlFor="board-section-page">콘텐츠 페이지 선택</Label>
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
  );
}