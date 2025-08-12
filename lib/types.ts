// lib/types.ts

// 단일 소스 타입 정의
export const FACILITY_CATEGORIES = {
    SPORTS: 'sports',
    CULTURE: 'culture', 
    RESTAURANT: 'restaurant',
    LIBRARY: 'library',
    PARK: 'park',
    SUBWAY: 'subway',
    BIKE: 'bike',
    COOLING_SHELTER: 'cooling_shelter'
  } as const;
  
  // 타입 추출 (읽기 전용)
  export type FacilityCategory = typeof FACILITY_CATEGORIES[keyof typeof FACILITY_CATEGORIES];
  
  // 시설 정보
  export interface Facility {
      id: string
      name: string
      category: FacilityCategory
      position: {
          lat: number
          lng: number
      }
      address: string
      phone?: string
      website?: string
      operatingHours?: string
      congestionLevel: 'low' | 'medium' | 'high'
      currentUsers?: number
      maxCapacity?: number
      distance?: number // 사용자 위치로부터의 거리 (km)
      rating?: number
      description?: string
      isReservable?: boolean
  
      // 시설별 특화 정보
      sportsFacility?: {
          facilityType: string // 농구장, 축구장, 헬스장 등
          reservationUrl?: string
          availableSlots?: TimeSlot[]
          equipment?: string[]
      }
  
      culturalFacility?: {
          currentEvents?: Event[]
          ticketUrl?: string
          programs?: Program[]
      }
  
      restaurant?: {
          cuisine: string
          priceRange: 'low' | 'medium' | 'high'
          rating?: number
          reviewSummary?: string
          waitTime?: number // 분 단위
      }
  
      library?: {
          availableSeats?: number
          totalSeats?: number
          studyRooms?: StudyRoom[]
          openingHours?: string
      }

      bikeFacility?: {
          availableBikes?: number // 이용 가능한 자전거 수
          totalRacks?: number // 총 거치대 수
          availableRacks?: number // 이용 가능한 거치대 수
          shared?: string // 거치율
      }

      coolingShelter?: {
          facilityType1?: string // 시설구분1
          facilityType2?: string // 시설구분2
          capacity?: number // 이용가능인원
          areaSize?: string // 시설면적
          remarks?: string // 비고
      }

      subwayStation?: {
          stationId?: string // 역 ID
          route?: string // 노선명
      }
  }
  
  export interface TimeSlot {
      time: string
      available: boolean
      price?: number
  }
  
  export interface Event {
      id: string
      title: string
      startDate: string
      endDate: string
      description?: string
      ticketUrl?: string
  }
  
  export interface Program {
      id: string
      name: string
      schedule: string
      instructor?: string
      capacity?: number
      enrolled?: number
  }
  
  export interface StudyRoom {
      id: string
      name: string
      capacity: number
      available: boolean
      reservationUrl?: string
  }
  
  // 사용자 선호도 (Record 타입 활용)
  export type UserPreferences = Record<FacilityCategory, boolean>;
  
  // 백엔드 관심사 카테고리 매핑
  export const INTEREST_CATEGORY_MAP: Record<string, FacilityCategory> = {
    'SPORTS': 'sports',
    'CULTURE': 'culture',
    'RESTAURANTS': 'restaurant',
    'LIBRARY': 'library',
    'PARK': 'park',
    'SUBWAY': 'subway',
    'BIKE': 'bike',
    'COOLING_SHELTER': 'cooling_shelter',
    '체육시설': 'sports',
    '문화시설': 'culture',
    '맛집': 'restaurant',
    '도서관': 'library',
    '공원': 'park',
    '지하철': 'subway',
    '따릉이': 'bike',
    '무더위쉼터': 'cooling_shelter'
  };
  
  export interface UserLocation {
      lat: number
      lng: number
      address?: string
      timestamp: number
  }
  
  export interface MapState {
      isLoaded: boolean;
      isLoading: boolean;
      error: string | null;
      mapInstance: unknown | null;
      userLocation: UserLocation | null;
      selectedFacility: Facility | null;
      visibleFacilities: Facility[];
      mapLevel: number;
      preferences: UserPreferences;
      isLocationPermissionGranted: boolean;
  }
  
  // 혼잡도 데이터
  export interface CongestionData {
      AREA_NM: string;         // 장소명
      AREA_CD: string;         // 장소코드
      AREA_CONGEST_LVL: string; // 혼잡도 레벨 (여유, 보통, 약간 붐빔, 붐빔)
      AREA_CONGEST_MSG: string; // 혼잡도 메시지
  }
  
  // 날씨 데이터
  export interface WeatherData {
      AREA_NM: string; // 장소명
      AREA_CD: string; // 장소코드
      WEATHER_STTS: string; // 날씨 현황
      TEMP: string; // 기온
      SENSIBLE_TEMP: string; // 체감온도
      MAX_TEMP: string; // 일 최고온도
      MIN_TEMP: string; // 일 최저온도
      HUMIDITY: string; // 습도
      PRECIPITATION: string; // 강수량
      PCP_MSG: string; // 강수 관련 메시지
      UV_INDEX_LVL: string; // 자외선 지수 단계
      UV_MSG: string; // 자외선 메시지
      PM25_INDEX: string; // 초미세먼지 정도
      PM10_INDEX: string; // 미세먼지 정도
  }
  
  export interface SeoulApiResponse {
      RESULT: {
          'RESULT.CODE': string;
          'RESULT.MESSAGE': string;
      };
      'SeoulRtd.citydata_ppltn': CongestionData[];
  }

  // POI 데이터 타입
  export interface POIData {
      code: string;
      name: string;
      lat: number;
      lng: number;
      distance?: number;
  }

  // 따릉이 대여소 데이터 타입
  export interface BikeStationData {
      code: string;
      name: string;
      lat: number;
      lng: number;
      distance?: number;
      stationId: string;
      rackTotCnt: string; // 거치대 총 개수
      parkingBikeTotCnt: string; // 주차 자전거 총 건수
      shared: string; // 거치율
  }

  // 무더위 쉼터 데이터 타입
  export interface CoolingCenter {
      id: number;
      facilityYear?: number;
      areaCode?: string;
      facilityType1?: string;
      facilityType2?: string;
      name: string;
      roadAddress?: string;
      lotAddress?: string;
      areaSize?: string;
      capacity?: number;
      remarks?: string;
      longitude?: number;
      latitude?: number;
      mapCoordX?: number;
      mapCoordY?: number;
      createdAt?: string;
      updatedAt?: string;
  }

  // 공원 데이터 타입
  export interface Park {
      id: number;
      parkIdx?: number;
      name: string;
      content?: string;
      area?: string;
      openDate?: string;
      mainEquipment?: string;
      mainPlants?: string;
      guidance?: string;
      visitRoad?: string;
      useReference?: string;
      imageUrl?: string;
      zone?: string;
      address?: string;
      managementDept?: string;
      adminTel?: string;
      grs80Longitude?: number;
      grs80Latitude?: number;
      longitude?: number;
      latitude?: number;
      templateUrl?: string;
      createdAt?: string;
      updatedAt?: string;
  }

  // 반경 내 POI 응답 타입
  export interface NearbyPOIsResponse {
      success: boolean;
      data: {
          center: { lat: number; lng: number };
          radius: number;
          count: number;
          pois: POIData[];
      };
  }
// ===== Backend API Types =====

// OAuth Provider 타입
export type OAuthProvider = 'KAKAO' | 'GOOGLE';

// User Interests 타입
export type UserInterests = 'SPORTS' | 'CULTURE' | 'RESTAURANTS' | 'LIBRARY' | 'PARK' | 'SUBWAY' | 'BIKE' | 'COOLING_SHELTER';

// Authentication Response 타입
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    nickname: string;
  };
}

// User Result 타입
export interface UserResult {
  id: number;
  email: string;
  nickname: string;
  status: string;
  oauthProvider: string;
  oauthUserId: string;
  profileImageUrl?: string;
  interests: UserInterests[];
}

// Location Data Response 타입
export interface LocationDataResponse {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  totalCount: number;
  restaurants: TouristRestaurant[];
  libraries: any[]; // 추후 정의
  parks: SeoulPark[];
  sportsFacilities: SportsFacilityProgram[];
  coolingCenters: CoolingCenter[];
}

// Seoul Park 타입 (백엔드 API용)
export interface SeoulPark {
  id: number;
  parkIdx: number;
  name: string;
  content: string;
  area: string;
  openDate: string;
  mainEquipment: string;
  mainPlants: string;
  guidance: string;
  visitRoad: string;
  useReference: string;
  imageUrl: string;
  zone: string;
  address: string;
  managementDept: string;
  adminTel: string;
  grs80Longitude: number;
  grs80Latitude: number;
  longitude: number;
  latitude: number;
  templateUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Tourist Restaurant 타입
export interface TouristRestaurant {
  id: number;
  langCodeId: string;
  name: string;
  address: string;
  phoneNumber?: string;
  website?: string;
  representativeMenu?: string;
  // 추가 필드들은 필요에 따라 확장
}

// Sports Facility Program 타입
export interface SportsFacilityProgram {
  id: number;
  centerName: string;
  subjectName: string;
  programName: string;
  instructorName?: string;
  fee?: string;
  serviceStatus: string;
  // 추가 필드들은 필요에 따라 확장
}

// Data Statistics 타입들
export interface ParkDataStatistics {
  totalParks: number;
  parksWithCoordinates: number;
  zoneDistribution: Record<string, number>;
  // 추가 통계 필드들
}

export interface RestaurantDataStatistics {
  totalRestaurants: number;
  languageDistribution: Record<string, number>;
  restaurantsWithWebsite: number;
  restaurantsWithPhone: number;
  // 추가 통계 필드들
}

export interface ProgramDataStatistics {
  totalPrograms: number;
  activePrograms: number;
  freePrograms: number;
  subjectDistribution: Record<string, number>;
  // 추가 통계 필드들
}
// ===== Additional Backend API Types =====

// Library 타입
export interface Library {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  website?: string;
  operatingHours?: string;
  // 추가 필드들은 필요에 따라 확장
}

// Cultural Facilities 타입들
export interface CulturalSpace {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  website?: string;
  description?: string;
  // 추가 필드들은 필요에 따라 확장
}

export interface CulturalEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  ticketUrl?: string;
  // 추가 필드들은 필요에 따라 확장
}

export interface CulturalReservation {
  id: number;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  reservationUrl?: string;
  phoneNumber?: string;
  // 추가 필드들은 필요에 따라 확장
}

// Air Quality 타입
export interface AirQuality {
  id: number;
  location: string;
  latitude?: number;
  longitude?: number;
  pm10: number;
  pm25: number;
  o3: number;
  no2: number;
  co: number;
  so2: number;
  grade: string;
  measureTime: string;
  // 추가 필드들은 필요에 따라 확장
}

// Notification 타입
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  // 추가 필드들은 필요에 따라 확장
}

// Trigger Evaluation 타입
export interface TriggerEvaluationResult {
  success: boolean;
  triggeredCount: number;
  triggers: TriggerResult[];
  notifications: NotificationResult[];
  // 추가 필드들은 필요에 따라 확장
}

export interface TriggerResult {
  id: number;
  type: string;
  name: string;
  triggered: boolean;
  message?: string;
  // 추가 필드들은 필요에 따라 확장
}

export interface NotificationResult {
  id: number;
  title: string;
  message: string;
  type: string;
  // 추가 필드들은 필요에 따라 확장
}
