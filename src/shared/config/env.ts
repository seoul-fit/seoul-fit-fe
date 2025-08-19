/**
 * @fileoverview 환경 변수 설정 (레거시 호환성)
 * @description 기존 코드와의 호환성을 위한 래퍼
 * 새 코드는 /src/config/environment.ts를 직접 사용하세요
 */

import { env as environment } from '@/config/environment';

/**
 * 환경 변수 설정 (레거시 호환성)
 * @deprecated 새 코드에서는 '@/config/environment'의 env를 직접 사용하세요
 */
export const env = {
  // Backend API URL
  BACKEND_BASE_URL: environment.backendBaseUrl,
  
  // Seoul Open API
  SEOUL_API_KEY: environment.seoulApiKey,
  SEOUL_API_BASE_URL: environment.seoulApiBaseUrl,
  
  // Kakao Map API
  KAKAO_MAP_API_KEY: environment.kakaoMapApiKey,
  
  // Environment
  NODE_ENV: environment.nodeEnv,
  IS_DEV: environment.isDevelopment,
  IS_PROD: environment.isProduction,
  IS_TEST: environment.isTest,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

/**
 * Backend API URL 가져오기 (클라이언트/서버 모두 사용 가능)
 * @deprecated 새 코드에서는 environment.backendBaseUrl을 사용하세요
 */
export function getBackendUrl(): string {
  return environment.backendBaseUrl;
}

/**
 * API 엔드포인트 생성
 * @deprecated 새 코드에서는 environment.createBackendEndpoint()를 사용하세요
 */
export function createApiEndpoint(path: string): string {
  return environment.createBackendEndpoint(path);
}

// 추가 헬퍼 함수들
export function getSeoulApiUrl(): string {
  return environment.seoulApiBaseUrl;
}

export function getSeoulApiKey(): string {
  return environment.seoulApiKey;
}

export default env;