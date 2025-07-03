import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { mutate } from 'swr';

export const useRouterCache = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 현재 페이지 정보를 포함한 캐시 키 생성
  const generateCacheKey = (baseKey: string | string[], includeParams = false) => {
    const keyArray = Array.isArray(baseKey) ? baseKey : [baseKey];
    const pathKey = [...keyArray, pathname];
    
    if (includeParams) {
      const params = searchParams.toString();
      if (params) {
        pathKey.push(params);
      }
    }
    
    return pathKey;
  };

  // 특정 캐시 키 패턴 무효화
  const invalidateCache = (pattern: string | RegExp) => {
    mutate(
      (key) => {
        if (typeof key === 'string') {
          return typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key);
        }
        if (Array.isArray(key)) {
          const keyString = key.join(',');
          return typeof pattern === 'string' ? keyString.includes(pattern) : pattern.test(keyString);
        }
        return false;
      },
      undefined,
      { revalidate: true }
    );
  };

  // 페이지 변경 시 모든 캐시 무효화
  const invalidateAllCache = () => {
    mutate(() => true, undefined, { revalidate: true });
  };

  // 페이지 변경 시 특정 캐시만 무효화
  const invalidatePageCache = () => {
    invalidateCache(/^(widgets|boardData|board)/);
  };

  return {
    pathname,
    searchParams,
    generateCacheKey,
    invalidateCache,
    invalidateAllCache,
    invalidatePageCache,
  };
};