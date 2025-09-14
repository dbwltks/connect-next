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
import { WidgetSettingsComponentProps } from "./types";

export function RecentCommentsSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
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
      <h4 className="font-medium text-sm">최근 댓글 설정</h4>
      
      <div className="space-y-2">
        <Label htmlFor="rc-title">위젯 제목</Label>
        <Input
          id="rc-title"
          value={currentWidget.title || ""}
          placeholder="최신 댓글"
          onChange={(e) =>
            updateWidget({
              title: e.target.value,
            })
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="rc-item-count">표시할 댓글 개수</Label>
        <Select
          value={String(currentWidget.display_options?.item_count || 5)}
          onValueChange={(value) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
  );
}