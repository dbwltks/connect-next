import React from "react";
import { IWidget } from "@/types";

interface StripWidgetProps {
  widget: IWidget;
}

export function StripWidget({ widget }: StripWidgetProps) {
  const stripType = widget.settings?.strip_type || "image";
  const stripValue = widget.settings?.strip_value || "";
  const stripHeight = (() => {
    const h = widget.settings?.strip_height || "64px";
    if (h === "original") return undefined;
    if (h === "custom") return widget.settings?.strip_custom_height || "64px";
    return h;
  })();

  if (!stripValue) {
    return (
      <div className="w-full h-16 flex items-center justify-center rounded-md border bg-gray-50 text-gray-400 my-2">
        스트립(띠 배너) 미리보기
      </div>
    );
  }

  if (stripType === "image") {
    if (!stripHeight) {
      return (
        <div className="my-2" style={{ width: "100%" }}>
          <img
            src={stripValue}
            alt={widget.title || "스트립 배너"}
            style={{
              display: "block",
              width: "auto",
              maxWidth: "100%",
              height: "auto",
              margin: "0 auto",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
            }}
          />
        </div>
      );
    }
    return (
      <div className="w-full my-2">
        <img
          src={stripValue}
          alt={widget.title || "스트립 배너"}
          className="w-full object-cover rounded-md border"
          style={{ height: stripHeight }}
        />
      </div>
    );
  }

  if (stripType === "html") {
    return (
      <div
        className="w-full h-16 flex items-center justify-center rounded-md border bg-white my-2"
        dangerouslySetInnerHTML={{ __html: stripValue }}
      />
    );
  }

  return null;
}
