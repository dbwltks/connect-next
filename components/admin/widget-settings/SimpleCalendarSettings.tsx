"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WidgetSettingsComponentProps } from "./types";

export function SimpleCalendarSettings({ widget, onSave, pages = [], editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
  const currentWidget = editingWidget || widget;
  
  const updateWidget = (updates: any) => {
    if (setEditingWidget) {
      setEditingWidget({
        ...currentWidget,
        ...updates,
      });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">간단 캘린더 설정</h4>
      <div className="space-y-2">
        <Label htmlFor="calendar-page">연결할 페이지 선택 (선택사항)</Label>
        <Select
          value={currentWidget.display_options?.page_id || ""}
          onValueChange={(value) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
          캘린더 이벤트를 클릭했을 때 이동할 페이지를 선택하세요
        </p>
      </div>
    </div>
  );
}