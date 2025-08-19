# 프로젝트 구조 분석 보고서

## 현재 디렉토리 구조

```
/mnt/c/dev/seoul-fit-fe/
├── app/                    # Next.js 13+ App Router (현재 사용중)
├── src/                    # FSD 아키텍처 소스 코드
│   ├── app/               # FSD app 레이어 (일부만 사용)
│   ├── entities/          # FSD entities 레이어
│   ├── features/          # FSD features 레이어
│   ├── pages/             # FSD pages 레이어
│   ├── shared/            # FSD shared 레이어
│   └── widgets/           # FSD widgets 레이어
├── components/            # 기존 React 컴포넌트 (레거시)
├── hooks/                 # 커스텀 React 훅 (레거시)
├── services/              # API 서비스 레이어 (레거시)
├── lib/                   # 유틸리티 및 타입 정의
├── utils/                 # 유틸리티 함수
├── store/                 # 전역 상태 관리
├── config/                # 설정 파일
├── docs/                  # 문서
├── seoul-fit-fe/          # 중복된 프로젝트 폴더 ⚠️
└── public/                # 정적 파일
```

## 문제점 분석

### 1. 중복된 프로젝트 구조
- **seoul-fit-fe/** 폴더가 프로젝트 루트 내부에 중복 존재
- 초기 프로젝트 생성 시 실수로 생성된 것으로 추정
- 불필요한 혼란과 디스크 공간 낭비

### 2. 아키텍처 혼재
- **FSD 아키텍처**와 **기존 구조**가 혼재
- 일부 코드는 FSD 구조 사용 (src/)
- 일부 코드는 기존 구조 사용 (components/, hooks/, services/)
- 동일한 기능이 여러 위치에 중복 구현

### 3. 타입 정의 분산
- `lib/types/` - 새로운 타입 정의
- `lib/types.ts` - 기존 통합 타입 파일
- `lib/types.ts.backup` - 백업 파일
- 여러 위치에 타입이 분산되어 관리 어려움

### 4. 컴포넌트 중복
- `components/map/` - 기존 지도 컴포넌트
- `src/widgets/map-container/` - FSD 구조 지도 컴포넌트
- 동일한 컴포넌트가 두 위치에 존재

### 5. 서비스 레이어 중복
- `services/` - 기존 API 서비스
- `src/shared/api/` - FSD 구조 API 서비스 (일부)
- API 호출 로직이 분산

## 현재 상태 요약

### 완료된 작업
- ✅ FSD 아키텍처 부분 도입 (92% 완료)
- ✅ 타입 시스템 개선 (182 → 9개 오류로 감소)
- ✅ MapProvider/FacilityProvider 패턴 구현
- ✅ 카카오맵 API 키 문제 해결

### 남은 문제
- ❌ 중복 코드 정리 필요
- ❌ seoul-fit-fe 하위 폴더 제거 필요
- ❌ 레거시 코드와 FSD 코드 통합 필요
- ❌ 타입 정의 통합 필요
- ❌ 9개 타입 오류 수정 필요

## 권장 리팩토링 계획

### Phase 1: 즉시 정리 (긴급)
1. **seoul-fit-fe/** 하위 폴더 삭제
2. 백업 파일 정리 (*.backup)
3. 중복 타입 정의 통합

### Phase 2: 구조 통합 (1-2일)
1. components/ → src/shared/ui/ 이동
2. hooks/ → src/shared/lib/hooks/ 이동
3. services/ → src/shared/api/ 이동
4. utils/ → src/shared/lib/utils/ 이동
5. store/ → src/shared/model/ 이동

### Phase 3: FSD 완전 적용 (3-5일)
1. 모든 컴포넌트를 FSD 레이어로 재구성
2. 중복 컴포넌트 제거 및 통합
3. import 경로 정리 (@/ alias 일관성)
4. 타입 시스템 완전 통합

### Phase 4: 최적화 (1-2일)
1. 번들 사이즈 최적화
2. 코드 스플리팅 적용
3. 성능 모니터링 구현
4. 테스트 코드 추가

## 예상 결과
- 코드베이스 크기 30-40% 감소
- 타입 안정성 100% 달성
- 유지보수성 대폭 향상
- 개발 속도 20-30% 향상