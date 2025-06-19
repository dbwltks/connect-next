// types/index.ts
// 공통 타입 및 인터페이스 정의 파일

// 모듈 파일로 만들기 위한 더미 export
export {};

// 페이지 인터페이스
export interface IPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  featured_image?: string;
  page_type?: string;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
}

// 게시판 게시물 인터페이스
export interface IBoardPost {
  id: string;
  title: string;
  content?: string;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
  author?: string;
  author_id?: string;
  category_id?: string;
  view_count?: number;
  description?: string;
  views?: number;
  likes_count?: number;
  page_id?: string;
  thumbnail_image?: string; // 실제 DB 필드명
  user_id?: string; // 작성자 ID
  status?: BoardPostStatus; // 게시물 상태(published, draft, hidden)
}

// 위젯 기본 인터페이스
export interface IWidget {
  id: string;
  type: string;
  title?: string;
  content?: string;
  settings?: any;
  column_position: number;
  order: number;
  width: number;
  height?: number;
  display_options?: any;
  is_active: boolean;
}

// 미디어 위젯 옵션 인터페이스
export interface IMediaWidgetOptions {
  media_title?: string;
  media_subtitle?: string;
  media_more_text?: string;
  item_count?: number; // 표시할 미디어 항목 개수
  page_id?: string;
}

// 배너 위젯 옵션 인터페이스
export interface IBannerWidgetOptions {
  banner_title?: string;
  banner_subtitle?: string;
  banner_image?: string;
  banner_link?: string;
  page_id?: string;
}

// 게시판 위젯 옵션 인터페이스
export interface IBoardWidgetOptions {
  show_thumbnail?: boolean;
  show_date?: boolean;
  show_excerpt?: boolean;
  page_id?: string;
  layout_type?: string | number; // 레이아웃 타입 (문자열 또는 숫자)
  item_count?: number | string; // 표시할 게시물 개수
}

// 갤러리 위젯 옵션 인터페이스
export interface IGalleryWidgetOptions {
  show_title?: boolean;
  show_date?: boolean;
  columns?: number;
  page_id?: string;
}

export interface IBannerWidgetConfig {
  selectedBannerIds: string[]; // 선택된 배너 id 목록(슬라이드 여러 개 지원)
  // 추후 옵션 확장 가능
}

// 기존 Banner 타입 재정의(컴포넌트 import용)
export type { Banner } from "@/components/home/main-banner";

// 게시글 상태 타입
export type BoardPostStatus = "published" | "draft" | "hidden";
