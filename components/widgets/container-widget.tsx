"use client";

import React from 'react';
import { IWidget } from '@/types';

interface ContainerWidgetProps {
  widget: IWidget;
  children?: React.ReactNode;
  containerSettings?: {
    background_color?: string;
    padding?: string;
    content_align?: string;
    border_style?: string;
    border_color?: string;
    border_radius?: string;
    use_full_width?: boolean;
    height?: number;
  };
  widgets?: IWidget[];
}

export function ContainerWidget({ 
  widget, 
  children,
  containerSettings,
  widgets 
}: ContainerWidgetProps) {
  const settings = containerSettings || widget.settings || {};
  const isFullWidth = settings.use_full_width;
  
  // 위젯의 높이 설정을 우선 사용
  const containerHeight = widget.height || settings.height;

  // 컨테이너 스타일 제거 - 레이아웃 매니저처럼 깔끔하게

  // 위젯 너비에 따른 클래스 반환
  const getWidgetWidthClass = (width: number): string => {
    switch (width) {
      case 3:
        return "col-span-12 lg:col-span-3";
      case 4:
        return "col-span-12 lg:col-span-4";
      case 6:
        return "col-span-12 lg:col-span-6";
      case 8:
        return "col-span-12 lg:col-span-8";
      case 9:
        return "col-span-12 lg:col-span-9";
      case 12:
        return "col-span-12";
      default:
        return "col-span-12";
    }
  };


  // 컨테이너 스타일
  const containerStyle: React.CSSProperties = {
    ...(containerHeight ? { height: `${containerHeight}px` } : {}),
    ...(settings.background_color ? { backgroundColor: settings.background_color } : {}),
  };

  const containerClasses = [
    'widget-container',
    'w-full',
    'overflow-hidden',
  ].filter(Boolean).join(' ');

  // 전체폭 처리는 renderWidget에서 하므로 여기서는 제거

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
    >
      {widgets && React.Children.count(children) > 0 ? (
        <div 
          className="grid grid-cols-12 w-full"
          style={{ gap: `${parseInt(settings.spacing || '4') * 4}px` }}
        >
          {React.Children.map(children, (child, index) => {
            const childWidget = widgets[index];
            return (
              <div 
                key={childWidget?.id || index}
                className={`${getWidgetWidthClass(childWidget?.width || 12)} m-0 overflow-hidden`}
                style={childWidget?.height ? { height: `${childWidget.height}px` } : {}}
              >
                {child}
              </div>
            );
          })}
        </div>
      ) : children}
    </div>
  );
}