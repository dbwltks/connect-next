import type { Metadata } from "next";
import { NewConnectionContent } from "./NewConnectionContent";

export const metadata: Metadata = {
  title: "2026 뉴커넥션 콘서트 | Toronto Connect Church",
  description:
    "2026. Sep. 24 (Thu) 7:30 PM, 토론토 커넥트 교회 GYM에서 열리는 뉴커넥션 콘서트에 초대합니다.",
};

export default function NewConnection2026Page() {
  return <NewConnectionContent />;
}
