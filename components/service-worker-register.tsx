"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker 등록 성공:', registration);
        })
        .catch((error) => {
          console.error('Service Worker 등록 실패:', error);
        });
    } else {
      console.log('이 브라우저는 Service Worker 또는 Push Manager를 지원하지 않습니다.');
    }
  }, []);

  return null;
}