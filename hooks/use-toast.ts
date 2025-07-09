// ShadCN Toast 전역 이벤트 기반 방식에 맞춰, toast 함수만 re-export
import { toast as toasterToast } from "@/components/ui/toaster";

export const toast = toasterToast;

// useToast 훅 추가 (ShadCN 표준 패턴)
export function useToast() {
  return {
    toast: toasterToast,
  };
}