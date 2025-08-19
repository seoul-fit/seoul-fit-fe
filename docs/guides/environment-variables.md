# 환경 변수 설정 가이드

## 개요

Seoul Fit 프로젝트는 환경 변수를 통해 다양한 설정을 관리합니다. 이 가이드는 환경 변수 설정 방법과 사용 방법을 설명합니다.

## 환경 변수 파일

### 1. `.env.local` (로컬 개발용)
로컬 개발 환경에서 사용하는 환경 변수 파일입니다.

```bash
# .env.local 파일 생성
cp .env.example .env.local
# 실제 값들을 입력
```

### 2. `.env.example` (템플릿)
환경 변수 템플릿 파일로, 버전 관리에 포함됩니다.

## 주요 환경 변수

### Backend API 설정
```bash
# Backend API URL (끝에 슬래시 없음)
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8080

# 환경별 설정 예시:
# 로컬: http://localhost:8080
# 테스트: https://api-test.seoulfit.com
# 프로덕션: https://api.seoulfit.com
```

### Seoul Open API 설정
```bash
# Seoul Open Data API Key
SEOUL_API_KEY=your_api_key_here

# Seoul Open API Base URL
SEOUL_API_BASE_URL=http://openapi.seoul.go.kr:8088
```

### Kakao Map API 설정
```bash
# Kakao Map API Key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_key_here
```

## 코드에서 사용하기

### 1. 환경 변수 유틸리티 사용

```typescript
import { getBackendUrl, createApiEndpoint } from '@/shared/config/env';

// Backend URL 가져오기
const backendUrl = getBackendUrl();

// API 엔드포인트 생성
const endpoint = createApiEndpoint('/api/users/me');
// 결과: http://localhost:8080/api/users/me
```

### 2. 직접 접근 (권장하지 않음)

```typescript
// 클라이언트 사이드에서는 NEXT_PUBLIC_ 접두사 필요
const apiUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
```

## 환경별 설정

### 로컬 개발 환경
```bash
# .env.local
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8080
NODE_ENV=development
```

### 테스트 환경
```bash
# .env.test
NEXT_PUBLIC_BACKEND_BASE_URL=https://api-test.seoulfit.com
NODE_ENV=test
```

### 프로덕션 환경
```bash
# .env.production
NEXT_PUBLIC_BACKEND_BASE_URL=https://api.seoulfit.com
NODE_ENV=production
```

## 주의사항

1. **NEXT_PUBLIC_ 접두사**: 클라이언트 사이드에서 사용할 환경 변수는 반드시 `NEXT_PUBLIC_` 접두사를 붙여야 합니다.

2. **보안**: 민감한 정보(API 키, 비밀번호 등)는 절대 클라이언트 사이드 환경 변수에 넣지 마세요.

3. **버전 관리**: `.env.local` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 포함되어 있는지 확인하세요.

4. **기본값**: 환경 변수가 설정되지 않았을 때를 대비해 항상 기본값을 제공하세요.

## 트러블슈팅

### 환경 변수가 인식되지 않는 경우

1. Next.js 서버 재시작
```bash
# 개발 서버 재시작
npm run dev
```

2. .next 캐시 삭제
```bash
rm -rf .next
npm run dev
```

### TypeScript 타입 에러

환경 변수 타입 정의 추가:
```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BACKEND_BASE_URL: string;
    SEOUL_API_KEY: string;
    // 기타 환경 변수들...
  }
}
```

## 참고 자료

- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [환경 변수 유틸리티 코드](/src/shared/config/env.ts)