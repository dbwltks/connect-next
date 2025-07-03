import { SWRConfiguration } from 'swr';

// SWR 전역 설정
export const swrGlobalConfig: SWRConfiguration = {
  // 재검증 설정
  revalidateOnFocus: false,           // 포커스 시 재검증 안함
  revalidateOnReconnect: true,        // 재연결 시 재검증
  revalidateIfStale: true,            // stale 데이터일 때 자동 갱신
  refreshInterval: 600000,            // 10분마다 자동 갱신
  
  // 캐싱 설정
  dedupingInterval: 300000,           // 5분간 중복 요청 방지
  keepPreviousData: true,             // 새 데이터 로딩 중 이전 데이터 유지
  
  // 에러 처리 설정
  errorRetryCount: 3,                 // 에러 시 3번 재시도
  errorRetryInterval: 5000,           // 5초 간격으로 재시도
  shouldRetryOnError: true,           // 에러 시 자동 재시도
  
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