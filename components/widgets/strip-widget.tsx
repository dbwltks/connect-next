import React from "react";
import { IWidget } from "@/types";

interface StripWidgetProps {
  widget: IWidget;
  useContainer?: boolean; // 부모에서 컨테이너 사용 여부를 전달받음
}

export function StripWidget({ widget, useContainer }: StripWidgetProps) {
  const stripType = widget.settings?.strip_type || "image";
  const stripValue = widget.settings?.strip_value || "";
  const useFullWidth = widget.settings?.use_full_width !== false; // 기본값은 true (전체 너비 사용)

  const stripHeight = (() => {
    const h = widget.settings?.strip_height || "64px";
    if (h === "original") return undefined;
    if (h === "custom") return widget.settings?.strip_custom_height || "64px";
    return h;
  })();

  // 전체 너비를 위한 스타일 (설정에 따라 적용)
  const fullWidthStyle =
    useFullWidth && !useContainer
      ? {
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          marginRight: "calc(-50vw + 50%)",
        }
      : {};

  // 컨테이너 내부에서 사용할 때의 스타일
  const containerStyle =
    useContainer || !useFullWidth
      ? {
          width: "100%",
          margin: "0",
        }
      : {};

  const finalStyle =
    useFullWidth && !useContainer ? fullWidthStyle : containerStyle;

  if (!stripValue) {
    return (
      <div
        className="h-16 flex items-center justify-center rounded-md border bg-gray-50 text-gray-400 my-4"
        style={finalStyle}
      >
        <div className="text-center">
          <div className="text-sm font-medium">스트립(띠 배너) 미리보기</div>
          <div className="text-xs text-gray-500 mt-1">
            {useFullWidth && !useContainer
              ? "화면 전체 너비를 사용합니다"
              : "컨테이너 너비를 사용합니다"}
          </div>
        </div>
      </div>
    );
  }

  if (stripType === "image") {
    if (!stripHeight) {
      // 원본 비율 유지
      return (
        <div className="my-4" style={finalStyle}>
          <img
            src={stripValue}
            alt={widget.title || "스트립 배너"}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "cover",
            }}
          />
        </div>
      );
    }

    // 고정 높이
    return (
      <div className="my-4" style={finalStyle}>
        <img
          src={stripValue}
          alt={widget.title || "스트립 배너"}
          className="w-full object-cover"
          style={{ height: stripHeight }}
        />
      </div>
    );
  }

  if (stripType === "html") {
    return (
      <div
        className="h-16 flex items-center justify-center bg-white my-4"
        style={finalStyle}
        dangerouslySetInnerHTML={{ __html: stripValue }}
      />
    );
  }

  return null;
}
