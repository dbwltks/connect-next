import { SWRConfiguration } from 'swr';

// SWR 전역 설정
export const swrGlobalConfig: SWRConfiguration = {
  // 재검증 설정
  revalidateOnFocus: true,            // 포커스 시 재검증 (탭 전환 시 최신 데이터)
  revalidateOnReconnect: true,        // 재연결 시 재검증
  revalidateIfStale: true,            // stale 데이터일 때 자동 갱신
  refreshInterval: 300000,            // 5분마다 자동 갱신
  
  // 캐싱 설정
  dedupingInterval: 2000,             // 2초간 중복 요청 방지
  keepPreviousData: true,             // 새 데이터 로딩 중 이전 데이터 유지
  
  // 에러 처리 설정 - 세션 갱신을 고려한 재시도
  errorRetryCount: 3,                 // 에러 시 3번 재시도 (미들웨어 세션 갱신 고려)
  errorRetryInterval: 5000,           // 5초 간격으로 재시도 (미들웨어 처리 시간 고려)
  shouldRetryOnError: (error) => {
    // 네트워크 에러나 서버 에러는 재시도
    if (error?.message?.includes("fetch") || 
        error?.message?.includes("network") ||
        error?.message?.includes("timeout")) {
      return true;
    }
    
    // 인증 에러는 제한적으로 재시도 (미들웨어가 세션 갱신할 시간 제공)
    if ((error as any)?.isAuthError ||
        error?.message?.includes("JWT") || 
        error?.message?.includes("PGRST301") ||
        error?.message?.includes("401") ||
        error?.message?.includes("unauthorized") ||
        error?.message?.includes("인증 오류") ||
        error?.message?.includes("expired")) {
      console.log("[SWR Global] 인증 에러 감지 - 미들웨어 세션 갱신 후 재시도:", error.message);
      return true; // 재시도 허용 (미들웨어가 세션 갱신)
    }
    
    return true;
  },
  
  // 페처 설정
  fetcher: async (resource, init) => {
    const res = await fetch(resource, init);
    if (!res.ok) {
      throw new Error('API 요청 실패');
    }
    return res.json();
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