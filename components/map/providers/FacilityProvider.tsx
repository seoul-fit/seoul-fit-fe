/**
 * @fileoverview 시설 데이터 컨텍스트 프로바이더
 * @description 시설 데이터와 관련 상태를 관리하는 컨텍스트 프로바이더
 * @author Seoul Fit Team
 * @since 2.0.0
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useFacilities } from '@/hooks/useFacilities';
import { useParks } from '@/hooks/useParks';
import { useLibraries } from '@/hooks/useLibraries';
import { useCulturalSpaces } from '@/hooks/useCulturalSpaces';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useCoolingShelter } from '@/hooks/useCoolingShelter';
import { useSubwayStations } from '@/hooks/useSubwayStations';
import { useMapContext } from './MapProvider';
import type { 
  Facility, 
  ClusteredFacility, 
  FacilityCategory, 
  UserPreferences,
  Position 
} from '@/lib/types';

// 시설 컨텍스트 타입 정의
interface FacilityContextValue {
  // 시설 데이터
  facilities: Facility[];
  clusteredFacilities: ClusteredFacility[];
  
  // 로딩 상태
  loading: boolean;
  error: string | null;
  
  // 선택된 시설
  selectedFacility: Facility | null;
  selectedCluster: ClusteredFacility | null;
  
  // 필터링
  activeCategories: FacilityCategory[];
  userPreferences: UserPreferences | null;
  
  // 액션 메서드
  selectFacility: (facility: Facility | null) => void;
  selectCluster: (cluster: ClusteredFacility | null) => void;
  toggleCategory: (category: FacilityCategory) => void;
  refreshFacilities: () => Promise<void>;
  searchFacilities: (query: string) => Promise<Facility[]>;
  
  // 필터링된 데이터
  getFilteredFacilities: () => Facility[];
  getFacilitiesByCategory: (category: FacilityCategory) => Facility[];
  getNearbyFacilities: (position: Position, radius: number) => Facility[];
}

// 컨텍스트 생성
const FacilityContext = createContext<FacilityContextValue | null>(null);

// 시설 프로바이더 Props
interface FacilityProviderProps {
  /** 사용자 선호도 */
  userPreferences?: UserPreferences;
  /** 선호도 변경 핸들러 */
  onPreferenceChange?: (category: FacilityCategory) => void;
  /** 시설 선택 핸들러 */
  onFacilitySelect?: (facility: Facility | null) => void;
  /** 클러스터 선택 핸들러 */
  onClusterSelect?: (cluster: ClusteredFacility | null) => void;
  /** 자식 컴포넌트 */
  children: React.ReactNode;
}

/**
 * 시설 데이터 컨텍스트 프로바이더 컴포넌트
 */
export function FacilityProvider({
  userPreferences,
  onPreferenceChange,
  onFacilitySelect,
  onClusterSelect,
  children,
}: FacilityProviderProps) {
  // 각종 시설 데이터 훅들 (지도 컨텍스트 의존성 제거하여 무한 루프 방지)
  const { 
    facilities: allFacilities, 
    loading: facilitiesLoading, 
    error: facilitiesError,
    refreshFacilities: refreshAllFacilities 
  } = useFacilities();

  const { parks, isLoading: parksLoading, fetchAllParksData } = useParks();
  const { libraries, isLoading: librariesLoading, fetchAllLibrariesData } = useLibraries();
  const { culturalSpaces, isLoading: culturalLoading, fetchCulturalSpaces } = useCulturalSpaces();
  const { restaurants, isLoading: restaurantsLoading, fetchRestaurants } = useRestaurants();
  const { facilities: coolingShelters, isLoading: coolingSheltersLoading, fetchCoolingShelters } = useCoolingShelter();
  const { subwayStations, loading: subwayLoading } = useSubwayStations();

  // 컴포넌트 마운트 시 모든 데이터 자동 로딩
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('시설 데이터 로딩 시작...');
        
        // 서울 중심 좌표 (기본값)
        const defaultLat = 37.5665;
        const defaultLng = 126.9780;
        
        // 병렬로 모든 데이터 로드 (존재하는 함수들만 호출)
        const promises = [];
        
        if (fetchAllParksData) {
          promises.push(fetchAllParksData(0, 1000).catch(err => console.error('공원 데이터 로딩 실패:', err)));
        }
        
        if (fetchAllLibrariesData) {
          promises.push(fetchAllLibrariesData(0, 1000).catch(err => console.error('도서관 데이터 로딩 실패:', err)));
        }
        
        if (fetchCulturalSpaces) {
          promises.push(fetchCulturalSpaces(defaultLat, defaultLng).catch(err => console.error('문화공간 데이터 로딩 실패:', err)));
        }
        
        if (fetchRestaurants) {
          promises.push(fetchRestaurants(defaultLat, defaultLng).catch(err => console.error('맛집 데이터 로딩 실패:', err)));
        }
        
        if (fetchCoolingShelters) {
          promises.push(fetchCoolingShelters(defaultLat, defaultLng).catch(err => console.error('무더위쉼터 데이터 로딩 실패:', err)));
        }
        
        await Promise.all(promises);
        
        console.log('모든 시설 데이터 로딩 완료');
      } catch (error) {
        console.error('시설 데이터 로딩 실패:', error);
      }
    };

    loadAllData();
  }, [
    fetchAllParksData,
    fetchAllLibrariesData, 
    fetchCulturalSpaces,
    fetchRestaurants,
    fetchCoolingShelters
  ]); // 함수 의존성 추가

  // 선택 상태 관리
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [selectedCluster, setSelectedCluster] = React.useState<ClusteredFacility | null>(null);

  // 활성 카테고리 계산
  const activeCategories = useMemo(() => {
    if (!userPreferences) return [];
    return userPreferences.preferredCategories || [];
  }, [userPreferences]);

  // 모든 시설 데이터 통합
  const facilities = useMemo(() => {
    const combined: Facility[] = [];
    
    // 기본 시설들
    combined.push(...allFacilities);
    
    // 각 카테고리별 시설들 추가
    if (parks) combined.push(...parks);
    if (libraries) combined.push(...libraries);
    if (culturalSpaces) combined.push(...culturalSpaces);
    if (restaurants) combined.push(...restaurants);
    if (coolingShelters) combined.push(...coolingShelters);
    if (subwayStations) combined.push(...subwayStations);
    
    return combined;
  }, [
    allFacilities,
    parks,
    libraries,
    culturalSpaces,
    restaurants,
    coolingShelters,
    subwayStations,
  ]);

  // 클러스터된 시설 데이터 (임시로 빈 배열)
  const clusteredFacilities = useMemo<ClusteredFacility[]>(() => {
    // TODO: 실제 클러스터링 로직 구현
    return [];
  }, [facilities]);

  // 로딩 상태 통합
  const loading = useMemo(() => {
    return facilitiesLoading || 
           parksLoading || 
           librariesLoading || 
           culturalLoading || 
           restaurantsLoading || 
           coolingSheltersLoading || 
           subwayLoading;
  }, [
    facilitiesLoading,
    parksLoading,
    librariesLoading,
    culturalLoading,
    restaurantsLoading,
    coolingSheltersLoading,
    subwayLoading,
  ]);

  // 시설 선택 핸들러
  const selectFacility = useCallback((facility: Facility | null) => {
    setSelectedFacility(facility);
    if (facility) {
      setSelectedCluster(null); // 시설 선택 시 클러스터 선택 해제
    }
    onFacilitySelect?.(facility);
  }, [onFacilitySelect]);

  // 클러스터 선택 핸들러
  const selectCluster = useCallback((cluster: ClusteredFacility | null) => {
    setSelectedCluster(cluster);
    if (cluster) {
      setSelectedFacility(null); // 클러스터 선택 시 시설 선택 해제
    }
    onClusterSelect?.(cluster);
  }, [onClusterSelect]);

  // 카테고리 토글 핸들러
  const toggleCategory = useCallback((category: FacilityCategory) => {
    onPreferenceChange?.(category);
  }, [onPreferenceChange]);

  // 시설 새로고침
  const refreshFacilities = useCallback(async () => {
    await refreshAllFacilities();
  }, [refreshAllFacilities]);

  // 시설 검색
  const searchFacilities = useCallback(async (query: string): Promise<Facility[]> => {
    // TODO: 실제 검색 로직 구현
    return facilities.filter(facility => 
      facility.name.toLowerCase().includes(query.toLowerCase()) ||
      facility.address.toLowerCase().includes(query.toLowerCase())
    );
  }, [facilities]);

  // 필터링된 시설 가져오기
  const getFilteredFacilities = useCallback(() => {
    if (activeCategories.length === 0) return facilities;
    
    return facilities.filter(facility => 
      activeCategories.includes(facility.category)
    );
  }, [facilities, activeCategories]);

  // 카테고리별 시설 가져오기
  const getFacilitiesByCategory = useCallback((category: FacilityCategory) => {
    return facilities.filter(facility => facility.category === category);
  }, [facilities]);

  // 근처 시설 가져오기
  const getNearbyFacilities = useCallback((position: Position, radius: number) => {
    return facilities.filter(facility => {
      const distance = calculateDistance(position, facility.position);
      return distance <= radius;
    });
  }, [facilities]);

  // 컨텍스트 값 메모이제이션
  const contextValue = useMemo<FacilityContextValue>(() => ({
    // 시설 데이터
    facilities,
    clusteredFacilities,
    
    // 로딩 상태
    loading,
    error: facilitiesError,
    
    // 선택된 시설
    selectedFacility,
    selectedCluster,
    
    // 필터링
    activeCategories,
    userPreferences: userPreferences || null,
    
    // 액션 메서드
    selectFacility,
    selectCluster,
    toggleCategory,
    refreshFacilities,
    searchFacilities,
    
    // 필터링된 데이터
    getFilteredFacilities,
    getFacilitiesByCategory,
    getNearbyFacilities,
  }), [
    facilities,
    clusteredFacilities,
    loading,
    facilitiesError,
    selectedFacility,
    selectedCluster,
    activeCategories,
    userPreferences,
    selectFacility,
    selectCluster,
    toggleCategory,
    refreshFacilities,
    searchFacilities,
    getFilteredFacilities,
    getFacilitiesByCategory,
    getNearbyFacilities,
  ]);

  return (
    <FacilityContext.Provider value={contextValue}>
      {children}
    </FacilityContext.Provider>
  );
}

/**
 * 시설 컨텍스트를 사용하는 훅
 * @returns 시설 컨텍스트 값
 * @throws FacilityProvider 외부에서 사용 시 에러
 */
export function useFacilityContext(): FacilityContextValue {
  const context = useContext(FacilityContext);
  
  if (!context) {
    throw new Error('useFacilityContext must be used within a FacilityProvider');
  }
  
  return context;
}

/**
 * 시설 데이터만 필요한 경우 사용하는 훅
 * @returns 시설 데이터와 로딩 상태
 */
export function useFacilityData() {
  const { facilities, loading, error } = useFacilityContext();
  return { facilities, loading, error };
}

/**
 * 시설 선택 관련 기능만 필요한 경우 사용하는 훅
 * @returns 선택 관련 상태와 메서드
 */
export function useFacilitySelection() {
  const { 
    selectedFacility, 
    selectedCluster, 
    selectFacility, 
    selectCluster 
  } = useFacilityContext();
  
  return {
    selectedFacility,
    selectedCluster,
    selectFacility,
    selectCluster,
  };
}

/**
 * 시설 필터링 관련 기능만 필요한 경우 사용하는 훅
 * @returns 필터링 관련 상태와 메서드
 */
export function useFacilityFilter() {
  const { 
    activeCategories, 
    toggleCategory, 
    getFilteredFacilities,
    getFacilitiesByCategory 
  } = useFacilityContext();
  
  return {
    activeCategories,
    toggleCategory,
    getFilteredFacilities,
    getFacilitiesByCategory,
  };
}

// 유틸리티 함수: 두 지점 간 거리 계산 (km)
function calculateDistance(pos1: Position, pos2: Position): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
