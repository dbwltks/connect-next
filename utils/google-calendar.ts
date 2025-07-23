import { format } from "date-fns";

interface CalendarEventData {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
}

/**
 * 구글 캘린더 URL을 생성하는 함수
 * @param eventData 일정 데이터
 * @returns 구글 캘린더 URL
 */
export function generateGoogleCalendarUrl(eventData: CalendarEventData): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // 날짜를 Google Calendar 형식으로 변환 (로컬 시간대로)
  const formatGoogleDate = (date: Date): string => {
    // Z를 제거하여 로컬 시간으로 처리
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventData.title,
    dates: `${formatGoogleDate(eventData.startDate)}/${formatGoogleDate(eventData.endDate)}`,
    details: eventData.description || '',
    location: eventData.location || '',
    trp: 'false'
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * 구글 캘린더에 일정을 추가하는 함수
 * @param eventData 일정 데이터
 */
export function addToGoogleCalendar(eventData: CalendarEventData): void {
  const url = generateGoogleCalendarUrl(eventData);
  window.open(url, '_blank');
}

/**
 * ICS 파일을 생성하는 함수 (대안 방법)
 * @param eventData 일정 데이터
 * @returns ICS 파일 내용
 */
export function generateICSFile(eventData: CalendarEventData): string {
  const formatICSDate = (date: Date): string => {
    // 로컬 시간대로 처리
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Connect Next//Event//KO',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Asia/Seoul:${formatICSDate(eventData.startDate)}`,
    `DTEND;TZID=Asia/Seoul:${formatICSDate(eventData.endDate)}`,
    `SUMMARY:${eventData.title}`,
    `DESCRIPTION:${eventData.description || ''}`,
    `LOCATION:${eventData.location || ''}`,
    `UID:${Date.now()}@connectnext.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

/**
 * ICS 파일을 다운로드하는 함수
 * @param eventData 일정 데이터
 */
export function downloadICSFile(eventData: CalendarEventData): void {
  const icsContent = generateICSFile(eventData);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${eventData.title}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 여러 일정을 포함하는 ICS 파일을 생성하는 함수
 * @param events 일정 데이터 배열
 * @returns ICS 파일 내용
 */
export function generateMultipleICSFile(events: CalendarEventData[]): string {
  const formatICSDate = (date: Date): string => {
    // 로컬 시간대로 처리
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Connect Next//Events//KO'
  ];

  events.forEach((eventData, index) => {
    icsContent.push(
      'BEGIN:VEVENT',
      `DTSTART;TZID=Asia/Seoul:${formatICSDate(eventData.startDate)}`,
      `DTEND;TZID=Asia/Seoul:${formatICSDate(eventData.endDate)}`,
      `SUMMARY:${eventData.title}`,
      `DESCRIPTION:${eventData.description || ''}`,
      `LOCATION:${eventData.location || ''}`,
      `UID:${Date.now()}_${index}@connectnext.com`,
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  
  return icsContent.join('\r\n');
}

/**
 * 여러 일정을 포함하는 ICS 파일을 다운로드하는 함수
 * @param events 일정 데이터 배열
 * @param filename 파일명
 */
export function downloadMultipleICSFile(events: CalendarEventData[], filename: string = '일정목록'): void {
  const icsContent = generateMultipleICSFile(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 여러 일정을 개별적으로 구글 캘린더에 추가하는 함수
 * @param events 일정 데이터 배열
 */
export function addMultipleToGoogleCalendar(events: CalendarEventData[]): void {
  events.forEach((eventData, index) => {
    setTimeout(() => {
      addToGoogleCalendar(eventData);
    }, index * 500); // 0.5초 간격으로 열기
  });
}