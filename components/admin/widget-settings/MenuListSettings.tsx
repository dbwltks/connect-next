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

export function MenuListSettings({ widget, onSave, menuItems = [] }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">메뉴 목록 설정</h4>
      <div className="space-y-2">
        <Label htmlFor="menu-list-parent">상위 메뉴 선택</Label>
        <Select
          value={widget.settings?.parent_menu_id || ""}
          onValueChange={(value) =>
            updateWidget({
              settings: {
                ...widget.settings,
                parent_menu_id: value,
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="표시할 메뉴 그룹을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {menuItems
              .filter((item) => !item.parent_id) // 최상위 메뉴만 필터링
              .map((menu: any) => (
                <SelectItem key={menu.id} value={menu.id}>
                  {menu.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          선택한 메뉴의 하위 메뉴들이 목록으로 표시됩니다.
        </p>
      </div>
    </div>
  );
}