# 오픈소스 공개 준비 TODO 리스트

## 🚨 긴급 (즉시 수정 필요)

### 보안 이슈
- [ ] 하드코딩된 API 키 제거
  - [ ] src/config/environment.ts - 카카오 API 키, 서울 API 키
  - [ ] lib/seoulApi.ts - 서울 API 키
  - [ ] src/entities/weather/api/index.ts - 서울 API 키
  - [ ] src/entities/congestion/api/index.ts - 서울 API 키
  - [ ] src/entities/subway/api/index.ts - 서울 API 키
- [ ] .env.example 파일 생성
- [ ] .gitignore에 .env.local 확인
- [ ] console.log로 출력되는 민감 정보 제거

### 빌드 이슈
- [ ] 타입 에러 3개 수정
  - [ ] src/features/auth/model/oauth-flow.ts(199,34): Cannot find name 'code'
  - [ ] src/features/auth/model/oauth-flow.ts(200,28): Cannot find name 'KAKAO_REDIRECT_URI'
  - [ ] src/features/auth/model/oauth-flow.ts(222,11): Cannot find name 'auth'

### 필수 파일
- [ ] LICENSE 파일 추가 (MIT 라이선스)
- [ ] CODE_OF_CONDUCT.md 추가
- [ ] SECURITY.md 추가

## ⚠️ 중요 (1주일 내)

### 테스트
- [ ] 테스트 프레임워크 설치 (Vitest 또는 Jest)
- [ ] 기본 테스트 작성
  - [ ] 유틸리티 함수 테스트
  - [ ] 커스텀 훅 테스트
  - [ ] 컴포넌트 테스트
- [ ] 테스트 스크립트 package.json에 추가

### CI/CD
- [ ] GitHub Actions 워크플로우 설정
  - [ ] 린트 체크
  - [ ] 타입 체크
  - [ ] 테스트 실행
  - [ ] 빌드 검증

### 문서화
- [ ] JSDoc 주석 보완
  - [ ] @param, @returns, @throws 태그 추가
  - [ ] @example 태그로 사용 예제 추가
- [ ] API 문서 자동 생성 도구 설정

## 📋 권장 (1개월 내)

### 코드 품질
- [ ] ESLint 경고 14개 해결
- [ ] 사용하지 않는 변수/임포트 제거
- [ ] console.log 문 정리

### 테스트 커버리지
- [ ] 테스트 커버리지 50% 이상 달성
- [ ] E2E 테스트 추가 (Cypress 또는 Playwright)

### 커뮤니티
- [ ] GitHub 이슈 템플릿 추가
- [ ] Pull Request 템플릿 추가
- [ ] CHANGELOG.md 생성
- [ ] 기여자 가이드라인 보완

### 보안
- [ ] 의존성 취약점 스캔 자동화
- [ ] Pre-commit hooks 설정 (API 키 패턴 검사)

## 📊 현재 상태 요약

| 영역 | 점수 | 상태 |
|------|------|------|
| 코드 주석 | 3.2/5 | ⚠️ 개선 필요 |
| 테스트 | 0/5 | 🚨 심각 |
| 필수 파일 | 2.5/5 | 🚨 긴급 수정 |
| 문서화 | 4/5 | ✅ 양호 |
| 보안 | 1/5 | 🚨 극히 위험 |
| 코드 품질 | 3.5/5 | ⚠️ 개선 필요 |

**전체 평가: 3.1/5 (보통)**

## 작업 우선순위

1. **Day 1**: 보안 이슈 해결 (API 키 제거)
2. **Day 2**: 필수 파일 추가 (LICENSE 등)
3. **Day 3**: 빌드 이슈 해결 (타입 에러)
4. **Week 1**: 테스트 환경 구축
5. **Week 2**: CI/CD 파이프라인 설정
6. **Month 1**: 문서화 및 커뮤니티 준비

---

*마지막 업데이트: 2025-01-21*