import { useState, useCallback } from "react";
import {
  validateDisplayName,
  checkForbiddenWords,
} from "@/lib/forbidden-words";
import { supabase } from "@/db";

export interface ValidationResult {
  status: "idle" | "checking" | "success" | "error";
  message: string;
  isChecking: boolean;
}

export function useDisplayNameValidation() {
  const [validation, setValidation] = useState<ValidationResult>({
    status: "idle",
    message: "",
    isChecking: false,
  });

  const validateAndCheckDuplicate = useCallback(
    async (value: string, excludeUserId?: string) => {
      // 빈 값이면 초기화
      if (!value.trim()) {
        setValidation({ status: "idle", message: "", isChecking: false });
        return;
      }

      // 기본 유효성 검사 (길이, 금지어)
      const basicValidation = validateDisplayName(value);
      if (!basicValidation.isValid) {
        setValidation({
          status: "error",
          message: basicValidation.message!,
          isChecking: false,
        });
        return;
      }

      // 중복 체크 시작
      setValidation({
        status: "checking",
        message: "확인 중...",
        isChecking: true,
      });

      try {
        let query = supabase
          .from("users")
          .select("id")
          .eq("display_name", value);

        // 현재 사용자 제외 (프로필 수정 시)
        if (excludeUserId) {
          query = query.neq("id", excludeUserId);
        }

        const { data } = await query.single();

        if (data) {
          setValidation({
            status: "error",
            message: "이미 사용 중인 디스플레이 이름입니다",
            isChecking: false,
          });
        } else {
          setValidation({
            status: "success",
            message: "사용 가능합니다",
            isChecking: false,
          });
        }
      } catch (error) {
        // 데이터가 없으면 사용 가능
        setValidation({
          status: "success",
          message: "사용 가능합니다",
          isChecking: false,
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setValidation({ status: "idle", message: "", isChecking: false });
  }, []);

  return {
    validation,
    validateAndCheckDuplicate,
    reset,
  };
}

// 디바운스된 검증 훅
export function useDebouncedDisplayNameValidation(delay: number = 600) {
  const { validation, validateAndCheckDuplicate, reset } =
    useDisplayNameValidation();

  const debouncedValidate = useCallback(
    (value: string, excludeUserId?: string) => {
      // 이전 타이머 클리어
      clearTimeout((window as any).displayNameTimer);

      // 새 타이머 설정
      (window as any).displayNameTimer = setTimeout(() => {
        validateAndCheckDuplicate(value, excludeUserId);
      }, delay);
    },
    [validateAndCheckDuplicate, delay]
  );

  return {
    validation,
    debouncedValidate,
    reset,
  };
}
