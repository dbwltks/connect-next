import { SWRConfiguration } from 'swr';

// SWR 설정 - 매번 새로운 데이터 가져오기
export const swrGlobalConfig: SWRConfiguration = {
  // 캐시 비활성화 - 매번 새로운 데이터 가져오기
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  
  // 캐시 설정 비활성화
  dedupingInterval: 0,        // 중복 제거 간격 0으로 설정
  keepPreviousData: false,    // 이전 데이터 유지하지 않음
  
  // 에러 처리 설정
  errorRetryCount: 3,         // 재시도 횟수 늘림
  errorRetryInterval: 1000,   // 재시도 간격
  
  // 로깅 (개발 환경에서만)
  onError: (error, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`🔴 SWR Error for ${key}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
  },
  onSuccess: (data, key) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ SWR Success for ${key}:`, data);
    }
  },
};

// 위젯별 커스텀 설정이 필요한 경우
export const widgetSWRConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  refreshInterval: 0,  // 자동 갱신 비활성화
};

// 실시간 데이터가 필요한 경우 (예: 채팅, 알림 등)
export const realtimeSWRConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  refreshInterval: 0,   // 자동 갱신 비활성화
  revalidateOnFocus: true,  // 포커스 시 재검증
};