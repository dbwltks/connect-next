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

export function PopularPostsSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
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
      <h4 className="font-medium text-sm">인기 게시글 설정</h4>
      
      <div className="space-y-2">
        <Label htmlFor="pp-title">위젯 제목</Label>
        <Input
          id="pp-title"
          value={currentWidget.title || ""}
          placeholder="인기 게시글"
          onChange={(e) =>
            updateWidget({
              title: e.target.value,
            })
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="pp-item-count">표시할 게시글 개수</Label>
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
      <div className="space-y-2">
        <Label htmlFor="pp-sort-by">정렬 기준</Label>
        <Select
          value={currentWidget.display_options?.sort_by || "views"}
          onValueChange={(value: "views" | "likes" | "comments") =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
  );
}