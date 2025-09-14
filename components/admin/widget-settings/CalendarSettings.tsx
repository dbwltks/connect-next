"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetSettingsComponentProps } from "./types";

export function CalendarSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
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
      <h4 className="font-medium text-sm">캘린더 설정</h4>
      
      <div className="space-y-2">
        <Label htmlFor="calendar-title">위젯 제목</Label>
        <Input
          id="calendar-title"
          value={currentWidget.settings?.title || ""}
          placeholder="일정관리"
          onChange={(e) =>
            updateWidget({
              settings: {
                ...currentWidget.settings,
                title: e.target.value,
              },
            })
          }
        />
      </div>
    </div>
  );
}