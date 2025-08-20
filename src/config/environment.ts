/**
 * @fileoverview 환경 변수 중앙 관리
 * @description 모든 환경 변수를 한 곳에서 관리하고 타입 안전성을 보장
 */

// 환경 타입 정의
export type Environment = 'development' | 'production' | 'test';

// 환경 변수 타입 정의
interface EnvironmentVariables {
  // 기본 설정
  NODE_ENV: Environment;
  APP_URL: string;
  
  // 백엔드 API
  BACKEND_BASE_URL: string;
  
  // 카카오 API
  KAKAO_CLIENT_ID: string;
  KAKAO_MAP_API_KEY: string;
  KAKAO_REDIRECT_URI: string;
  
  // 서울 공공데이터 API
  SEOUL_API_KEY: string;
  SEOUL_API_BASE_URL: string;
}

// 환경별 기본값
const defaults: Record<Environment, Partial<EnvironmentVariables>> = {
  development: {
    APP_URL: 'http://localhost:3000',
    BACKEND_BASE_URL: 'http://localhost:8080',
    KAKAO_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    SEOUL_API_BASE_URL: 'http://openapi.seoul.go.kr:8088',
  },
  production: {
    APP_URL: 'https://seoul-fit.vercel.app',
    BACKEND_BASE_URL: 'https://api.seoul-fit.com',
    KAKAO_REDIRECT_URI: 'https://seoul-fit.vercel.app/auth/callback',
    SEOUL_API_BASE_URL: 'http://openapi.seoul.go.kr:8088',
  },
  test: {
    APP_URL: 'http://localhost:3000',
    BACKEND_BASE_URL: 'http://localhost:8080',
    KAKAO_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    SEOUL_API_BASE_URL: 'http://openapi.seoul.go.kr:8088',
  },
};

// 현재 환경 감지
function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  return env || 'development';
}

// 환경 변수 로드 및 검증
class EnvironmentConfig {
  private env: Environment;
  private config: EnvironmentVariables;

  constructor() {
    this.env = getCurrentEnvironment();
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentVariables {
    const currentDefaults = defaults[this.env] || {};
    
    return {
      // 기본 설정
      NODE_ENV: this.env,
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || currentDefaults.APP_URL || 'http://localhost:3000',
      
      // 백엔드 API
      BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL || currentDefaults.BACKEND_BASE_URL || 'http://localhost:8080',
      
      // 카카오 API
      KAKAO_CLIENT_ID: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '349f89103b32e7135ad6f15e0a73509b',
      KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '8bb6267aba6b69af4605b7fd2dd75c96',
      KAKAO_REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || currentDefaults.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      
      // 서울 공공데이터 API
      SEOUL_API_KEY: process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b',
      SEOUL_API_BASE_URL: process.env.SEOUL_API_BASE_URL || currentDefaults.SEOUL_API_BASE_URL || 'http://openapi.seoul.go.kr:8088',
    };
  }

  private validateConfig(): void {
    const required: (keyof EnvironmentVariables)[] = [
      'KAKAO_CLIENT_ID',
      'KAKAO_MAP_API_KEY',
    ];

    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0 && this.env === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (missing.length > 0) {
      console.warn(`Missing environment variables: ${missing.join(', ')}. Using defaults.`);
    }
  }

  // Getters
  get nodeEnv(): Environment {
    return this.config.NODE_ENV;
  }

  get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  get appUrl(): string {
    return this.config.APP_URL;
  }

  get backendBaseUrl(): string {
    return this.config.BACKEND_BASE_URL;
  }

  get kakaoClientId(): string {
    return this.config.KAKAO_CLIENT_ID;
  }

  get kakaoMapApiKey(): string {
    return this.config.KAKAO_MAP_API_KEY;
  }

  get kakaoRedirectUri(): string {
    return this.config.KAKAO_REDIRECT_URI;
  }

  get seoulApiKey(): string {
    return this.config.SEOUL_API_KEY;
  }

  get seoulApiBaseUrl(): string {
    return this.config.SEOUL_API_BASE_URL;
  }

  // API 엔드포인트 생성 헬퍼
  createBackendEndpoint(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.BACKEND_BASE_URL}${cleanPath}`;
  }

  createSeoulApiEndpoint(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.SEOUL_API_BASE_URL}${cleanPath}`;
  }

  // 전체 설정 반환 (디버깅용)
  getAll(): EnvironmentVariables {
    return { ...this.config };
  }

  // 특정 키의 값 반환
  get(key: keyof EnvironmentVariables): string {
    return this.config[key];
  }
}

// 싱글톤 인스턴스
export const env = new EnvironmentConfig();

// 기존 코드와의 호환성을 위한 개별 exports
export const NODE_ENV = env.nodeEnv;
export const IS_DEVELOPMENT = env.isDevelopment;
export const IS_PRODUCTION = env.isProduction;
export const APP_URL = env.appUrl;
export const BACKEND_BASE_URL = env.backendBaseUrl;
export const KAKAO_CLIENT_ID = env.kakaoClientId;
export const KAKAO_MAP_API_KEY = env.kakaoMapApiKey;
export const KAKAO_REDIRECT_URI = env.kakaoRedirectUri;
export const SEOUL_API_KEY = env.seoulApiKey;
export const SEOUL_API_BASE_URL = env.seoulApiBaseUrl;