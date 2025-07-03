import { createClient } from "./client";
import { toast } from "@/components/ui/toaster";

export interface SupabaseErrorHandler {
  handleError: (error: any, context?: string) => void;
  handleRequest: <T>(
    requestFn: () => Promise<T>,
    context?: string
  ) => Promise<T>;
}

export const createErrorHandler = (): SupabaseErrorHandler => {
  const supabase = createClient();

  const handleError = (error: any, context?: string) => {
    console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error);
    
    // 네트워크 에러 처리
    if (error.name === 'AbortError') {
      toast({
        title: "요청 시간 초과",
        description: "요청 시간이 초과되었습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    // 세션 만료 처리
    if (error.status === 401 || error.code === 'PGRST301') {
      toast({
        title: "세션 만료",
        description: "세션이 만료되었습니다. 다시 로그인해주세요.",
        variant: "destructive"
      });
      // 로그인 페이지로 리다이렉트하지 않고 세션 갱신 시도
      return;
    }
    
    // 기타 에러 처리
    const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
    toast({
      title: "오류 발생",
      description: errorMessage,
      variant: "destructive"
    });
  };

  const handleRequest = async <T>(
    requestFn: () => Promise<T>,
    context?: string
  ): Promise<T> => {
    try {
      const result = await requestFn();
      return result;
    } catch (error: any) {
      // 세션 만료 시 자동 갱신 시도
      if (error.status === 401 || error.code === 'PGRST301') {
        try {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (session && !refreshError) {
            // 세션 갱신 성공, 원래 요청 재시도
            toast({
              title: "세션 갱신 완료",
              description: "세션이 갱신되었습니다."
            });
            return await requestFn();
          } else {
            // 세션 갱신 실패
            toast({
              title: "세션 갱신 실패",
              description: "세션 갱신에 실패했습니다. 다시 로그인해주세요.",
              variant: "destructive"
            });
            // 필요시 로그인 페이지로 리다이렉트
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw error;
          }
        } catch (refreshError) {
          toast({
            title: "오류",
            description: "세션 갱신 중 오류가 발생했습니다.",
            variant: "destructive"
          });
          throw error;
        }
      }
      
      handleError(error, context);
      throw error;
    }
  };

  return { handleError, handleRequest };
};

export default createErrorHandler;