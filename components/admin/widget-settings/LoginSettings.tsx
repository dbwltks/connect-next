"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { WidgetSettingsComponentProps } from "./types";

export function LoginSettings({ widget, onSave }: WidgetSettingsComponentProps) {
  const updateWidget = (updates: any) => {
    const updatedWidget = {
      ...widget,
      ...updates,
    };
    onSave(updatedWidget);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">로그인 위젯 설정</h4>
      <div className="space-y-2">
        <Label htmlFor="login-logged-out-title">
          로그아웃 상태 문구
        </Label>
        <Input
          id="login-logged-out-title"
          value={
            widget.display_options?.logged_out_title ||
            "로그인이 필요합니다."
          }
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...widget.display_options,
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
            widget.display_options?.logged_in_title ||
            "님, 환영합니다!"
          }
          onChange={(e) =>
            updateWidget({
              display_options: {
                ...widget.display_options,
                logged_in_title: e.target.value,
              },
            })
          }
        />
      </div>
    </div>
  );
}