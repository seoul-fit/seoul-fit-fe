import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['culture.seoul.go.kr'],
  },
  reactStrictMode: false, // 개발 환경에서 중복 렌더링 방지
  eslint: {
    // ESLint 경고를 빌드 실패로 처리하지 않음
    ignoreDuringBuilds: true,
    // dirs: ['pages', 'utils'] // 특정 디렉토리만 검사하려면 추가
  },
  typescript: {
    // 타입 오류는 여전히 빌드를 실패시킴
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
