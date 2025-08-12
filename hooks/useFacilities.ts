// hooks/useFacilities.ts
import React, { useState, useMemo, useCallback } from 'react';
import { 
  FACILITY_CATEGORIES, 
  type FacilityCategory, 
  type Facility, 
  type UserPreferences 
} from '@/lib/types';

// 기본 사용자 선호도 (모든 시설 타입 활성화)
const DEFAULT_PREFERENCES: UserPreferences = {
  [FACILITY_CATEGORIES.SPORTS]: true,
  [FACILITY_CATEGORIES.CULTURE]: true,
  [FACILITY_CATEGORIES.RESTAURANT]: true,
  [FACILITY_CATEGORIES.LIBRARY]: true,
  [FACILITY_CATEGORIES.PARK]: true,
  [FACILITY_CATEGORIES.SUBWAY]: true,
  [FACILITY_CATEGORIES.BIKE]: true,
  [FACILITY_CATEGORIES.COOLING_SHELTER]: true,
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
  const [facilities, setFacilities] = useState<Facility[]>(externalFacilities || []);

  // externalFacilities가 변경되면 facilities 업데이트
  React.useEffect(() => {
    if (externalFacilities) {
      setFacilities(externalFacilities);
    }
  }, [externalFacilities]);

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