// types/index.ts
// 공통 타입 및 인터페이스 정의 파일

export interface IBannerWidgetConfig {
  selectedBannerIds: string[]; // 선택된 배너 id 목록(슬라이드 여러 개 지원)
  // 추후 옵션 확장 가능
}

// 기존 Banner 타입 재정의(컴포넌트 import용)
export type { Banner } from "@/components/home/main-banner";
