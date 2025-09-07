import { IWidget } from "@/types";

export interface BaseWidgetSettingsProps {
  widget: IWidget;
  onSave: (widget: IWidget) => Promise<void>;
  menuItems?: any[];
  pages?: any[];
  roles?: any[];
  programs?: any[];
}

export interface WidgetSettingsComponentProps extends BaseWidgetSettingsProps {
  // 각 위젯별 설정 컴포넌트에서 사용할 공통 props
}