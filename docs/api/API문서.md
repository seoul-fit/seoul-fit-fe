# Seoul Fit Frontend API 문서

_작성일: 2025년 8월 21일_  
_버전: 1.0.0_

---

## 📋 목차

- [API 개요](#api-개요)
- [인증 시스템](#인증-시스템)
- [사용자 관리](#사용자-관리)
- [시설 데이터](#시설-데이터)
- [위치 서비스](#위치-서비스)
- [날씨 정보](#날씨-정보)
- [에러 처리](#에러-처리)
- [사용 예시](#사용-예시)

---

## 🌐 API 개요

### 기본 정보

```typescript
// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 공통 헤더
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

### 응답 형식

모든 API 응답은 다음 형식을 따릅니다:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

---

## 🔐 인증 시스템

### OAuth 2.0 인증

#### 1. 인가 코드 검증

```typescript
POST /api/auth/oauth/authorizecheck

interface OAuthVerifyRequest {
  provider: 'kakao' | 'google' | 'naver' | 'apple';
  authorizationCode: string;
  redirectUri: string;
}

interface OAuthVerifyResponse {
  isValid: boolean;
  oauthUserId: string;
  email?: string;
  nickname?: string;
  profileImageUrl?: string;
}
```

**사용 예시:**
```typescript
const verifyOAuthCode = async (
  provider: OAuthProvider,
  code: string,
  redirectUri: string
) => {
  const response = await fetch('/api/auth/oauth/authorizecheck', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      provider,
      authorizationCode: code,
      redirectUri
    })
  });
  
  return response.json();
};
```

#### 2. OAuth 로그인

```typescript
POST /api/auth/oauth/login

interface OAuthLoginRequest {
  provider: OAuthProvider;
  authorizationCode: string;
  redirectUri: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

#### 3. OAuth 회원가입

```typescript
POST /api/auth/oauth/signup

interface OAuthSignupRequest {
  provider: OAuthProvider;
  oauthUserId: string;
  nickname: string;
  email: string;
  profileImageUrl?: string;
  interests: UserInterests[];
}
```

#### 4. 토큰 갱신

```typescript
POST /api/auth/refresh

interface TokenRefreshRequest {
  refreshToken: string;
}

interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

---

## 👤 사용자 관리

### 사용자 정보 조회

```typescript
GET /api/users/me
Authorization: Bearer {accessToken}

interface User {
  id: number;
  email: string;
  nickname: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  oauthProvider: OAuthProvider;
  oauthUserId: string;
  profileImageUrl: string;
  interests: UserInterest[];
  createdAt: string;
  updatedAt: string;
}

interface UserInterest {
  id: number;
  interestCategory: 'SPORTS' | 'CULTURE' | 'RESTAURANT' | 'LIBRARY' | 'PARK';
}
```

### 사용자 정보 수정

```typescript
PUT /api/users/{userId}
Authorization: Bearer {accessToken}

interface UpdateUserRequest {
  nickname?: string;
  profileImageUrl?: string;
}
```

### 관심사 관리

```typescript
// 관심사 조회
GET /api/users/interests
Authorization: Bearer {accessToken}

// 관심사 변경
PUT /api/users/interests
Authorization: Bearer {accessToken}

interface UpdateInterestsRequest {
  interests: UserInterests[];
}
```

---

## 🏢 시설 데이터

### 위치 기반 시설 조회

```typescript
GET /api/location/nearby
Query Parameters:
- lat: number (위도)
- lng: number (경도)
- radius: number (반경, km, 기본값: 1)
- categories?: string[] (시설 카테고리)

interface FacilityResponse {
  facilities: Facility[];
  totalCount: number;
  hasMore: boolean;
}

interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  position: {
    lat: number;
    lng: number;
  };
  address: string;
  phone?: string;
  website?: string;
  operatingHours?: string;
  congestionLevel: 'low' | 'medium' | 'high';
  currentUsers?: number;
  maxCapacity?: number;
  distance: number;
  rating?: number;
  description?: string;
  isReservable?: boolean;
}
```

### 개인화된 시설 추천

```typescript
GET /api/location/nearby/personalized
Authorization: Bearer {accessToken}
Query Parameters:
- lat: number
- lng: number
- radius?: number

// 사용자 관심사 기반 필터링된 시설 목록 반환
```

### 시설 카테고리별 조회

```typescript
// 공원
GET /api/parks/all
GET /api/parks/nearby?lat={lat}&lng={lng}&radius={radius}

// 도서관
GET /api/v1/libraries/all
GET /api/v1/libraries/nearby?lat={lat}&lng={lng}&radius={radius}

// 맛집
GET /api/v1/tourist-restaurants/latest
GET /api/v1/tourist-restaurants/search/name?query={query}
GET /api/v1/tourist-restaurants/search/address?query={query}

// 무더위 쉼터
GET /api/v1/cooling-shelters/all
GET /api/v1/cooling-shelters/nearby?lat={lat}&lng={lng}&radius={radius}
```

---

## 📍 위치 서비스

### 현재 위치 기반 데이터

```typescript
GET /api/location/nearby
Query Parameters:
- lat: number (필수)
- lng: number (필수)
- radius?: number (기본값: 1km)

interface LocationDataResponse {
  facilities: Facility[];
  weather: WeatherInfo;
  congestion: CongestionInfo;
  nearbyStations: SubwayStation[];
  bikeStations: BikeStation[];
}
```

### 지하철역 정보

```typescript
interface SubwayStation {
  id: string;
  name: string;
  line: string;
  position: {
    lat: number;
    lng: number;
  };
  distance: number;
  facilities: string[];
}
```

### 자전거 대여소 정보

```typescript
interface BikeStation {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  availableBikes: number;
  totalSlots: number;
  distance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}
```

---

## 🌤️ 날씨 정보

### 현재 날씨

```typescript
GET /api/weather/current
Query Parameters:
- lat: number
- lng: number

interface WeatherInfo {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  description: string;
  uvIndex: number;
  visibility: number;
  timestamp: string;
}
```

### 날씨 예보

```typescript
GET /api/weather/forecast
Query Parameters:
- lat: number
- lng: number
- days?: number (기본값: 3일)

interface WeatherForecast {
  daily: DailyWeather[];
  hourly: HourlyWeather[];
}

interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  precipitationChance: number;
}
```

---

## ❌ 에러 처리

### 에러 코드

```typescript
enum ErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  INVALID_TOKEN = 'AUTH_003',
  
  // 사용자 관련
  USER_NOT_FOUND = 'USER_001',
  DUPLICATE_EMAIL = 'USER_002',
  
  // 시설 관련
  FACILITY_NOT_FOUND = 'FACILITY_001',
  INVALID_LOCATION = 'FACILITY_002',
  
  // 시스템 관련
  INTERNAL_ERROR = 'SYS_001',
  RATE_LIMIT_EXCEEDED = 'SYS_002',
  SERVICE_UNAVAILABLE = 'SYS_003',
}
```

### 에러 응답 형식

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: {
      field?: string;
      value?: any;
      constraint?: string;
    };
  };
  timestamp: string;
}
```

### 에러 처리 예시

```typescript
const handleApiError = (error: ErrorResponse) => {
  switch (error.error.code) {
    case ErrorCode.UNAUTHORIZED:
      // 로그인 페이지로 리다이렉트
      router.push('/auth/login');
      break;
      
    case ErrorCode.TOKEN_EXPIRED:
      // 토큰 갱신 시도
      refreshToken();
      break;
      
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      // 사용자에게 잠시 후 다시 시도하라고 안내
      showToast('잠시 후 다시 시도해 주세요.');
      break;
      
    default:
      // 일반적인 에러 메시지 표시
      showToast(error.error.message);
  }
};
```

---

## 💡 사용 예시

### 1. 사용자 인증 플로우

```typescript
// 1. 카카오 로그인 시작
const initiateKakaoLogin = () => {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
  
  window.location.href = kakaoAuthUrl;
};

// 2. 콜백 처리
const handleAuthCallback = async (code: string) => {
  try {
    // 인가 코드 검증
    const verifyResponse = await verifyOAuthCode('kakao', code, redirectUri);
    
    if (verifyResponse.success) {
      // 기존 사용자인지 확인
      const userCheckResponse = await checkOAuthUser('kakao', verifyResponse.data.oauthUserId);
      
      if (userCheckResponse.data.exists) {
        // 로그인
        const loginResponse = await oauthLogin('kakao', code, redirectUri);
        setAuth(loginResponse.data.user, loginResponse.data.accessToken);
      } else {
        // 회원가입 페이지로 이동
        router.push('/auth/signup', { 
          state: { 
            provider: 'kakao', 
            oauthUserId: verifyResponse.data.oauthUserId,
            email: verifyResponse.data.email,
            nickname: verifyResponse.data.nickname
          }
        });
      }
    }
  } catch (error) {
    handleApiError(error);
  }
};
```

### 2. 시설 검색 및 표시

```typescript
const useFacilitySearch = (location: Location, filters: FacilityFilters) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFacilities = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        radius: filters.radius?.toString() || '1',
      });

      if (filters.categories?.length) {
        filters.categories.forEach(category => {
          params.append('categories', category);
        });
      }

      const response = await fetch(`/api/location/nearby?${params}`, {
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('시설 검색에 실패했습니다.');
      }

      const data = await response.json();
      setFacilities(data.data.facilities);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [location, filters, accessToken]);

  useEffect(() => {
    searchFacilities();
  }, [searchFacilities]);

  return { facilities, loading, error, refetch: searchFacilities };
};
```

### 3. 실시간 날씨 정보

```typescript
const useWeatherInfo = (location: Location) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/weather/current?lat=${location.lat}&lng=${location.lng}`
        );
        const data = await response.json();
        setWeather(data.data);
      } catch (error) {
        console.error('날씨 정보 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // 30분마다 날씨 정보 업데이트
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  return { weather, loading };
};
```

---

## 📚 추가 정보

### API 버전 관리

- **v1**: `/api/v1/*` - 안정화된 API
- **현재**: `/api/*` - 최신 API (하위 호환성 보장)

### 속도 제한

- **인증된 사용자**: 분당 1000회 요청
- **비인증 사용자**: 분당 100회 요청
- **검색 API**: 분당 500회 요청

### 캐싱 정책

- **시설 데이터**: 5분 캐시
- **날씨 정보**: 30분 캐시
- **사용자 정보**: 1시간 캐시

---

이 API 문서는 지속적으로 업데이트됩니다. 최신 정보는 [GitHub Repository](https://github.com/seoul-fit/seoul-fit-fe)에서 확인하세요.
