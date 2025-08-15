"use client";

import BoardSection from "@/components/sections/board-section";
import { Section } from "@/components/admin/section-manager";
import { IWidget } from "@/types/index";

interface BoardWidgetProps {
  widget: IWidget;
}

export function BoardWidget({ widget }: BoardWidgetProps) {

  const pageId = widget.display_options?.page_id;

  if (!pageId) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
        <h3 className="font-bold">게시판 섹션 오류</h3>
        <p>
          이 위젯을 표시하려면 '콘텐츠 페이지 선택'에서 게시판 타입의 페이지를
          연결해야 합니다.
        </p>
      </div>
    );
  }

  // IWidget prop을 BoardSection이 요구하는 Section prop으로 변환합니다.
  const sectionForBoard: Section = {
    id: widget.id,
    title: widget.title || "",
    name: widget.type, // 'board-section'
    description: widget.content || "",
    type: "custom", // BoardSection은 이 값을 확인하지 않습니다.
    isActive: widget.is_active,
    order: widget.order,
    settings: {
      ...widget.display_options,
      pageId: pageId, // pageId를 settings 안에 명확히 전달
    },
    pageId: pageId, // BoardSection이 루트 레벨의 pageId도 참조하므로 명시적으로 추가
  };

  return <BoardSection section={sectionForBoard} />;
}
