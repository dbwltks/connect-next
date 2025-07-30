import { calendar_v3 } from 'googleapis';

// Google Calendar API 설정 (통합된 Google API 클라이언트 사용)
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

    // API 키 없이 초기화 (OAuth 토큰만 사용)
    await window.gapi.client.init({
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
    
    console.log('Supabase session:', session);
    console.log('Provider token:', session?.provider_token);
    console.log('Provider refresh token:', session?.provider_refresh_token);
    
    if (session?.provider_token) {
      // 토큰의 스코프 확인을 위한 Google API 호출
      try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${session.provider_token}`);
        const tokenInfo = await response.json();
        console.log('토큰 정보:', tokenInfo);
        
        if (tokenInfo.scope && tokenInfo.scope.includes('calendar')) {
          console.log('Calendar 스코프 확인됨');
          return session.provider_token;
        } else {
          console.log('Calendar 스코프가 없음. 스코프:', tokenInfo.scope);
          return null;
        }
      } catch (tokenError) {
        console.error('토큰 정보 확인 실패:', tokenError);
        return session.provider_token; // 일단 토큰 반환
      }
    }
    
    return null;
  } catch (error) {
    console.error('Supabase 토큰 가져오기 실패:', error);
    return null;
  }
}

// 데스크톱인지 모바일인지 확인
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Calendar API 전용 인증 (직접 Google OAuth 사용)
export async function authenticateCalendarAPI(): Promise<boolean> {
  try {
    // 환경변수 확인
    if (!GOOGLE_CALENDAR_CONFIG.CLIENT_ID) {
      throw new Error('Google Client ID가 설정되지 않았습니다.');
    }
    
    // 먼저 저장된 토큰으로 복원 시도
    if (restoreCalendarAuth()) {
      return true;
    }
    
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
    
    const scope = GOOGLE_CALENDAR_CONFIG.SCOPES.join(' ');
    
    // 데스크톱에서는 팝업, 모바일에서는 리디렉션
    if (isMobileDevice()) {
      // 모바일: 리디렉션 방식
      const responseType = 'code';
      const accessType = 'offline';
      const prompt = 'consent';
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CALENDAR_CONFIG.CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', `${window.location.origin}/calendar-callback`);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('response_type', responseType);
      authUrl.searchParams.set('access_type', accessType);
      authUrl.searchParams.set('prompt', prompt);
      authUrl.searchParams.set('state', window.location.href);
      
      window.location.href = authUrl.toString();
      return true;
    } else {
      // 데스크톱: 팝업 방식 (Google Identity Services 사용)
      return new Promise((resolve) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
          scope: scope,
          callback: (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              // 토큰 저장
              sessionStorage.setItem('calendar_access_token', tokenResponse.access_token);
              
              // gapi 클라이언트에 토큰 설정
              if (window.gapi?.client) {
                window.gapi.client.setToken(tokenResponse);
              }
              
              console.log('Google Calendar 인증 성공');
              
              // 짧은 지연 후 resolve (팝업이 자동으로 닫힘)
              setTimeout(() => {
                resolve(true);
              }, 100);
            } else {
              console.error('토큰을 받지 못했습니다:', tokenResponse);
              resolve(false);
            }
          },
          error_callback: (error: any) => {
            console.error('Google Calendar 인증 실패:', error);
            resolve(false);
          }
        });
        
        // 팝업으로 인증 시작 (자동 닫힘 설정)
        client.requestAccessToken({ 
          prompt: 'consent',
          hint: '',
          hosted_domain: ''
        });
      });
    }
  } catch (error) {
    console.error('Calendar API 인증 실패:', error);
    return false;
  }
}

// 저장된 Calendar API 토큰으로 인증 복원
export function restoreCalendarAuth(): boolean {
  try {
    if (typeof window === 'undefined' || !window.gapi?.client) {
      return false;
    }
    
    const token = sessionStorage.getItem('calendar_access_token');
    if (token) {
      // 토큰 설정 확인
      window.gapi.client.setToken({ access_token: token });
      const currentToken = window.gapi.client.getToken();
      return !!currentToken?.access_token;
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
    // gapi 클라이언트 초기화 확인
    if (!window.gapi?.client) {
      const initialized = await initializeGoogleAPI();
      if (!initialized) {
        return null;
      }
    }
    
    // 토큰이 없으면 인증 시도
    if (!hasValidToken()) {
      const authenticated = await authenticateCalendarAPI();
      if (!authenticated) {
        return null;
      }
    }

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
      colorId: event.colorId || '9',
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
  } catch (error: any) {
    console.error('캘린더 일정 생성 에러:', error);
    // 401 에러면 토큰이 만료된 것이므로 재인증 시도
    if (error?.status === 401) {
      sessionStorage.removeItem('calendar_access_token');
      const authenticated = await authenticateCalendarAPI();
      if (authenticated) {
        // 재인증 성공하면 다시 시도
        return await createCalendarEvent(event);
      }
    }
    return null;
  }
}

// 유효한 토큰이 있는지 확인
function hasValidToken(): boolean {
  try {
    const token = window.gapi?.client?.getToken();
    const sessionToken = sessionStorage.getItem('calendar_access_token');
    
    // gapi에 토큰이 설정되어 있지 않지만 세션에 있으면 설정
    if ((!token || !token.access_token) && sessionToken) {
      window.gapi.client.setToken({ access_token: sessionToken });
      return true;
    }
    
    return !!(token && token.access_token);
  } catch (error) {
    return false;
  }
}

// Connect ID로 기존 일정 찾기
export async function findEventByConnectId(connectId: string): Promise<string | null> {
  try {
    // gapi 클라이언트 초기화 확인
    if (!window.gapi?.client) {
      const initialized = await initializeGoogleAPI();
      if (!initialized) {
        return null;
      }
    }
    
    // 토큰이 없으면 인증 시도
    if (!hasValidToken()) {
      const authenticated = await authenticateCalendarAPI();
      if (!authenticated) {
        return null;
      }
    }

    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      privateExtendedProperty: `connectId=${connectId}`,
      maxResults: 10,
    });

    if (response.result?.items && response.result.items.length > 0) {
      return response.result.items[0].id || null;
    }
    
    return null;
  } catch (error: any) {
    // 401 에러면 토큰이 만료된 것이므로 재인증 시도
    if (error?.status === 401) {
      sessionStorage.removeItem('calendar_access_token');
      const authenticated = await authenticateCalendarAPI();
      if (authenticated) {
        // 재인증 성공하면 다시 시도
        return await findEventByConnectId(connectId);
      }
    }
    return null;
  }
}

// 일정 업데이트
export async function updateCalendarEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
  try {
    // 토큰이 없으면 인증 시도
    if (!hasValidToken()) {
      const authenticated = await authenticateCalendarAPI();
      if (!authenticated) {
        return false;
      }
    }

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
      colorId: event.colorId || '9',
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
  } catch (error: any) {
    // 401 에러면 토큰이 만료된 것이므로 재인증 시도
    if (error?.status === 401) {
      sessionStorage.removeItem('calendar_access_token');
      const authenticated = await authenticateCalendarAPI();
      if (authenticated) {
        // 재인증 성공하면 다시 시도
        return await updateCalendarEvent(eventId, event);
      }
    }
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