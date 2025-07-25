import { calendar_v3 } from 'googleapis';

// Google Calendar API 설정
export const GOOGLE_CALENDAR_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '728201014571-vcacg1pgbo5nfpgabdf7nngno467v63k.apps.googleusercontent.com',
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyAX7ZC6in0O8D9AA8XMT3qln-lbjQP7Ajo',
  SCOPES: ['https://www.googleapis.com/auth/calendar'],
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
};

interface CalendarEvent {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  connectId?: string; // 연결을 위한 고유 ID
  colorId?: string; // 색깔 ID (1-11)
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Google API 초기화
export async function initializeGoogleAPI(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    // Google API 스크립트 로드
    if (!window.gapi) {
      await loadGoogleAPIScript();
    }

    // Google Identity Services 스크립트 로드
    if (!window.google) {
      await loadGoogleIdentityScript();
    }

    // Google API 초기화
    await new Promise<void>((resolve) => {
      window.gapi.load('client', resolve);
    });

    await window.gapi.client.init({
      apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
      discoveryDocs: [GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOC],
    });

    return true;
  } catch (error) {
    console.error('Google API 초기화 실패:', error);
    return false;
  }
}

// Google API 스크립트 로드
function loadGoogleAPIScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google API 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

// Google Identity Services 스크립트 로드
function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

// Supabase에서 구글 토큰 가져오기
export async function getSupabaseGoogleToken(): Promise<string | null> {
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token) {
      return session.provider_token;
    }
    
    return null;
  } catch (error) {
    console.error('Supabase 토큰 가져오기 실패:', error);
    return null;
  }
}

// Calendar API 전용 인증 (기본 로그인과 별도)
export async function authenticateCalendarAPI(): Promise<boolean> {
  try {
    console.log('Google Calendar API 인증 시작...');
    console.log('CLIENT_ID:', GOOGLE_CALENDAR_CONFIG.CLIENT_ID);
    console.log('API_KEY:', GOOGLE_CALENDAR_CONFIG.API_KEY);
    
    if (!GOOGLE_CALENDAR_CONFIG.CLIENT_ID) {
      throw new Error('Google Client ID가 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수를 확인하세요.');
    }
    
    if (!GOOGLE_CALENDAR_CONFIG.API_KEY) {
      throw new Error('Google API Key가 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_API_KEY 환경변수를 확인하세요.');
    }

    if (!window.google) {
      throw new Error('Google Identity Services가 로드되지 않았습니다.');
    }

    console.log('Google Calendar API 인증을 요청합니다...');
    
    return new Promise((resolve) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
        scope: GOOGLE_CALENDAR_CONFIG.SCOPES.join(' '), // 'https://www.googleapis.com/auth/calendar'
        prompt: 'consent', // 항상 동의 화면 표시
        callback: (response: any) => {
          if (response.access_token) {
            window.gapi.client.setToken({ access_token: response.access_token });
            console.log('Calendar API 인증 성공');
            // 토큰을 로컬 스토리지에 임시 저장 (세션용)
            sessionStorage.setItem('calendar_access_token', response.access_token);
            resolve(true);
          } else {
            console.error('Calendar API 토큰 획득 실패:', response);
            resolve(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    });
  } catch (error) {
    console.error('Calendar API 인증 실패:', error);
    return false;
  }
}

// 저장된 Calendar API 토큰으로 인증 복원
export function restoreCalendarAuth(): boolean {
  try {
    const token = sessionStorage.getItem('calendar_access_token');
    if (token) {
      window.gapi.client.setToken({ access_token: token });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// 호환성을 위한 기존 함수명 유지
export async function authenticateUser(): Promise<boolean> {
  // 먼저 저장된 토큰으로 복원 시도
  if (restoreCalendarAuth()) {
    return true;
  }
  // 없으면 새로 인증
  return await authenticateCalendarAPI();
}

// 일정 생성
export async function createCalendarEvent(event: CalendarEvent): Promise<string | null> {
  try {
    const calendarEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: event.endDate.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      // 색깔 설정 (Connect Next 고유 색상)
      colorId: event.colorId || '9', // 9 = 파란색
      // 고유 ID를 extendedProperties에 저장
      extendedProperties: {
        private: {
          connectId: event.connectId || `connect_${Date.now()}`,
        },
      },
    };

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: calendarEvent,
    });

    return response.result.id || null;
  } catch (error) {
    console.error('일정 생성 실패:', error);
    return null;
  }
}

// Connect ID로 기존 일정 찾기
export async function findEventByConnectId(connectId: string): Promise<string | null> {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      privateExtendedProperty: `connectId=${connectId}`,
    });

    const events = response.result.items || [];
    return events.length > 0 ? events[0].id || null : null;
  } catch (error) {
    console.error('일정 검색 실패:', error);
    return null;
  }
}

// 일정 업데이트
export async function updateCalendarEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
  try {
    const calendarEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startDate.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      end: {
        dateTime: event.endDate.toISOString(),
        timeZone: 'Asia/Seoul',
      },
      // 색깔 설정 (Connect Next 고유 색상)
      colorId: event.colorId || '9', // 9 = 파란색
      extendedProperties: {
        private: {
          connectId: event.connectId || `connect_${Date.now()}`,
        },
      },
    };

    await window.gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: calendarEvent,
    });

    return true;
  } catch (error) {
    console.error('일정 업데이트 실패:', error);
    return false;
  }
}

// 일정 삭제
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return true;
  } catch (error) {
    console.error('일정 삭제 실패:', error);
    return false;
  }
}

// 일정 생성 또는 업데이트 (스마트 기능)
export async function createOrUpdateEvent(event: CalendarEvent): Promise<{ success: boolean; action: 'created' | 'updated' | 'error' }> {
  try {
    if (!event.connectId) {
      event.connectId = `connect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 기존 일정 찾기
    const existingEventId = await findEventByConnectId(event.connectId);

    if (existingEventId) {
      // 업데이트
      const success = await updateCalendarEvent(existingEventId, event);
      return { success, action: success ? 'updated' : 'error' };
    } else {
      // 생성
      const newEventId = await createCalendarEvent(event);
      return { success: !!newEventId, action: newEventId ? 'created' : 'error' };
    }
  } catch (error) {
    console.error('일정 생성/업데이트 실패:', error);
    return { success: false, action: 'error' };
  }
}

// 여러 일정을 생성 또는 업데이트
export async function syncMultipleEvents(events: CalendarEvent[]): Promise<{
  created: number;
  updated: number;
  errors: number;
}> {
  const results = { created: 0, updated: 0, errors: 0 };

  for (const event of events) {
    const result = await createOrUpdateEvent(event);
    
    if (result.success) {
      if (result.action === 'created') {
        results.created++;
      } else if (result.action === 'updated') {
        results.updated++;
      }
    } else {
      results.errors++;
    }

    // API 호출 간격 (구글 API 제한 고려)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Connect Next 일정들 검색 (connectId로 식별)
export async function findConnectNextEvents(): Promise<string[]> {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.result.items || [];
    const connectEventIds: string[] = [];

    events.forEach((event: any) => {
      if (event.extendedProperties?.private?.connectId) {
        connectEventIds.push(event.id);
      }
    });

    return connectEventIds;
  } catch (error) {
    console.error('Connect Next 일정 검색 실패:', error);
    return [];
  }
}

// Connect Next 일정들만 삭제
export async function deleteAllConnectNextEvents(): Promise<{
  deleted: number;
  errors: number;
}> {
  try {
    const eventIds = await findConnectNextEvents();
    const results = { deleted: 0, errors: 0 };

    for (const eventId of eventIds) {
      const success = await deleteCalendarEvent(eventId);
      if (success) {
        results.deleted++;
      } else {
        results.errors++;
      }

      // API 호출 간격
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  } catch (error) {
    console.error('Connect Next 일정 삭제 실패:', error);
    return { deleted: 0, errors: 1 };
  }
}