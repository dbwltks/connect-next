import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // 캐시 클리어를 위한 빌드 시간 추가
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
