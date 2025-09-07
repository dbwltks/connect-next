"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IWidget } from "@/types";

interface ContainerSettingsProps {
  widget: IWidget;
  onSave: (widget: IWidget) => Promise<void>;
}

export default function ContainerSettings({
  widget,
  onSave,
}: ContainerSettingsProps) {
  const [editingWidget, setEditingWidget] = useState<IWidget>(widget);

  // widget prop이 변경될 때 editingWidget 상태 동기화
  useEffect(() => {
    setEditingWidget(widget);
  }, [widget]);

  const handleSave = async () => {
    console.log('Saving container settings:', editingWidget);
    await onSave(editingWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">컨테이너 위젯 설정</h4>
      
      <div>
        <Label htmlFor="spacing">내부 위젯 간격</Label>
        <Select 
          value={editingWidget.settings?.spacing || "4"}
          onValueChange={(value) => {
            setEditingWidget({
              ...editingWidget,
              settings: {
                ...editingWidget.settings,
                spacing: value,
              },
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="간격 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">간격 없음 (0)</SelectItem>
            <SelectItem value="2">최소 간격 (2)</SelectItem>
            <SelectItem value="4">기본 간격 (4)</SelectItem>
            <SelectItem value="6">넓은 간격 (6)</SelectItem>
            <SelectItem value="8">매우 넓은 간격 (8)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-gray-500">
        배경색, 패딩, 테두리 등의 레이아웃 설정은 "레이아웃 설정" 탭에서 변경하세요.
      </p>
    </div>
  );
}