export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 인증 검증은 페이지 컴포넌트에서 처리
  return <>{children}</>;
}
