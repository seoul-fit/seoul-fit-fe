# Feature-Sliced Design (FSD) 아키텍처 가이드

_작성일: 2025년 8월 19일_  
_버전: 1.0.0_  
_적용 대상: Seoul Fit Frontend 프로젝트_

---

## 📚 목차

1. [아키텍처 개요](#-아키텍처-개요)
2. [등장 배경](#-등장-배경)
3. [핵심 원칙](#-핵심-원칙)
4. [아키텍처 구조](#-아키텍처-구조)
5. [장점 및 단점](#-장점-및-단점)
6. [실제 구현 가이드](#-실제-구현-가이드)
7. [Seoul Fit 적용 계획](#-seoul-fit-적용-계획)
8. [마이그레이션 전략](#-마이그레이션-전략)

---

## 🎯 아키텍처 개요

**Feature-Sliced Design (FSD)**는 프론트엔드 애플리케이션을 위한 아키텍처 방법론으로, 코드를 **비즈니스 도메인별로 수직 분할(vertical slicing)**하고 **계층별로 수평 분할(horizontal layering)**하는 접근법입니다.

### 핵심 컨셉
```
앱을 독립적인 "기능 슬라이스"로 나누고,
각 슬라이스를 표준화된 "레이어"로 구성하여
확장 가능하고 유지보수가 쉬운 구조를 만듭니다.
```

### 아키텍처 비교

| 특성 | 전통적 구조 | FSD |
|-----|-----------|-----|
| **조직 방식** | 기술별 그룹핑 | 비즈니스 로직별 그룹핑 |
| **의존성 방향** | 순환 의존 가능 | 단방향 의존성 |
| **코드 소유권** | 불명확 | 명확한 경계 |
| **확장성** | 제한적 | 높음 |
| **테스트 용이성** | 어려움 | 쉬움 |

---

## 🌍 등장 배경

### 기존 아키텍처의 문제점

#### 1. 전통적 MVC/MVP/MVVM의 한계
```
src/
├── controllers/    # 모든 컨트롤러가 한 곳에
├── models/        # 모든 모델이 한 곳에  
├── views/         # 모든 뷰가 한 곳에
└── utils/         # 공통 유틸리티
```
**문제**: 프로젝트가 커질수록 각 폴더가 거대해지고, 관련 코드가 분산됨

#### 2. Atomic Design의 한계
```
src/
├── atoms/         # 너무 작은 단위
├── molecules/     # 경계가 모호
├── organisms/     # 재사용성 과대평가
├── templates/     # 실제로는 잘 안씀
└── pages/        # 비즈니스 로직 집중
```
**문제**: 컴포넌트 분류가 주관적이고, 비즈니스 로직 관리가 어려움

#### 3. Domain-Driven Design 적용의 어려움
- 프론트엔드 특성을 고려하지 않음
- 과도한 추상화로 복잡도 증가
- 작은 프로젝트에는 오버엔지니어링

### FSD의 탄생

**2018-2020년** 러시아 개발 커뮤니티에서 시작되어 전 세계로 확산된 FSD는:
- 프론트엔드 특화 설계
- 실용적이고 명확한 규칙
- 점진적 도입 가능
- 프레임워크 독립적

---

## 🔑 핵심 원칙

### 1. Public API 원칙
각 모듈은 명시적인 진입점(index.ts)을 통해서만 접근 가능
```typescript
// ✅ 좋음
import { MapWidget } from '@/features/map';

// ❌ 나쁨  
import { MapWidget } from '@/features/map/ui/MapWidget';
```

### 2. 단방향 의존성
상위 레이어는 하위 레이어만 import 가능
```
app → pages → widgets → features → entities → shared
```

### 3. 격리된 슬라이스
같은 레이어의 슬라이스는 서로 직접 import 불가
```typescript
// ❌ 나쁨: features/auth가 features/user를 직접 import
import { userApi } from '@/features/user';

// ✅ 좋음: 상위 레이어에서 조합
// pages/profile에서 auth와 user 기능을 조합
```

### 4. 비즈니스 중심 구조
기술이 아닌 비즈니스 도메인으로 코드 구성
```
features/
├── auth/          # 인증 관련 모든 것
├── map/           # 지도 관련 모든 것
└── facility/      # 시설 관련 모든 것
```

---

## 🏗️ 아키텍처 구조

### 레이어 계층 구조

```
src/
├── app/              # 앱 초기화, 프로바이더, 라우터
│   ├── providers/    # 전역 프로바이더
│   ├── styles/       # 전역 스타일
│   └── index.tsx     # 앱 진입점
│
├── processes/        # (deprecated) 복잡한 비즈니스 프로세스
│
├── pages/            # 페이지 컴포지션
│   ├── home/
│   ├── map/
│   └── profile/
│
├── widgets/          # 독립적인 UI 블록
│   ├── header/
│   ├── sidebar/
│   └── map-container/
│
├── features/         # 사용자 시나리오/기능
│   ├── auth/
│   ├── search-facility/
│   └── toggle-favorite/
│
├── entities/         # 비즈니스 엔티티
│   ├── user/
│   ├── facility/
│   └── location/
│
└── shared/           # 재사용 가능한 코드
    ├── ui/           # UI 컴포넌트
    ├── api/          # API 클라이언트
    ├── lib/          # 라이브러리
    └── config/       # 설정
```

### 각 레이어 상세 설명

#### 1. **app/** - 애플리케이션 레이어
```typescript
// app/providers/index.tsx
export const AppProvider = ({ children }) => (
  <QueryClientProvider>
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

#### 2. **pages/** - 페이지 레이어
```typescript
// pages/map/index.tsx
import { MapWidget } from '@/widgets/map-container';
import { SearchFeature } from '@/features/search-facility';
import { FiltersFeature } from '@/features/filter-facilities';

export const MapPage = () => (
  <PageLayout>
    <SearchFeature />
    <FiltersFeature />
    <MapWidget />
  </PageLayout>
);
```

#### 3. **widgets/** - 위젯 레이어
```typescript
// widgets/map-container/index.tsx
import { useMapFeature } from '@/features/map';
import { FacilityCard } from '@/entities/facility';

export const MapWidget = () => {
  const { facilities, selectedFacility } = useMapFeature();
  
  return (
    <div className="map-widget">
      <Map facilities={facilities} />
      {selectedFacility && <FacilityCard data={selectedFacility} />}
    </div>
  );
};
```

#### 4. **features/** - 기능 레이어
```typescript
// features/search-facility/
├── api/           # API 호출
├── model/         # 상태 관리
├── ui/            # UI 컴포넌트
├── lib/           # 유틸리티
└── index.ts       # Public API
```

#### 5. **entities/** - 엔티티 레이어
```typescript
// entities/facility/
├── api/           # CRUD API
├── model/         # 타입, 스키마
├── ui/            # 표시 컴포넌트
└── index.ts
```

#### 6. **shared/** - 공유 레이어
```typescript
// shared/ui/button/
├── button.tsx
├── button.styles.ts
├── button.test.tsx
└── index.ts
```

---

## ✅ 장점 및 단점

### 장점

#### 1. **명확한 책임 분리**
- 각 슬라이스가 독립적인 미니 애플리케이션
- 코드 위치를 쉽게 예측 가능
- 팀원 간 작업 충돌 최소화

#### 2. **확장성**
- 새 기능 추가가 기존 코드에 영향 없음
- 슬라이스 단위로 독립적 개발/배포 가능
- 마이크로 프론트엔드로 전환 용이

#### 3. **유지보수성**
- 코드 영향 범위가 명확
- 리팩토링이 안전
- 기술 부채 격리

#### 4. **테스트 용이성**
- 슬라이스별 독립 테스트
- 모킹이 간단
- E2E 테스트 시나리오 명확

#### 5. **온보딩 효율성**
- 표준화된 구조로 학습 곡선 완화
- 문서화가 구조에 내재
- 코드 리뷰 기준 명확

### 단점

#### 1. **초기 학습 비용**
- 새로운 개념과 용어
- 레이어 구분 기준 숙지 필요

#### 2. **보일러플레이트**
- 각 슬라이스마다 폴더 구조 생성
- index.ts 파일 관리

#### 3. **작은 프로젝트에는 과도함**
- 10개 미만 페이지는 오버엔지니어링
- ROI 고려 필요

---

## 🛠️ 실제 구현 가이드

### 1. 슬라이스 생성 예제

#### Feature 슬라이스: 시설 검색
```typescript
// features/search-facility/
├── api/
│   └── search-api.ts
├── model/
│   ├── types.ts
│   └── search-store.ts
├── ui/
│   ├── search-input/
│   ├── search-results/
│   └── index.tsx
├── lib/
│   └── search-utils.ts
└── index.ts

// index.ts - Public API
export { SearchFacility } from './ui';
export { useSearchStore } from './model/search-store';
export type { SearchParams, SearchResult } from './model/types';
```

### 2. 의존성 관리

```typescript
// ✅ 올바른 import 순서
// features/map/ui/MapView.tsx
import { Button } from '@/shared/ui';        // shared 레이어
import { FacilityCard } from '@/entities/facility';  // entities 레이어
import { useAuth } from '@/features/auth';   // 다른 feature (조심해서 사용)

// ❌ 잘못된 import
import { MapWidget } from '@/widgets/map';   // 상위 레이어 import 금지
import { HomePage } from '@/pages/home';     // 상위 레이어 import 금지
```

### 3. Cross-Import 해결 전략

#### 문제 상황
```typescript
// features/auth가 features/user 데이터 필요
```

#### 해결 방법 1: 상위 레이어에서 조합
```typescript
// pages/profile/index.tsx
import { AuthFeature } from '@/features/auth';
import { UserFeature } from '@/features/user';

export const ProfilePage = () => {
  const user = UserFeature.useUser();
  const auth = AuthFeature.useAuth();
  
  return <AuthFeature.LoginForm user={user} />;
};
```

#### 해결 방법 2: Shared로 추출
```typescript
// shared/api/user/
export const userApi = {
  getProfile: () => {...}
};

// 이제 두 feature에서 모두 사용 가능
```

### 4. 파일 네이밍 컨벤션

```
features/
└── search-facility/          # kebab-case
    ├── ui/
    │   └── SearchInput.tsx   # PascalCase for components
    ├── model/
    │   └── search-store.ts   # camelCase for logic
    └── api/
        └── search-api.ts     # kebab-case with suffix
```

---

## 🚀 Seoul Fit 적용 계획

### 현재 구조 분석

```
현재 (기존 구조):
├── components/
│   ├── map/          # 모든 지도 컴포넌트
│   ├── auth/         # 인증 컴포넌트
│   └── ui/           # 공통 UI
├── hooks/            # 모든 훅
├── services/         # 모든 API
├── lib/              # 유틸리티
└── store/            # 전역 상태
```

### FSD 적용 후 구조

```
src/
├── app/
│   ├── providers/
│   │   ├── auth.tsx
│   │   ├── query.tsx
│   │   └── theme.tsx
│   ├── routes/
│   └── index.tsx
│
├── pages/
│   ├── home/
│   ├── map/
│   ├── facility-detail/
│   └── profile/
│
├── widgets/
│   ├── header/
│   ├── sidebar/
│   ├── map-container/
│   └── facility-list/
│
├── features/
│   ├── auth/
│   │   ├── login/
│   │   └── logout/
│   ├── map/
│   │   ├── render-markers/
│   │   ├── cluster-facilities/
│   │   └── track-location/
│   ├── facility/
│   │   ├── search/
│   │   ├── filter/
│   │   └── favorite/
│   └── user/
│       ├── preferences/
│       └── profile/
│
├── entities/
│   ├── user/
│   ├── facility/
│   ├── location/
│   └── map/
│
└── shared/
    ├── ui/
    ├── api/
    ├── lib/
    └── config/
```

### 구체적 마이그레이션 예시

#### 1. MapContainer 리팩토링

**현재:**
```typescript
// components/map/MapContainer.tsx (141줄)
export const MapContainer = () => {
  // 모든 로직이 한 곳에
};
```

**FSD 적용 후:**
```typescript
// widgets/map-container/ui/MapContainer.tsx
import { RenderMarkersFeature } from '@/features/map/render-markers';
import { ClusterFeature } from '@/features/map/cluster-facilities';
import { LocationTracker } from '@/features/map/track-location';
import { MapEntity } from '@/entities/map';

export const MapContainer = () => {
  return (
    <MapEntity.Provider>
      <RenderMarkersFeature />
      <ClusterFeature />
      <LocationTracker />
    </MapEntity.Provider>
  );
};
```

#### 2. 마커 렌더링 기능 분리

```typescript
// features/map/render-markers/
├── api/
│   └── fetch-facilities.ts
├── model/
│   ├── marker-store.ts
│   └── types.ts
├── ui/
│   ├── MarkerLayer.tsx
│   └── MarkerPopup.tsx
├── lib/
│   ├── marker-factory.ts
│   └── clustering-utils.ts
└── index.ts
```

---

## 📈 마이그레이션 전략

### Phase 2.1: 기반 구축 (1주)

#### 1. 폴더 구조 생성
```bash
# FSD 기본 구조 생성
mkdir -p src/{app,pages,widgets,features,entities,shared}
mkdir -p src/shared/{ui,api,lib,config}
```

#### 2. 절대 경로 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/app/*": ["src/app/*"],
      "@/pages/*": ["src/pages/*"],
      "@/widgets/*": ["src/widgets/*"],
      "@/features/*": ["src/features/*"],
      "@/entities/*": ["src/entities/*"],
      "@/shared/*": ["src/shared/*"]
    }
  }
}
```

#### 3. ESLint 규칙 추가
```javascript
// eslint.config.mjs
export default {
  rules: {
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index'
      ],
      pathGroups: [
        { pattern: '@/shared/**', group: 'internal', position: 'after' },
        { pattern: '@/entities/**', group: 'internal', position: 'after' },
        { pattern: '@/features/**', group: 'internal', position: 'after' },
        { pattern: '@/widgets/**', group: 'internal', position: 'after' },
        { pattern: '@/pages/**', group: 'internal', position: 'after' },
        { pattern: '@/app/**', group: 'internal', position: 'after' }
      ]
    }]
  }
};
```

### Phase 2.2: 점진적 마이그레이션 (2-3주)

#### 1단계: Shared 레이어
```bash
# 공통 컴포넌트 이동
mv components/ui/* src/shared/ui/
mv lib/* src/shared/lib/
mv services/* src/shared/api/
```

#### 2단계: Entities 레이어
```bash
# 비즈니스 엔티티 추출
mkdir -p src/entities/{user,facility,location,map}
# 각 엔티티의 타입, API, 기본 UI 이동
```

#### 3단계: Features 레이어
```bash
# 기능별 분리
mkdir -p src/features/map/render-markers
mkdir -p src/features/facility/search
# 각 기능의 로직, UI, API 이동
```

#### 4단계: Widgets & Pages
```bash
# 위젯과 페이지 구성
mkdir -p src/widgets/map-container
mkdir -p src/pages/map
# 컴포지션 로직 구현
```

### Phase 2.3: 최적화 (1주)

1. **번들 사이즈 최적화**
   - 레이어별 코드 스플리팅
   - Dynamic imports 적용

2. **타입 안전성 강화**
   - 각 슬라이스별 타입 정의
   - Public API 타입 export

3. **테스트 구조 정립**
   - 슬라이스별 테스트
   - 통합 테스트 시나리오

---

## 📚 참고 자료

### 공식 문서
- [Feature-Sliced Design 공식 사이트](https://feature-sliced.design/)
- [FSD GitHub](https://github.com/feature-sliced/documentation)

### 도구 및 플러그인
- [@feature-sliced/eslint-config](https://www.npmjs.com/package/@feature-sliced/eslint-config)
- [Steiger - FSD 린터](https://github.com/feature-sliced/steiger)

### 예제 프로젝트
- [FSD + React 예제](https://github.com/feature-sliced/examples)
- [Real World App](https://github.com/feature-sliced/realworld-react)

### 관련 아키텍처
- **Clean Architecture**: 비즈니스 로직 중심
- **Hexagonal Architecture**: 포트와 어댑터 패턴
- **Domain-Driven Design**: 도메인 모델 중심
- **Atomic Design**: 컴포넌트 계층 구조

---

## 🎯 결론

Feature-Sliced Design은 **현대적인 프론트엔드 프로젝트의 복잡성을 관리하는 실용적인 해결책**입니다.

### 핵심 가치
1. **예측 가능한 구조**: 코드 위치를 쉽게 찾을 수 있음
2. **확장 가능한 아키텍처**: 프로젝트 성장에 대응
3. **팀 협업 최적화**: 명확한 경계와 책임
4. **유지보수 용이성**: 변경 영향 범위 제한

### Seoul Fit 프로젝트 적용 시
- **단기 효과**: 코드 구조 명확화, 개발 속도 향상
- **장기 효과**: 기술 부채 감소, 팀 생산성 증가

FSD는 단순한 폴더 구조가 아닌, **지속 가능한 프론트엔드 개발을 위한 철학**입니다.