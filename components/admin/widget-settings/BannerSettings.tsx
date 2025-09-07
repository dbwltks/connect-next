"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IWidget } from "@/types";

interface BannerSettingsProps {
  widget: IWidget;
  onSave: (widget: IWidget) => Promise<void>;
  menuItems?: any[];
}

export function BannerSettings({
  widget,
  onSave,
  menuItems = [],
}: BannerSettingsProps) {
  const [title, setTitle] = useState(widget.title || "배너");
  const [selectedMenuId, setSelectedMenuId] = useState(() => {
    const currentMenuId = widget.settings?.menu_id;
    console.log("🔧 Banner Settings Initial Value:", { 
      currentMenuId, 
      widgetSettings: widget.settings,
      menuItems: menuItems.length,
      widget: widget.id 
    });
    
    if (currentMenuId === null || currentMenuId === undefined) {
      return "auto";
    }
    return currentMenuId;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedWidget: IWidget = {
        ...widget,
        title,
        settings: {
          ...widget.settings,
          menu_id: selectedMenuId === "auto" ? null : selectedMenuId,
        },
      };
      
      console.log("💾 Banner Settings Save:", {
        selectedMenuId,
        finalMenuId: selectedMenuId === "auto" ? null : selectedMenuId,
        updatedWidget
      });
      
      await onSave(updatedWidget);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="banner-title">위젯 제목</Label>
        <Input
          id="banner-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="배너"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="menu-select">표시할 페이지/메뉴 선택</Label>
        <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
          <SelectTrigger>
            <SelectValue placeholder="배너 표시 방식을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">자동 선택 (현재 페이지에 맞는 배너)</SelectItem>
            <SelectItem value="global">전체 사이트 배너</SelectItem>
            {menuItems.map((menu) => (
              <SelectItem key={menu.id} value={menu.id}>
                {menu.name} ({menu.url})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          • <strong>자동 선택:</strong> 전체 사이트 공통 배너를 표시합니다 (배너 매니저의 "전체 사이트" 배너).<br/>
          • <strong>전체 사이트 배너:</strong> 위와 동일하게 공통 배너를 표시합니다.<br/>
          • <strong>특정 페이지:</strong> 배너 매니저에서 해당 메뉴에 설정된 배너만 표시합니다.
        </p>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "저장 중..." : "저장"}
      </Button>
    </div>
  );
}