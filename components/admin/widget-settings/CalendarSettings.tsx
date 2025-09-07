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

export function CalendarSettings({ widget, onSave }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">캘린더 설정</h4>
    </div>
  );
}