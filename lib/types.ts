// lib/types.ts

// 단일 소스 타입 정의
export const FACILITY_CATEGORIES = {
    SPORTS: 'sports',
    CULTURE: 'culture', 
    RESTAURANT: 'restaurant',
    LIBRARY: 'library',
    PARK: 'park'
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