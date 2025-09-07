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

export function PopularPostsSettings({ widget, onSave }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">인기 게시글 설정</h4>
      <div className="space-y-2">
        <Label htmlFor="pp-item-count">표시할 게시글 개수</Label>
        <Select
          value={String(widget.display_options?.item_count || 5)}
          onValueChange={(value) =>
            updateWidget({
              display_options: {
                ...widget.display_options,
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
          value={widget.display_options?.sort_by || "views"}
          onValueChange={(value: "views" | "likes" | "comments") =>
            updateWidget({
              display_options: {
                ...widget.display_options,
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