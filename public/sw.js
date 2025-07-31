// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});

// 푸시 메시지 수신 처리
self.addEventListener('push', (event) => {
  console.log('푸시 메시지 수신:', event);
  
  let notificationData = {
    title: '새 알림',
    body: '알림이 도착했습니다.',
    icon: '/connect_logo.png',
    badge: '/connect_logo.png',
    tag: 'calendar-notification',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.log('푸시 데이터 파싱 실패, 텍스트로 처리:', event.data.text());
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
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
    }
  );

  event.waitUntil(promiseChain);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 'open' 액션이거나 알림 자체를 클릭한 경우
  const urlToOpen = event.notification.data?.url || '/';

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
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

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event.tag);
});