import { redirect } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en-ca";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);

dayjs.locale({
  ...dayjs.Ls["en-ca"],
  name: "ko-custom",
  relativeTime: {
    future: "%s 후",
    past: "%s 전",
    s: "몇 초",
    m: "1분",
    mm: "%d분",
    h: "1시간",
    hh: "%d시간",
    d: "1일",
    dd: "%d일",
    M: "1개월",
    MM: "%d개월",
    y: "1년",
    yy: "%d년",
  },
});

dayjs.locale("ko-custom");

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function formatRelativeTime(date: string | Date) {
  return dayjs(date).fromNow();
}
