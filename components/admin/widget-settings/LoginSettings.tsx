"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettingsComponentProps } from "./types";

export function LoginSettings({ widget, onSave, editingWidget, setEditingWidget }: WidgetSettingsComponentProps & { editingWidget?: any, setEditingWidget?: any }) {
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
      <h4 className="font-medium text-sm">로그인 위젯 설정</h4>
      
      <div className="space-y-2">
        <Label htmlFor="login-title">위젯 제목</Label>
        <Input
          id="login-title"
          value={currentWidget.title || ""}
          placeholder="로그인"
          onChange={(e) =>
            updateWidget({
              title: e.target.value,
            })
          }
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-logged-out-title">
          로그아웃 상태 문구
        </Label>
        <Input
          id="login-logged-out-title"
          value={
            currentWidget.display_options?.logged_out_title ||
            "로그인이 필요합니다."
          }
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
                logged_out_title: e.target.value,
              },
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-logged-in-title">
          로그인 상태 환영 문구
        </Label>
        <Input
          id="login-logged-in-title"
          value={
            currentWidget.display_options?.logged_in_title ||
            "님, 환영합니다!"
          }
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...currentWidget.display_options,
                logged_in_title: e.target.value,
              },
            })
          }
        />
      </div>
    </div>
  );
}