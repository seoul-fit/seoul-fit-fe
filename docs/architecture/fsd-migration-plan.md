# Seoul Fit - FSD 아키텍처 마이그레이션 계획

_작성일: 2025년 8월 19일_  
_버전: 1.0.0_  
_대상: Seoul Fit Frontend 프로젝트_

---

## 📋 마이그레이션 로드맵

### 현재 구조 → FSD 구조 전환 계획

```
현재 구조 (기술 중심)          →  FSD 구조 (도메인 중심)
├── components/                   ├── app/
├── hooks/                        ├── pages/  
├── services/                     ├── widgets/
├── lib/                          ├── features/
├── store/                        ├── entities/
└── utils/                        └── shared/
```

---

## 🗂️ 상세 폴더 매핑

### 1. Shared 레이어 (공통 모듈)

| 현재 위치 | FSD 위치 | 설명 |
|---------|---------|------|
| `components/ui/*` | `shared/ui/*` | 공통 UI 컴포넌트 |
| `lib/utils.ts` | `shared/lib/utils/*` | 유틸리티 함수 |
| `lib/kakao-map.ts` | `shared/lib/kakao/*` | 카카오맵 타입/유틸 |
| `lib/performance.ts` | `shared/lib/monitoring/*` | 성능 모니터링 |
| `lib/scheduler.ts` | `shared/lib/scheduler/*` | 스케줄러 유틸 |
| `lib/serverCache.ts` | `shared/lib/cache/*` | 캐시 관리 |
| `styles/*` | `shared/styles/*` | 전역 스타일 |

### 2. Entities 레이어 (비즈니스 엔티티)

| 현재 위치 | FSD 위치 | 설명 |
|---------|---------|------|
| `lib/types/user.ts` | `entities/user/model/types.ts` | 사용자 엔티티 |
| `lib/types/facility.ts` | `entities/facility/model/types.ts` | 시설 엔티티 |
| `lib/types/map.ts` | `entities/map/model/types.ts` | 지도 엔티티 |
| `services/user.ts` | `entities/user/api/index.ts` | 사용자 API |
| `services/restaurants.ts` | `entities/facility/api/restaurant.ts` | 레스토랑 API |
| `services/parks.ts` | `entities/facility/api/park.ts` | 공원 API |
| `services/libraries.ts` | `entities/facility/api/library.ts` | 도서관 API |

### 3. Features 레이어 (사용자 기능)

| 현재 기능 | FSD 위치 | 포함 내용 |
|---------|---------|----------|
| **인증** | `features/auth/` | |
| `components/auth/*` | `features/auth/ui/*` | 로그인/로그아웃 UI |
| `hooks/useAuth.ts` | `features/auth/model/use-auth.ts` | 인증 상태 관리 |
| `services/auth.ts` | `features/auth/api/index.ts` | 인증 API |
| **지도 마커** | `features/map-markers/` | |
| `hooks/useMapMarkers.ts` | `features/map-markers/model/use-markers.ts` | 마커 관리 |
| `hooks/useClusteredMarkers.ts` | `features/map-markers/model/use-clustering.ts` | 클러스터링 |
| `utils/marker.ts` | `features/map-markers/lib/marker-factory.ts` | 마커 생성 |
| **시설 검색** | `features/facility-search/` | |
| `hooks/useSearchCache.ts` | `features/facility-search/model/use-search.ts` | 검색 상태 |
| `services/searchDetail.ts` | `features/facility-search/api/index.ts` | 검색 API |
| **사용자 선호도** | `features/user-preferences/` | |
| `hooks/usePreferences.ts` | `features/user-preferences/model/use-preferences.ts` | 선호도 상태 |
| `services/preference.ts` | `features/user-preferences/api/index.ts` | 선호도 API |

### 4. Widgets 레이어 (독립 UI 블록)

| 현재 위치 | FSD 위치 | 설명 |
|---------|---------|------|
| `components/layout/Header.tsx` | `widgets/header/` | 헤더 위젯 |
| `components/layout/SideBar.tsx` | `widgets/sidebar/` | 사이드바 위젯 |
| `components/map/MapContainer.tsx` | `widgets/map-container/` | 지도 컨테이너 |
| `components/map/FacilityList.tsx` | `widgets/facility-list/` | 시설 목록 |
| `components/map/WeatherPanel.tsx` | `widgets/weather-panel/` | 날씨 패널 |
| `components/map/CongestionPanel.tsx` | `widgets/congestion-panel/` | 혼잡도 패널 |

### 5. Pages 레이어 (페이지 조합)

| 현재 페이지 | FSD 위치 | 구성 요소 |
|-----------|---------|----------|
| `app/page.tsx` | `pages/home/` | 홈 페이지 |
| 지도 뷰 | `pages/map/` | 지도 + 검색 + 필터 |
| 프로필 | `pages/profile/` | 사용자 정보 + 선호도 |
| 시설 상세 | `pages/facility/[id]/` | 시설 정보 + 리뷰 |

---

## 🔄 마이그레이션 단계별 실행 계획

### Step 1: 기반 구조 생성 (Day 1)

```bash
# FSD 폴더 구조 생성
mkdir -p src/{app,pages,widgets,features,entities,shared}
mkdir -p src/shared/{ui,api,lib,config,styles}
mkdir -p src/entities/{user,facility,map,location}
mkdir -p src/features/{auth,map-markers,facility-search,user-preferences}
mkdir -p src/widgets/{header,sidebar,map-container,facility-list}
mkdir -p src/pages/{home,map,profile,facility}
```

### Step 2: Shared 레이어 이동 (Day 2-3)

```bash
# 1. UI 컴포넌트 이동
mv components/ui/* src/shared/ui/

# 2. 라이브러리 이동
mv lib/utils.ts src/shared/lib/utils/
mv lib/kakao-map.ts src/shared/lib/kakao/
mv lib/performance.ts src/shared/lib/monitoring/

# 3. 설정 파일 이동
mv lib/types/common.ts src/shared/config/types.ts
```

### Step 3: Entities 레이어 구성 (Day 4-5)

```typescript
// entities/facility/index.ts
export * from './model/types';
export * from './api';
export { FacilityCard } from './ui/FacilityCard';
export { FacilityIcon } from './ui/FacilityIcon';
```

### Step 4: Features 레이어 구현 (Week 2)

```typescript
// features/map-markers/
├── api/
│   └── fetch-facilities.ts
├── model/
│   ├── types.ts
│   ├── use-markers.ts
│   └── marker-store.ts
├── ui/
│   ├── MarkerLayer.tsx
│   └── ClusterOverlay.tsx
├── lib/
│   ├── marker-factory.ts
│   ├── clustering-algorithm.ts
│   └── marker-utils.ts
└── index.ts
```

### Step 5: Widgets 조합 (Week 3)

```typescript
// widgets/map-container/ui/MapContainer.tsx
import { MapMarkersFeature } from '@/features/map-markers';
import { FacilitySearchFeature } from '@/features/facility-search';
import { MapEntity } from '@/entities/map';

export const MapContainer = () => {
  return (
    <div className="map-container">
      <MapEntity.Canvas>
        <MapMarkersFeature />
        <FacilitySearchFeature.Overlay />
      </MapEntity.Canvas>
    </div>
  );
};
```

---

## 📦 Import 별칭 설정

### tsconfig.json 수정

```json
{
  "compilerOptions": {
    "baseUrl": ".",
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

### Next.js 설정

```typescript
// next.config.ts
import path from 'path';

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/pages': path.resolve(__dirname, 'src/pages'),
      '@/widgets': path.resolve(__dirname, 'src/widgets'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/entities': path.resolve(__dirname, 'src/entities'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    };
    return config;
  },
};
```

---

## 🎯 마이그레이션 체크리스트

### Phase 2.1: 준비 단계
- [ ] FSD 폴더 구조 생성
- [ ] tsconfig.json 경로 별칭 설정
- [ ] ESLint 규칙 추가
- [ ] 팀 교육 및 문서 공유

### Phase 2.2: Shared & Entities
- [ ] shared/ui 컴포넌트 이동
- [ ] shared/lib 유틸리티 이동
- [ ] entities 타입 정의
- [ ] entities API 이동

### Phase 2.3: Features
- [ ] auth 기능 마이그레이션
- [ ] map-markers 기능 분리
- [ ] facility-search 구현
- [ ] user-preferences 이동

### Phase 2.4: Widgets & Pages
- [ ] 위젯 컴포넌트 조합
- [ ] 페이지 레이아웃 구성
- [ ] 라우팅 설정
- [ ] 통합 테스트

### Phase 2.5: 최적화
- [ ] 번들 사이즈 분석
- [ ] 코드 스플리팅 적용
- [ ] 성능 모니터링
- [ ] 문서 최종 업데이트

---

## 🚨 주의사항

### 1. 점진적 마이그레이션
- 한번에 모든 것을 이동하지 않음
- 기능별로 단계적 이동
- 각 단계마다 테스트 수행

### 2. 하위 호환성 유지
```typescript
// 임시 re-export로 기존 import 유지
// components/map/index.ts
export { MapContainer } from '@/widgets/map-container';
```

### 3. 팀 동기화
- 일일 스탠드업에서 진행상황 공유
- 블로킹 이슈 즉시 논의
- 코드 리뷰 철저히 수행

---

## 📈 예상 결과

### 코드 품질 개선
- **모듈성**: 70% 향상
- **재사용성**: 60% 향상
- **테스트 커버리지**: 50% → 80%

### 개발 효율성
- **새 기능 개발**: 40% 빠르게
- **버그 수정**: 30% 빠르게
- **온보딩**: 50% 단축

### 유지보수성
- **코드 검색**: 80% 빠르게
- **리팩토링 안전성**: 90% 향상
- **기술 부채**: 60% 감소

---

## 🎯 성공 지표

1. **구조적 지표**
   - [ ] 모든 컴포넌트가 FSD 구조로 이동
   - [ ] 순환 의존성 0개
   - [ ] Public API 100% 정의

2. **품질 지표**
   - [ ] ESLint 에러 0개
   - [ ] TypeScript 엄격 모드 통과
   - [ ] 테스트 커버리지 80% 이상

3. **성능 지표**
   - [ ] 번들 사이즈 20% 감소
   - [ ] 초기 로딩 시간 15% 개선
   - [ ] 코드 스플리팅 적용

---

## 📚 참고 자료

- [FSD 공식 마이그레이션 가이드](https://feature-sliced.design/docs/guides/migration)
- [레거시 코드 리팩토링 전략](https://feature-sliced.design/docs/guides/from-legacy)
- [FSD 린터 도구](https://github.com/feature-sliced/steiger)