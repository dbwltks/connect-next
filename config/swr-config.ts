import { SWRConfiguration } from 'swr';

// SWR 설정 - 캐시 최적화로 egress 사용량 절약
export const swrGlobalConfig: SWRConfiguration = {
  // 캐시 활성화 - 불필요한 요청 줄이기
  revalidateOnFocus: false,    // 포커스 시 재검증 비활성화
  revalidateOnReconnect: true, // 네트워크 재연결 시에만 재검증
  revalidateIfStale: true,     // 오래된 데이터일 때만 재검증
  
  // 캐시 설정 활성화
  dedupingInterval: 60000,     // 1분간 중복 요청 방지
  keepPreviousData: true,      // 이전 데이터 유지하여 로딩 개선
  
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

// 헤더 메뉴 전용 설정 (최적화된 캐시 설정)
export const headerMenuSWRConfig: SWRConfiguration = {
  ...swrGlobalConfig,
  refreshInterval: 0,       // 자동 갱신 비활성화
  revalidateOnFocus: false, // 포커스 시 재검증 비활성화
  revalidateOnMount: false, // 마운트 시 재검증 비활성화 (초기 데이터 있을 때)
  dedupingInterval: 300000, // 5분간 중복 요청 방지
  focusThrottleInterval: 60000, // 포커스 이벤트 1분간 throttle
};