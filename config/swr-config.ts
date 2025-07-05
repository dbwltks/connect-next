import { SWRConfiguration } from 'swr';

// SWR 공식 권장 전역 설정
export const swrGlobalConfig: SWRConfiguration = {
  // 재검증 설정 (기본값 사용)
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // 성능 설정
  dedupingInterval: 2000,
  keepPreviousData: true,
  
  // 에러 처리 설정 - 안정성 보장
  errorRetryCount: 3,                 // 최대 3회 재시도
  errorRetryInterval: 2000,           // 2초 간격으로 재시도
  shouldRetryOnError: (error) => {
    // 4xx 클라이언트 에러는 재시도하지 않음 (403, 404 등)
    if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
      return false;
    }
    
    // 401 인증 에러는 재시도 (세션 갱신 가능)
    if (error?.status === 401 || 
        (error as any)?.isAuthError ||
        error?.message?.includes("JWT") || 
        error?.message?.includes("expired") ||
        error?.message?.includes("unauthorized")) {
      return true;
    }
    
    // 5xx 서버 에러, 네트워크 에러는 재시도
    if (error?.status >= 500 ||
        error?.message?.includes("fetch") || 
        error?.message?.includes("network") ||
        error?.message?.includes("timeout")) {
      return true;
    }
    
    return false; // 그 외는 재시도 안함
  },
  
  // 로깅 (개발 환경에서만)
  onError: (error, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`SWR Error for ${key}:`, error);
    }
  },
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`SWR Success for ${key}`);
    }
  },
};

// 위젯별 커스텀 설정이 필요한 경우
export const widgetSWRConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  refreshInterval: 300000,  // 위젯은 5분마다 갱신
};

// 실시간 데이터가 필요한 경우 (예: 채팅, 알림 등)
export const realtimeSWRConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  refreshInterval: 30000,   // 30초마다 갱신
  revalidateOnFocus: true,  // 포커스 시 재검증
};