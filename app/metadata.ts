const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "커넥트 교회 - 하나님과 사람, 사람과 사람을 연결하는 교회",
  description:
    "하나님의 말씀으로 충만하고 사랑으로 하나되는 커넥트 교회입니다.",
};
