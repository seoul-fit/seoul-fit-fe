# Seoul Fit Frontend 기여하기 🤝

Seoul Fit Frontend 프로젝트에 오신 것을 환영합니다! 여러분의 기여에 대해 매우 기쁘게 생각합니다. 이 문서는 기여 과정을 안내하고 시작하는 데 도움을 드릴 것입니다.

## 📋 목차

- [행동 강령](#행동-강령)
- [시작하기](#시작하기)
- [개발 환경 설정](#개발-환경-설정)
- [개발 워크플로우](#개발-워크플로우)
- [코딩 가이드라인](#코딩-가이드라인)
- [커밋 컨벤션](#커밋-컨벤션)
- [Pull Request 프로세스](#pull-request-프로세스)
- [이슈 가이드라인](#이슈-가이드라인)
- [커뮤니티](#커뮤니티)

---

## 📜 행동 강령

이 프로젝트는 모든 기여자가 따라야 할 행동 강령을 준수합니다. 기여하기 전에 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)를 읽어주세요.

**요약**: 모든 상호작용에서 존중하고, 포용적이며, 전문적으로 행동해 주세요.

---

## 🚀 시작하기

### 기여 방법

- **🐛 버그 리포트** - 문제를 식별하고 수정하는 데 도움
- **💡 기능 요청** - 새로운 기능이나 개선사항 제안
- **📝 문서화** - 문서 개선, 예시 추가, 오타 수정
- **🔧 코드** - 버그 수정, 기능 구현, 성능 최적화
- **🎨 디자인** - UI/UX 개선, 접근성 향상
- **🧪 테스트** - 테스트 작성, 테스트 커버리지 개선
- **🌍 번역** - 앱을 다국어로 만드는 데 도움

### 시작하기 전에

1. **기존 이슈를 검색**하여 중복을 피하세요
2. [docs/community/roadmap.md](docs/community/roadmap.md)에서 **로드맵을 확인**하세요
3. GitHub Discussions에서 **토론에 참여**하세요
4. 확실하지 않은 것이 있으면 **질문**하세요

---

## 💻 개발 환경 설정

### 사전 요구사항

- **Node.js** 18.0 이상
- **npm** 9.0 이상
- **Git** 적절한 설정 포함
- **VSCode** (권장) 및 확장 팩

### 환경 설정

1. **저장소 포크 및 클론**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/seoul-fit-fe.git
   cd seoul-fit-fe
   ```

2. **의존성 설치**:
   ```bash
   npm install
   ```

3. **환경 변수 설정**:
   ```bash
   cp .env.example .env.local
   # API 키를 입력하세요 (자세한 내용은 README.md 참조)
   ```

4. **권장 VSCode 확장 설치**:
   ```bash
   # VSCode가 권장 확장을 설치하라고 안내할 것입니다
   # 또는 .vscode/extensions.json에서 수동으로 설치
   ```

5. **설정 확인**:
   ```bash
   npm run validate  # 린팅, 타입 검사, 포맷팅 검사 실행
   npm run dev       # 개발 서버 시작
   ```

---

## 🔄 개발 워크플로우

### 1. 브랜치 생성

항상 작업을 위한 새 브랜치를 생성하세요:

```bash
# 기능용
git checkout -b feature/your-feature-name

# 버그 수정용
git checkout -b fix/issue-description

# 문서용
git checkout -b docs/improvement-description
```

### 2. 변경사항 작성

- 스타일 가이드를 따라 **깔끔하고 읽기 쉬운 코드** 작성
- 복잡한 로직에 **주석 추가**
- 필요시 **문서 업데이트**
- 변경사항에 대한 **테스트 작성 또는 업데이트**

### 3. 변경사항 테스트

```bash
# 모든 품질 검사 실행
npm run validate

# 애플리케이션 테스트
npm run dev
npm run build  # 프로덕션 빌드가 작동하는지 확인
```

### 4. 변경사항 커밋

[커밋 컨벤션](#커밋-컨벤션)을 따르세요:

```bash
git add .
git commit -m "feat: add facility filtering by distance"
```

### 5. 푸시 및 PR 생성

```bash
git push origin feature/your-feature-name
```

그런 다음 GitHub에서 Pull Request를 생성하세요.

---

## 📋 코딩 가이드라인

### TypeScript 가이드라인

- **엄격한 TypeScript 사용** - 절대적으로 필요한 경우가 아니면 `any` 타입 사용 금지
- 모든 데이터 구조에 대해 **적절한 인터페이스 정의**
- 런타임 타입 검사를 위한 **타입 가드 사용**
- 가능한 경우 타입 주석보다 **`const` 어설션 선호**

```typescript
// ✅ 좋음
interface FacilityData {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

// ❌ 피하세요
const facilityData: any = getFacilityData();
```

### React 가이드라인

- 훅과 함께 **함수형 컴포넌트 사용**
- 로직 재사용을 위해 **커스텀 훅 선호**
- props와 state에 **TypeScript 사용**
- **컴포넌트 합성** 패턴 따르기

```typescript
// ✅ 좋음
interface MapViewProps {
  facilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
}

export function MapView({ facilities, onFacilitySelect }: MapViewProps) {
  // 컴포넌트 구현
}
```

### CSS 가이드라인

- 스타일링에 **TailwindCSS 사용**
- Radix UI로 **재사용 가능한 컴포넌트 생성**
- **모바일 우선** 반응형 디자인 따르기
- **접근성 보장** (WCAG 2.1 AA)

```typescript
// ✅ 좋음 - TailwindCSS 클래스 사용
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  클릭하세요
</button>

// ❌ 피하세요 - 인라인 스타일
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  클릭하세요
</button>
```

### 성능 가이드라인

- 비용이 많이 드는 컴포넌트에 **React.memo 사용**
- 대용량 목록에 **가상화 구현**
- **이미지와 자산 최적화**
- **번들 크기 최소화**

```typescript
// ✅ 좋음 - 메모화된 비용이 많이 드는 컴포넌트
export const FacilityList = React.memo(({ facilities }: Props) => {
  // 컴포넌트 구현
});
```

---

## 📝 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 명세를 사용합니다:

### 형식
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 타입

- **feat**: 새로운 기능
- **fix**: 버그 수정
- **docs**: 문서만 변경
- **style**: 코드 의미에 영향을 주지 않는 변경 (공백, 포맷팅)
- **refactor**: 버그를 수정하거나 기능을 추가하지 않는 코드 변경
- **perf**: 성능 개선
- **test**: 누락된 테스트 추가 또는 기존 테스트 수정
- **chore**: 빌드 프로세스나 보조 도구 변경

### 예시

```bash
# 기능
git commit -m "feat(map): add facility clustering for better performance"

# 버그 수정
git commit -m "fix(auth): resolve kakao login redirect issue"

# 문서
git commit -m "docs: add API key setup instructions to README"

# 중대한 변경
git commit -m "feat(api): change facility data structure

BREAKING CHANGE: facility.location is now facility.coordinates"
```

---

## 🔍 Pull Request 프로세스

### 제출 전

- [ ] **모든 테스트 통과** (`npm run validate`)
- [ ] **코드가 스타일 가이드라인을 따름**
- [ ] **필요시 문서 업데이트**
- [ ] **커밋 메시지가 컨벤션을 따름**
- [ ] **브랜치가 main과 최신 상태**

### PR 템플릿

필요한 정보를 제공하기 위해 PR 템플릿을 사용하세요:

```markdown
## 📝 설명
변경사항에 대한 간단한 설명

## 🎯 변경 타입
- [ ] 버그 수정
- [ ] 새로운 기능
- [ ] 문서 업데이트
- [ ] 리팩토링
- [ ] 성능 개선

## 🧪 테스트
어떻게 테스트되었나요?

## 📋 체크리스트
- [ ] 코드가 스타일 가이드라인을 따름
- [ ] 자체 검토 완료
- [ ] 복잡한 코드에 주석 추가
- [ ] 문서 업데이트
- [ ] 새로운 경고 없음
```

### 검토 프로세스

1. **자동화된 검사**가 통과해야 함 (ESLint, TypeScript, 빌드)
2. **최소 한 명의 검토자** 승인 필요
3. 병합 전 **모든 피드백 해결**
4. 깔끔한 히스토리를 위한 **스쿼시 및 병합**

---

## 🐛 이슈 가이드라인

### 버그 리포트

버그 리포트 템플릿을 사용하고 다음을 포함하세요:

- 이슈에 대한 **명확한 설명**
- 버그를 **재현하는 단계**
- **예상 vs 실제 동작**
- 해당되는 경우 **스크린샷**
- **환경 세부사항** (OS, 브라우저, 버전)
- 있는 경우 **콘솔 에러**

### 기능 요청

기능 요청 템플릿을 사용하고 다음을 포함하세요:

- 해결하려는 **문제 설명**
- 세부사항이 포함된 **제안된 솔루션**
- 고려된 **대안 솔루션**
- **추가 컨텍스트**나 목업

### 질문

- 질문에는 **GitHub Discussions** 사용
- 먼저 기존 토론 검색
- 컨텍스트와 시도한 것 제공

---

## 🎨 디자인 가이드라인

### UI/UX 원칙

- **접근성 우선** - WCAG 2.1 AA 준수
- **모바일 우선** 반응형 디자인
- Radix UI를 사용한 **일관된 디자인 시스템**
- **직관적인 네비게이션**과 사용자 플로우

### 시각적 가이드라인

- 디자인 토큰에서 **시맨틱 색상 사용**
- Tailwind 간격 스케일을 사용한 **일관된 간격 유지**
- **타이포그래피 계층 구조 따르기**
- **충분한 색상 대비 보장**

---

## 🧪 테스트 가이드라인

### 테스트 전략

- 유틸리티 함수에 대한 **단위 테스트**
- UI 컴포넌트에 대한 **컴포넌트 테스트**
- API 상호작용에 대한 **통합 테스트**
- 중요한 사용자 플로우에 대한 **E2E 테스트**

### 테스트 구조

```typescript
// ✅ 좋은 테스트 구조
describe('FacilityFilter', () => {
  it('should filter facilities by category', () => {
    // 준비
    const facilities = createMockFacilities();
    
    // 실행
    const result = filterFacilitiesByCategory(facilities, 'park');
    
    // 검증
    expect(result).toHaveLength(2);
    expect(result.every(f => f.category === 'park')).toBe(true);
  });
});
```

---

## 📚 문서화

### 문서 타입

- **API 문서** - 모든 공개 API 문서화
- **컴포넌트 문서** - UI 컴포넌트를 위한 Storybook 스토리
- **아키텍처 문서** - 고수준 시스템 설계
- **사용자 가이드** - 사용자를 위한 사용법 가이드

### 작성 가이드라인

- **명확하고 간결한** 언어
- 모든 API에 대한 **코드 예시**
- 복잡한 작업에 대한 **단계별 지침**
- 코드 변경과 함께 **문서 최신 상태 유지**

---

## 🌍 국제화

### 번역 추가

1. 번역 파일로 **텍스트 추출**
2. 하드코딩된 텍스트 대신 **i18n 키 사용**
3. **다른 언어로 테스트**
4. 레이아웃에서 **텍스트 확장 고려**

### 지원 언어

- **한국어** (주요)
- **영어** (보조)
- **일본어** (계획됨)

---

## 🆘 도움 받기

### 질문할 곳

- **GitHub Issues** - 버그 리포트 및 기능 요청
- **GitHub Discussions** - 일반적인 질문 및 토론
- **Discord** - 실시간 채팅 (곧 제공 예정)

### 응답 시간

- **버그 리포트** - 48시간 이내
- **기능 요청** - 1주일 이내
- **질문** - 24시간 이내

---

## 🏆 인정

우리는 모든 기여를 소중히 여기며 다음을 통해 기여자를 인정합니다:

- **All Contributors** 명세
- 릴리스에서 **기여자 스포트라이트**
- 문서에서 **특별 감사**
- 중요한 기여자에 대한 **메인테이너 초대**

---

## 📞 연락처

- **메인테이너**: [메인테이너 목록]
- **이메일**: project@example.com
- **트위터**: @SeoulFitApp

---

Seoul Fit Frontend에 기여해 주셔서 감사합니다! 여러분의 기여는 서울을 모든 사람에게 더 접근 가능하고 즐거운 곳으로 만드는 데 도움이 됩니다. 🏙️❤️
