/**
 * 시간을 한국식 오전/오후 형식으로 변환하는 유틸리티 함수들
 */

/**
 * 시간(hour)을 오전/오후 형식으로 변환
 * @param hour - 24시간 형식의 시간 (0-23)
 * @returns 한국식 시간 문자열 (예: "오전 9시", "오후 2시")
 */
export function formatHourToKorean(hour: number): string {
  if (hour === 0) return "오전 12시";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "오후 12시";
  return `오후 ${hour - 12}시`;
}

/**
 * 시간과 분을 오전/오후 형식으로 변환
 * @param hour - 24시간 형식의 시간 (0-23)
 * @param minute - 분 (0-59)
 * @returns 한국식 시간 문자열 (예: "오전 9시 30분", "오후 2시")
 */
export function formatTimeToKorean(hour: number, minute: number): string {
  const hourStr = formatHourToKorean(hour);
  return minute > 0 ? `${hourStr} ${minute}분` : hourStr;
}

/**
 * Date 객체를 오전/오후 형식으로 변환
 * @param date - Date 객체
 * @returns 한국식 시간 문자열 (예: "오전 9시 30분", "오후 2시")
 */
export function formatDateTimeToKorean(date: Date): string {
  const hour = date.getHours();
  const minute = date.getMinutes();
  return formatTimeToKorean(hour, minute);
}

/**
 * ISO 문자열을 오전/오후 형식으로 변환
 * @param isoString - ISO 형식의 날짜 문자열
 * @returns 한국식 시간 문자열 (예: "오전 9시 30분", "오후 2시")
 */
export function formatISOTimeToKorean(isoString: string): string {
  const date = new Date(isoString);
  return formatDateTimeToKorean(date);
}

/**
 * 날짜와 시간을 한국식으로 포맷 (날짜 + 시간)
 * @param date - Date 객체
 * @param locale - date-fns 로케일 (기본값: ko)
 * @returns 날짜와 시간이 포함된 문자열 (예: "2024년 1월 15일 (월) 오전 9시 30분")
 */
export function formatFullDateTimeToKorean(date: Date, locale?: any): string {
  const { format } = require('date-fns');
  const { ko } = require('date-fns/locale');
  
  const dateStr = format(date, "yyyy년 M월 d일 (EEE)", { locale: locale || ko });
  const timeStr = formatDateTimeToKorean(date);
  
  return `${dateStr} ${timeStr}`;
}