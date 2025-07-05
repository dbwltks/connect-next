import { SWRConfiguration } from 'swr';

// SWR 전역 설정 - 실무 수준 최적화
export const swrGlobalConfig: SWRConfiguration = {
  // 재검증 설정 - 세션 문제 해결을 위한 적극적 갱신
  revalidateOnFocus: true,            // 탭 포커스 시 최신 데이터 확인
  revalidateOnReconnect: true,        // 네트워크 재연결 시 데이터 갱신
  revalidateIfStale: true,            // 오래된 데이터 자동 갱신
  revalidateOnMount: true,            // 컴포넌트 마운트 시 항상 재검증
  refreshInterval: 0,                 // 자동 갱신 비활성화 (필요시 개별 설정)
  
  // 캐싱 설정 - 성능과 UX 균형
  dedupingInterval: 10000,            // 10초간 중복 요청 방지 (연장)
  keepPreviousData: true,             // 로딩 중 이전 데이터 유지 (깜빡임 방지)
  focusThrottleInterval: 10000,       // 포커스 재검증 간격 연장 (10초)
  
  // 캐시 유효성 설정
  isOnline: () => true,               // 항상 온라인으로 간주
  isVisible: () => true,              // 항상 visible로 간주 (백그라운드 탭에서도 캐시 유지)
  
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