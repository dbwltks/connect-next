"use client";

import { Category } from "@/components/admin/category-manager";
import dynamic from "next/dynamic";

// 동적으로 섹션 컴포넌트 로드
const BoardSection = dynamic(() => import("./board-section"));
const ContentSection = dynamic(() => import("./content-section"));

// 추후 다른 섹션 타입 추가 시 여기에 추가
// const EventSection = dynamic(() => import('./event-section'), {
//   loading: () => <SectionSkeleton title="이벤트 로딩 중..." />
// });
// const SermonSection = dynamic(() => import('./sermon-section'), {
//   loading: () => <SectionSkeleton title="설교 로딩 중..." />
// });

// 섹션 로딩 중 표시할 스켈레톤 UI
function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-4 mb-8 p-4 border border-dashed rounded-md animate-pulse">
      <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

import { Section } from "@/components/admin/section-manager";

interface SectionRendererProps {
  section: Section;
  className?: string;
  menuTitle?: string;
  posts?: any[];
  users?: any[];
  totalCount?: number;
  page?: number;
  totalPages?: number;
  searchType?: string;
  searchTerm?: string;
}

export default function SectionRenderer({
  section,
  className = "",
  menuTitle,
  posts = [],
  users = [],
  totalCount = 0,
  page = 1,
  totalPages = 1,
  searchType = "title",
  searchTerm = "",
}: SectionRendererProps) {
  // 타입 안정성 확보: as any 단언 및 옵셔널 체이닝
  const s = section as any;
  const isActive = s.isActive ?? s.is_active;
  if (!isActive) return null;

  const displayType =
    s.category?.display_type ?? s.displayType ?? s.pageType ?? s.page_type;
  if (displayType === "board") {
    return (
      <BoardSection
        section={section}
        className={className}
        menuTitle={menuTitle}
      />
    );
  }

  if (displayType === "content") {
    return <ContentSection section={section} className={className} />;
  }

  // 기타 타입 분기(예: gallery 등)는 아래에 추가
  // 기본 fallback UI
  return (
    <div className={`sm:p-4 border border-dashed rounded-md ${className}`}>
      <h2 className="text-xl font-bold">{section.title}</h2>
      <p className="text-muted-foreground">
        {section.description || "섹션 설명이 없습니다."}
      </p>
      <p className="mt-4 text-sm text-amber-600">
        이 섹션 타입(
        {displayType || s.page_type || s.pageType || "지정되지 않음"})은 아직
        구현되지 않았습니다.
      </p>
    </div>
  );
}
