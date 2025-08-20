import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['culture.seoul.go.kr'],
  },
  reactStrictMode: false, // 개발 환경에서 중복 렌더링 방지
};

export default nextConfig;
