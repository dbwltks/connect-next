import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
  // 페이지 이동 시 스크롤을 맨 위로
  experimental: {
    scrollRestoration: false,
  },
  // 캐시 클리어를 위한 빌드 시간 추가
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
