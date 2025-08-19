# Seoul Fit 리팩토링 마스터플랜 v2.0

## 📊 현재 상태 (2024.08.19)

### 완료된 작업
- ✅ FSD 아키텍처 92% 도입
- ✅ TypeScript 오류 95% 해결 (182 → 9개)
- ✅ 카카오맵 API 통합 완료
- ✅ Provider 패턴 구현
- ✅ 중복 폴더 제거 (seoul-fit-fe/)

### 기술 부채
- 레거시 코드와 FSD 코드 혼재
- 컴포넌트 중복 (components/ vs src/widgets/)
- 서비스 레이어 분산 (services/ vs src/shared/api/)
- 타입 정의 분산

## 🎯 리팩토링 목표

1. **코드 일관성**: FSD 아키텍처 100% 적용
2. **타입 안정성**: TypeScript 오류 0개
3. **성능 최적화**: 번들 크기 30% 감소
4. **유지보수성**: 중복 코드 제거, 명확한 레이어 구조

## 📅 실행 계획

### Phase 1: 긴급 정리 (즉시 실행) ✅ 완료
- [x] seoul-fit-fe/ 중복 폴더 삭제
- [x] 백업 파일 정리
- [x] 테스트 파일 제거

### Phase 2: 타입 시스템 완성 (Day 1)
```bash
# 남은 타입 오류 해결
- [ ] MapView 이벤트 핸들러 타입
- [ ] BikeStation 속성 통합
- [ ] CulturalEvent 타입 완성
- [ ] MapStatus 인터페이스 통일
```

### Phase 3: 구조 통합 (Day 2-3)

#### 3.1 레거시 → FSD 이동
```
components/ → src/shared/ui/
hooks/ → src/shared/lib/hooks/
services/ → src/shared/api/
utils/ → src/shared/lib/utils/
store/ → src/shared/model/
```

#### 3.2 중복 제거
- MapContainer 통합 (components/map vs src/widgets/map-container)
- Header/Sidebar 통합
- 서비스 레이어 통합

#### 3.3 Import 경로 정리
```typescript
// Before
import { something } from '../../../components/map'
import { something } from '@/components/map'

// After
import { something } from '@/shared/ui/map'
```

### Phase 4: FSD 레이어 완성 (Day 4-5)

#### 레이어 구조
```
src/
├── app/          # 애플리케이션 진입점
├── pages/        # 페이지 컴포넌트
├── widgets/      # 독립적인 UI 블록
├── features/     # 비즈니스 기능
├── entities/     # 비즈니스 엔티티
└── shared/       # 공유 리소스
    ├── api/      # API 클라이언트
    ├── ui/       # UI 컴포넌트
    ├── lib/      # 유틸리티
    └── model/    # 전역 상태
```

### Phase 5: 최적화 (Day 6)

#### 5.1 번들 최적화
- Dynamic imports 적용
- Tree shaking 최적화
- 이미지 최적화

#### 5.2 성능 모니터링
- Web Vitals 측정
- 번들 분석
- 렌더링 최적화

## 📋 체크리스트

### 즉시 실행 가능
- [x] 중복 폴더 삭제
- [ ] 타입 오류 9개 수정
- [ ] 불필요한 console.log 제거

### 단기 (1주일)
- [ ] FSD 구조 완성
- [ ] 중복 코드 제거
- [ ] Import 경로 통일

### 중기 (2주일)
- [ ] 테스트 코드 추가
- [ ] Storybook 구성
- [ ] CI/CD 파이프라인

## 🚀 예상 효과

### 정량적 효과
- 코드베이스: 30-40% 감소
- 번들 크기: 25-30% 감소
- 빌드 시간: 20% 단축
- TypeScript 오류: 0개

### 정성적 효과
- 코드 일관성 향상
- 새로운 기능 개발 속도 향상
- 온보딩 시간 단축
- 버그 발생률 감소

## 🔧 기술 스택

### 현재 사용 중
- Next.js 15.4.4 (App Router)
- TypeScript 5.x
- React 18.x
- Kakao Maps API
- Tailwind CSS

### 권장 추가
- Vitest (테스트)
- Storybook (컴포넌트 문서화)
- Sentry (에러 모니터링)
- Bundle Analyzer (번들 분석)

## 📝 참고 사항

1. **브레이킹 체인지 최소화**: 기존 기능 유지
2. **점진적 마이그레이션**: 한 번에 하나씩
3. **문서화**: 변경사항 즉시 문서화
4. **테스트**: 각 단계별 테스트 필수

## 🎨 다음 단계

1. 남은 타입 오류 9개 즉시 수정
2. Phase 2 시작: 타입 시스템 완성
3. 주간 진행 상황 리뷰