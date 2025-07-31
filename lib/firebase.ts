import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase 설정 (환경변수로 관리)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// FCM 메시징 인스턴스
let messaging: any = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

// FCM 토큰 가져오기
export const getFCMToken = async () => {
  if (!messaging) return null;

  try {
    // Service Worker 등록 확인
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      return currentToken;
    }
    return null;
  } catch (err) {
    console.error("FCM 토큰 가져오기 실패:", err);
    return null;
  }
};

// 포그라운드 메시지 수신 리스너
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log("포그라운드 메시지 수신:", payload);
      resolve(payload);
    });
  });

export { messaging };