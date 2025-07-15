export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 검증은 각 페이지에서 클라이언트 사이드로 처리
  return <>{children}</>;
}
