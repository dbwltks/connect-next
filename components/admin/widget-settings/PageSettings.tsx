"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WidgetSettingsComponentProps } from "./types";

export function PageSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
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
      <h4 className="font-medium text-sm">페이지 설정</h4>
    </div>
  );
}