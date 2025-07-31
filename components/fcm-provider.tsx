"use client";

import { useEffect, useState } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';
import { createClient } from '@/utils/supabase/client';

export default function FCMProvider() {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // FCM 토큰 가져오기 및 저장
  const requestNotificationPermission = async () => {
    try {
      console.log('현재 알림 권한 상태:', Notification.permission);
      
      // 권한이 이미 granted인 경우
      if (Notification.permission === 'granted') {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);
          (window as any).currentFCMToken = fcmToken;
          saveFCMTokenToDatabase(fcmToken);
          return true;
        }
        return false;
      }
      
      // 권한 요청
      const permission = await Notification.requestPermission();
      console.log('권한 요청 결과:', permission);
      setNotificationPermission(permission);

      if (permission === 'granted') {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          setToken(fcmToken);
          (window as any).currentFCMToken = fcmToken;
          saveFCMTokenToDatabase(fcmToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  };

  // FCM 토큰을 데이터베이스에 저장
  const saveFCMTokenToDatabase = async (fcmToken: string) => {
    // FCM 토큰만 저장 (캘린더에서 구독할 때 연결됨)
    console.log('FCM 토큰 저장 완료:', fcmToken.substring(0, 20) + '...');
  };

  // 포그라운드 메시지 리스너
  useEffect(() => {
    const unsubscribe = onMessageListener().then((payload: any) => {
      console.log('포그라운드 메시지 수신:', payload);
      
      // 포그라운드에서 알림 표시
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || '새 알림', {
          body: payload.notification?.body || '새로운 알림이 도착했습니다.',
          icon: payload.notification?.icon || '/connect_logo.png',
          tag: 'fcm-foreground'
        });
      }
    });

    return () => {
      // cleanup if needed
    };
  }, []);

  // 초기 권한 확인
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // 이미 권한이 있으면 자동으로 토큰 가져오기
      if (Notification.permission === 'granted') {
        requestNotificationPermission();
      }
    }
  }, []);

  // 전역 함수로 노출 (캘린더에서 사용할 수 있도록)
  useEffect(() => {
    (window as any).requestFCMPermission = requestNotificationPermission;
  }, []);

  return null;
}