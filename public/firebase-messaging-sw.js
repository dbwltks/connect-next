// Firebase Messaging Service Worker

// Firebase SDK를 가져옵니다
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정을 API로부터 가져오기
let messaging = null;

// Firebase 초기화 함수
async function initializeFirebase() {
  try {
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    
    // 설정이 제대로 로드되었는지 확인
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase 설정이 불완전합니다');
    }
    
    // Firebase 초기화
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    console.log('Firebase 초기화 완료');
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    console.error('환경변수를 확인하세요');
  }
}

// Service Worker 설치 시 Firebase 초기화
self.addEventListener('install', () => {
  console.log('Service Worker 설치 중...');
  initializeFirebase();
});

// Firebase 초기화 (즉시 실행)
initializeFirebase();

// 백그라운드 메시지 처리 (Firebase 초기화 후 실행)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_INITIALIZED' && messaging) {
    messaging.onBackgroundMessage((payload) => {
      console.log('백그라운드 메시지 수신:', payload);

      const notificationTitle = payload.notification?.title || '새 알림';
      const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 도착했습니다.',
        icon: payload.notification?.icon || '/connect_logo.png',
        badge: '/connect_logo.png',
        tag: 'fcm-notification',
        data: payload.data || {},
        actions: [
          {
            action: 'open',
            title: '열기'
          },
          {
            action: 'close',
            title: '닫기'
          }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});

// Firebase 초기화 완료 후 메시지 처리 설정
async function setupMessaging() {
  if (messaging) {
    messaging.onBackgroundMessage((payload) => {
      console.log('백그라운드 메시지 수신:', payload);

      const notificationTitle = payload.notification?.title || '새 알림';
      const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 도착했습니다.',
        icon: payload.notification?.icon || '/connect_logo.png',
        badge: '/connect_logo.png',
        tag: 'fcm-notification',
        data: payload.data || {},
        actions: [
          {
            action: 'open',
            title: '열기'
          },
          {
            action: 'close',
            title: '닫기'
          }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    // messaging이 아직 초기화되지 않았으면 잠시 후 다시 시도
    setTimeout(setupMessaging, 1000);
  }
}

// 메시징 설정 실행
setupMessaging();

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 앱 열기
  const urlToOpen = event.notification.data?.url || '/';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url.includes(self.location.origin)) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});