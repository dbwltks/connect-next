"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetSettingsComponentProps } from "./types";

export function MediaSettings({ widget, onSave, pages = [], editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
  // Use parent's editingWidget state if provided, otherwise use local state
  const currentWidget = editingWidget || widget;
  const setWidget = setEditingWidget || (() => {});

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
      <h4 className="font-medium text-sm">미디어 설정</h4>

      <div className="space-y-2">
        <Label htmlFor="media-title">미디어 섹션 제목</Label>
        <Input
          id="media-title"
          value={currentWidget.display_options?.media_title || ""}
          placeholder="지금 미디어, 다양한 미디어 콘텐츠를 만나보세요"
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
          value={currentWidget.display_options?.media_subtitle || ""}
          placeholder="최신 영상, 오디오 콘텐츠를 한 곳에서 확인하세요"
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
          value={currentWidget.display_options?.media_more_text || ""}
          placeholder="더 많은 미디어 보기"
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
          value={currentWidget.display_options?.item_count || 12}
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
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
        <p className="text-xs text-gray-500 mt-1">
          선택한 페이지의 콘텐츠가 미디어 섹션에 표시됩니다.
        </p>
      </div>

    </div>
  );
}