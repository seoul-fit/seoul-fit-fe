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
    COOLING_SHELTER: 'cooling_shelter',
    CULTURAL_EVENT: 'cultural_event',
    CULTURAL_RESERVATION: 'cultural_reservation'
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
          closeDate?: string
          seqNo?: string
          guCode?: string
      }

      park?: {
          area?: string
          openDate?: string
          mainEquipment?: string
          mainPlants?: string
          zone?: string
          managementDept?: string
          imageUrl?: string
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

      culturalEvent?: {
          codeName?: string // 장르 (미지컴/오페라 등)
          district?: string // 지역구
          eventDate?: string // 행사 기간
          startDate?: string // 시작일
          endDate?: string // 종료일
          place?: string // 공연장소
          orgName?: string // 주최기관
          useTarget?: string // 이용대상
          useFee?: string // 이용료
          isFree?: string // 무료/유료
          themeCode?: string // 테마코드
          ticket?: string // 예매방법
          mainImg?: string // 메인 이미지
          program?: string // 프로그램 상세
          etcDesc?: string // 기타 설명
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
    'CULTURAL_EVENT': 'cultural_event',
    'CULTURAL_RESERVATION': 'cultural_reservation',
    '체육시설': 'sports',
    '문화시설': 'culture',
    '맛집': 'restaurant',
    '도서관': 'library',
    '공원': 'park',
    '지하철': 'subway',
    '따릉이': 'bike',
    '무더위쉼터': 'cooling_shelter',
    '문화행사': 'cultural_event',
    '문화예약': 'cultural_reservation'
  };
  
  export interface UserLocation {
      lat: number;
      lng: number;
      address?: string;
      timestamp: number;
  }
  
  export interface ClusteredFacility {
      id: string;
      name: string;
      position: {
          lat: number;
          lng: number;
      };
      facilities: Facility[];
      categoryCounts: Record<FacilityCategory, number>;
      totalCount: number;
      primaryCategory: FacilityCategory;
  }

  export interface MapState {
      isLoaded: boolean;
      isLoading: boolean;
      error: string | null;
      mapInstance: KakaoMap | null;
      userLocation: UserLocation | null;
      selectedFacility: Facility | null;
      selectedCluster: ClusteredFacility | null;
      visibleFacilities: Facility[];
      mapLevel: number;
      preferences: UserPreferences;
      isLocationPermissionGranted: boolean;
  }
  
  // 카카오맵 관련 타입 정의
  export interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }
  
  export interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
    setLevel(level: number): void;
    getLevel(): number;
    getCenter(): KakaoLatLng;
    setZoomable(zoomable: boolean): void;
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
    email: string;
    nickname: string;
    status: string;
    oauthProvider: string;
    oauthUserId: string;
    profileImageUrl: string;
    interests: Array<{
      id: number;
      interestCategory: string;
    }>;
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
  libraries: Library[]; // 추후 정의
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

// 지도 마커용 Restaurant 타입
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  newAddress: string;
  phone: string;
  website: string;
  operatingHours: string;
  subwayInfo: string;
  representativeMenu: string;
  latitude: number;
  longitude: number;
  postUrl: string;
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

// Library 타입 (백엔드 응답 기준)
export interface Library {
  id: number;
  lbrrySeqNo?: string;
  lbrryName?: string;
  guCode?: string;
  codeValue?: string;
  adres?: string;
  telNo?: string;
  hmpgUrl?: string;
  opTime?: string;
  fdrmCloseDate?: string;
  lbrrySeName?: string;
  xcnts?: number;
  ydnts?: number;
  createdAt?: string;
  updatedAt?: string;
  // 기존 필드들 (호환성)
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  website?: string;
  operatingHours?: string;
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

// Notification Types
export type NotificationType = 'CONGESTION' | 'LOCATION' | 'SYSTEM' | 'EVENT';
export type NotificationStatus = 'SENT' | 'READ' | 'DELIVERED';

export interface TriggerCondition {
  id: number;
  type: string;
  name: string;
  description?: string;
}

// Backend API response for notification history
export interface NotificationHistoryResult {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: string;
  triggerCondition?: TriggerCondition;
  locationInfo?: string;
  status: NotificationStatus;
  sentAt: string;
  readAt?: string;
}

// Legacy notification type for compatibility
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Paginated notification response
export interface NotificationPage {
  content: NotificationHistoryResult[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
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

// 지하철 실시간 도착 정보 타입
export interface SubwayArrival {
  subwayId: string;
  updnLine: string;
  trainLineNm: string;
  statnNm: string;
  barvlDt: string;
  btrainNo: string;
  bstatnNm: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
}

export interface SubwayArrivalData {
  stationName: string;
  arrivals: SubwayArrival[];
}
