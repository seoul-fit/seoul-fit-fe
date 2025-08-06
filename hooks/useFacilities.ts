// hooks/useFacilities.ts
import { useState, useMemo, useCallback } from 'react';
import { 
  FACILITY_CATEGORIES, 
  type FacilityCategory, 
  type Facility, 
  type UserPreferences 
} from '@/lib/types';

// 샘플 시설 데이터
const SAMPLE_FACILITIES: Facility[] = [
  {
    id: '1',
    name: '올림픽공원 체육관',
    category: FACILITY_CATEGORIES.SPORTS,
    position: { lat: 37.5219, lng: 127.1227 },
    address: '서울특별시 송파구 올림픽로 424',
    congestionLevel: 'medium',
    distance: 1.2,
    isReservable: true,
    operatingHours: '06:00-22:00',
    rating: 4.3,
    description: '올림픽공원 내 종합 체육시설'
  },
  {
    id: '2',
    name: '세종문화회관',
    category: FACILITY_CATEGORIES.CULTURE,
    position: { lat: 37.5720, lng: 126.9794 },
    address: '서울특별시 중구 세종대로 175',
    congestionLevel: 'high',
    distance: 0.8,
    isReservable: true,
    operatingHours: '09:00-18:00',
    rating: 4.6,
    description: '서울시 대표 문화예술 공연장'
  },
  {
    id: '3',
    name: '국립중앙도서관',
    category: FACILITY_CATEGORIES.LIBRARY,
    position: { lat: 37.5063, lng: 127.0366 },
    address: '서울특별시 서초구 반포대로 201',
    congestionLevel: 'low',
    distance: 2.1,
    isReservable: false,
    operatingHours: '09:00-18:00',
    rating: 4.4,
    description: '국내 최대 규모의 국립도서관'
  },
  {
    id: '4',
    name: '광화문 맛집거리',
    category: FACILITY_CATEGORIES.RESTAURANT, // 'food' → 'restaurant'로 수정
    position: { lat: 37.5663, lng: 126.9779 },
    address: '서울특별시 중구 세종대로 일대',
    congestionLevel: 'high',
    distance: 0.3,
    isReservable: false,
    operatingHours: '11:00-22:00',
    rating: 4.1,
    description: '전통과 현대가 어우러진 맛집 밀집지역'
  },
  {
    id: '5',
    name: '남산공원',
    category: FACILITY_CATEGORIES.PARK,
    position: { lat: 37.5538, lng: 126.9810 },
    address: '서울특별시 중구 회현동1가 100-177',
    congestionLevel: 'medium',
    distance: 1.5,
    isReservable: false,
    operatingHours: '24시간',
    rating: 4.5,
    description: '서울 도심 속 대표적인 자연휴식공간'
  }
];

// 기본 사용자 선호도 (모든 시설 타입 활성화)
const DEFAULT_PREFERENCES: UserPreferences = {
  [FACILITY_CATEGORIES.SPORTS]: true,
  [FACILITY_CATEGORIES.CULTURE]: true,
  [FACILITY_CATEGORIES.RESTAURANT]: true,
  [FACILITY_CATEGORIES.LIBRARY]: true,
  [FACILITY_CATEGORIES.PARK]: true,
};

export interface UseFacilitiesOptions {
  initialPreferences?: UserPreferences;
  facilities?: Facility[];
}

export const useFacilities = (options: UseFacilitiesOptions = {}) => {
  const { 
    initialPreferences = DEFAULT_PREFERENCES,
    facilities: externalFacilities 
  } = options;

  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [facilities] = useState<Facility[]>(externalFacilities || SAMPLE_FACILITIES);

  // 활성화된 카테고리 목록 (메모화)
  const enabledCategories = useMemo(() => 
    Object.entries(preferences)
      .filter(([_, enabled]) => enabled)
      .map(([category]) => category as FacilityCategory),
    [preferences]
  );

  // 표시할 시설 필터링 (메모화)
  const visibleFacilities = useMemo(() =>
    facilities.filter(facility =>
      preferences[facility.category]
    ),
    [facilities, preferences]
  );

  // 특정 시설 카테고리 토글
  const toggleCategory = useCallback((category: FacilityCategory) => {
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  // 모든 시설 카테고리 활성화/비활성화
  const toggleAllCategories = useCallback((enabled: boolean) => {
    setPreferences(prev => {
      const newPreferences: UserPreferences = {} as UserPreferences;
      Object.keys(prev).forEach(key => {
        newPreferences[key as FacilityCategory] = enabled;
      });
      return newPreferences;
    });
  }, []);

  // 특정 카테고리만 활성화 (나머지는 비활성화)
  const showOnlyCategory = useCallback((category: FacilityCategory) => {
    setPreferences(prev => {
      const newPreferences: UserPreferences = {} as UserPreferences;
      Object.keys(prev).forEach(key => {
        newPreferences[key as FacilityCategory] = key === category;
      });
      return newPreferences;
    });
  }, []);

  // 선호도 전체 설정
  const setAllPreferences = useCallback((newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
  }, []);

  // 시설 검색 (이름, 주소, 설명 기준)
  const searchFacilities = useCallback((query: string): Facility[] => {
    if (!query.trim()) return visibleFacilities;
    
    const lowerQuery = query.toLowerCase();
    return visibleFacilities.filter(facility =>
      facility.name.toLowerCase().includes(lowerQuery) ||
      facility.address.toLowerCase().includes(lowerQuery) ||
      facility.description?.toLowerCase().includes(lowerQuery)
    );
  }, [visibleFacilities]);

  // 거리순 정렬된 시설 목록
  const facilitiesByDistance = useMemo(() => 
    [...visibleFacilities].sort((a, b) => (a.distance || 0) - (b.distance || 0)),
    [visibleFacilities]
  );

  // 평점순 정렬된 시설 목록
  const facilitiesByRating = useMemo(() => 
    [...visibleFacilities].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
    [visibleFacilities]
  );

  // 혼잡도별 시설 목록
  const facilitiesByCongest = useMemo(() => {
    const congestionOrder = { 'low': 0, 'medium': 1, 'high': 2 };
    return [...visibleFacilities].sort((a, b) => 
      congestionOrder[a.congestionLevel] - congestionOrder[b.congestionLevel]
    );
  }, [visibleFacilities]);

  // 카테고리별 시설 개수
  const facilityCountByCategory = useMemo(() => {
    const counts: Record<FacilityCategory, number> = {} as Record<FacilityCategory, number>;
    
    // 모든 카테고리를 0으로 초기화
    Object.values(FACILITY_CATEGORIES).forEach(category => {
      counts[category] = 0;
    });
    
    // 실제 시설 개수 계산
    facilities.forEach(facility => {
      counts[facility.category]++;
    });
    
    return counts;
  }, [facilities]);

  // 특정 카테고리의 시설만 반환
  const getFacilitiesByCategory = useCallback((category: FacilityCategory): Facility[] => {
    return facilities.filter(facility => facility.category === category);
  }, [facilities]);

  // 특정 ID로 시설 찾기
  const getFacilityById = useCallback((id: string): Facility | undefined => {
    return facilities.find(facility => facility.id === id);
  }, [facilities]);

  // 활성화된 카테고리 개수
  const enabledCategoryCount = useMemo(() => 
    enabledCategories.length,
    [enabledCategories]
  );

  return {
    // 상태
    preferences,
    facilities,
    visibleFacilities,
    enabledCategories,
    enabledCategoryCount,
    
    // 정렬된 목록
    facilitiesByDistance,
    facilitiesByRating,
    facilitiesByCongest,
    
    // 통계
    facilityCountByCategory,
    
    // 액션
    toggleCategory,
    toggleAllCategories,
    showOnlyCategory,
    setAllPreferences,
    
    // 유틸리티 함수
    searchFacilities,
    getFacilitiesByCategory,
    getFacilityById,
  };
};