/**
 * @fileoverview Environment Configuration
 * @description 환경 변수 설정 및 관리
 */

/**
 * 환경 변수 설정
 */
export const env = {
  // Backend API URL
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080',
  
  // Seoul Open API
  SEOUL_API_KEY: process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b',
  SEOUL_API_BASE_URL: process.env.SEOUL_API_BASE_URL || 'http://openapi.seoul.go.kr:8088',
  
  // Kakao Map API
  KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

/**
 * Backend API URL 가져오기 (클라이언트/서버 모두 사용 가능)
 */
export function getBackendUrl(): string {
  // 클라이언트 사이드에서는 NEXT_PUBLIC_ 접두사가 붙은 환경 변수만 접근 가능
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';
  }
  // 서버 사이드에서는 모든 환경 변수 접근 가능
  return process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';
}

/**
 * API 엔드포인트 생성
 */
export function createApiEndpoint(path: string): string {
  const baseUrl = getBackendUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

export default env;