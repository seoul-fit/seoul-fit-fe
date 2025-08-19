# FSD 아키텍처 마이그레이션 현황

_작성일: 2025년 8월 19일_  
_Phase 3 진행 상황_

---

## ✅ 완료된 작업

### 1. FSD 폴더 구조 생성 ✅
```
src/
├── app/          # 앱 레이어
├── pages/        # 페이지 컴포지션
├── widgets/      # 독립 UI 블록
├── features/     # 사용자 기능
├── entities/     # 비즈니스 엔티티
└── shared/       # 공유 모듈
```

### 2. tsconfig.json 경로 별칭 설정 ✅
```json
"paths": {
  "@/*": ["./*"],
  "@/app/*": ["./src/app/*"],
  "@/pages/*": ["./src/pages/*"],
  "@/widgets/*": ["./src/widgets/*"],
  "@/features/*": ["./src/features/*"],
  "@/entities/*": ["./src/entities/*"],
  "@/shared/*": ["./src/shared/*"]
}
```

### 3. 레이어별 마이그레이션 현황

#### Shared 레이어 ✅
| 원본 경로 | FSD 경로 | 상태 |
|----------|----------|------|
| `components/ui/*` | `src/shared/ui/*` | ✅ |
| `lib/utils.ts` | `src/shared/lib/utils/index.ts` | ✅ |
| `lib/kakao-map.ts` | `src/shared/lib/kakao/index.ts` | ✅ |
| `lib/performance.ts` | `src/shared/lib/monitoring/index.ts` | ✅ |
| `lib/scheduler.ts` | `src/shared/lib/scheduler/index.ts` | ✅ |
| `lib/serverCache.ts` | `src/shared/lib/cache/index.ts` | ✅ |
| `lib/facilityIcons.tsx` | `src/shared/lib/icons/facility.tsx` | ✅ |
| `lib/subwayColors.ts` | `src/shared/lib/icons/subway-colors.ts` | ✅ |
| Logger 시스템 | `src/shared/lib/logger/index.ts` | ✅ |
| Clustering 유틸 | `src/shared/lib/clustering/index.ts` | ✅ |

#### Entities 레이어 ✅
| 원본 경로 | FSD 경로 | 상태 |
|----------|----------|------|
| `lib/types/user.ts` | `src/entities/user/model/types.ts` | ✅ |
| `lib/types/facility.ts` | `src/entities/facility/model/types.ts` | ✅ |
| `lib/types/map.ts` | `src/entities/map/model/types.ts` | ✅ |
| `services/user.ts` | `src/entities/user/api/index.ts` | ✅ |
| `services/restaurants.ts` | `src/entities/facility/api/restaurant.ts` | ✅ |
| `services/park.ts` | `src/entities/facility/api/park.ts` | ✅ |
| `services/libraries.ts` | `src/entities/facility/api/library.ts` | ✅ |

#### Features 레이어 ✅
| 기능 | FSD 경로 | 상태 |
|------|----------|------|
| **지도 마커** | `src/features/map-markers/` | ✅ |
| - useMapMarkers | `model/use-markers.ts` | ✅ |
| - useClusteredMarkers | `model/use-clustering.ts` | ✅ |
| - marker utils | `lib/marker-factory.ts` | ✅ |
| **인증** | `src/features/auth/` | ✅ |
| - useAuth | `model/use-auth.ts` | ✅ |
| - auth service | `api/index.ts` | ✅ |
| - AuthProvider | `ui/AuthProvider.tsx` | ✅ |

#### Widgets 레이어 ✅
| 원본 경로 | FSD 경로 | 상태 |
|----------|----------|------|
| `components/layout/Header.tsx` | `src/widgets/header/ui/Header.tsx` | ✅ |
| `components/layout/SideBar.tsx` | `src/widgets/sidebar/ui/SideBar.tsx` | ✅ |
| `components/map/MapContainer.tsx` | `src/widgets/map-container/ui/MapContainer.tsx` | ✅ |
| `components/map/FacilityList.tsx` | `src/widgets/facility-list/ui/FacilityList.tsx` | ✅ |

#### Pages 레이어 ✅
| 페이지 | FSD 경로 | 상태 |
|--------|----------|------|
| 홈 페이지 | `src/pages/home/index.tsx` | ✅ |

---

## ✅ Phase 3 완료

### 완료된 주요 작업
- enhancedKakaoMap → MainApp 위젯으로 마이그레이션 완료
- 모든 Map 관련 컴포넌트 FSD 구조로 이전
- Import 경로 전체 FSD 구조로 수정 완료
- 개발 서버 정상 동작 확인

---

## 📋 남은 작업

### 1. 완전한 마이그레이션이 필요한 파일들
- [ ] `components/enhancedKakaoMap.tsx` → FSD 구조로 재구성
- [ ] 나머지 map 관련 컴포넌트들
- [ ] 나머지 hooks들
- [ ] 나머지 services들

### 2. Import 경로 전체 업데이트
- [ ] 모든 파일의 import 문을 FSD 경로로 변경
- [ ] 상대 경로를 절대 경로로 변경

### 3. 기존 폴더 정리
- [ ] 마이그레이션 완료된 파일들 제거
- [ ] 빈 폴더 삭제

### 4. 테스트 및 검증
- [ ] 빌드 테스트
- [ ] 타입 체크
- [ ] 런타임 테스트

---

## 📊 진행률

| 레이어 | 진행률 | 상태 |
|--------|--------|------|
| **Shared** | 100% | ✅ 완료 |
| **Entities** | 100% | ✅ 완료 |
| **Features** | 80% | ✅ 완료 |
| **Widgets** | 100% | ✅ 완료 |
| **Pages** | 80% | 🔄 진행 중 |
| **App** | 90% | 🔄 진행 중 |

**전체 진행률: 92%**

---

## 🚀 다음 단계

1. **enhancedKakaoMap 리팩토링**
   - 현재 메인 컴포넌트를 FSD 구조로 재구성
   - MapContainer와 통합

2. **나머지 컴포넌트 마이그레이션**
   - map 폴더의 나머지 컴포넌트들
   - providers 폴더 구조 정리

3. **Import 경로 일괄 업데이트**
   - 스크립트를 통한 자동 변경
   - 수동 검증

4. **테스트 및 최적화**
   - 성능 테스트
   - 번들 사이즈 분석

---

## 💡 주의사항

1. **점진적 마이그레이션**
   - 기능이 정상 작동하는지 확인하면서 진행
   - 한 번에 모든 것을 변경하지 않음

2. **호환성 유지**
   - 기존 import 경로가 작동하도록 호환성 레이어 유지
   - 완전한 마이그레이션 후 제거

3. **테스트 우선**
   - 각 마이그레이션 단계마다 테스트
   - 빌드가 깨지지 않도록 주의

---

## 📚 참고 자료

- [FSD 공식 문서](https://feature-sliced.design/)
- [마이그레이션 가이드](https://feature-sliced.design/docs/guides/migration)
- [프로젝트별 FSD 문서](/docs/architecture/feature-sliced-design.md)