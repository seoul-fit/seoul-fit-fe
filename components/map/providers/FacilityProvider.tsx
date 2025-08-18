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
import { usePOI } from '@/hooks/usePOI';
import { convertPOIToFacility } from '@/services/poi';
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
  
  // 위치 관련
  currentLocation: { lat: number; lng: number };
  
  // 액션 메서드
  selectFacility: (facility: Facility | null) => void;
  selectCluster: (cluster: ClusteredFacility | null) => void;
  toggleCategory: (category: FacilityCategory) => void;
  refreshFacilities: () => Promise<void>;
  searchFacilities: (query: string) => Promise<Facility[]>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  
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
  const { pois, loading: poisLoading, error: poisError, fetchNearbyPOIs } = usePOI();

  // Debug POI hook
  console.log('[FacilityProvider] POI hook state:', { 
    poisCount: pois?.length || 0, 
    poisLoading, 
    poisError,
    hasFetchFunction: !!fetchNearbyPOIs 
  });

  // 위치 기반 실시간 데이터 로딩 상태
  const [currentLocation, setCurrentLocation] = React.useState<{ lat: number; lng: number }>({
    lat: 37.5665,
    lng: 126.9780
  });
  const lastLoadedLocationRef = React.useRef<{ lat: number; lng: number } | null>(null);

  // 위치 기반 데이터 로딩 함수
  const loadLocationBasedData = React.useCallback(async (lat: number, lng: number) => {
    try {
      console.log(`위치 기반 데이터 로딩: (${lat}, ${lng})`);
      
      // 위치 기반 데이터만 업데이트 (전체 데이터는 한번만 로딩)
      const promises = [];
      
      // POI 데이터 로딩 (서울 120장소) - 최우선 실행
      if (fetchNearbyPOIs) {
        console.log(`[FacilityProvider] POI 데이터 로딩 시작: (${lat}, ${lng})`);
        promises.push(
          fetchNearbyPOIs(lat, lng, 1.5).catch(err => {
            console.error('POI 데이터 로딩 실패:', err);
            return [];
          })
        );
      } else {
        console.warn('[FacilityProvider] fetchNearbyPOIs 함수가 없습니다!');
      }
      
      if (fetchCulturalSpaces) {
        promises.push(fetchCulturalSpaces(lat, lng).catch(err => console.error('문화공간 데이터 로딩 실패:', err)));
      }
      
      if (fetchRestaurants) {
        promises.push(fetchRestaurants(lat, lng).catch(err => console.error('맛집 데이터 로딩 실패:', err)));
      }
      
      if (fetchCoolingShelters) {
        promises.push(fetchCoolingShelters(lat, lng).catch(err => console.error('무더위쉼터 데이터 로딩 실패:', err)));
      }
      
      await Promise.all(promises);
      
      lastLoadedLocationRef.current = { lat, lng };
      console.log('위치 기반 데이터 로딩 완료 (POI 포함)');
    } catch (error) {
      console.error('위치 기반 데이터 로딩 실패:', error);
    }
  }, [fetchCulturalSpaces, fetchRestaurants, fetchCoolingShelters, fetchNearbyPOIs]);

  // 컴포넌트 마운트 시 초기 데이터 로딩
  useEffect(() => {
    console.log('[FacilityProvider] useEffect 트리거됨');
    const loadInitialData = async () => {
      try {
        console.log('초기 시설 데이터 로딩 시작...');
        
        // 전체 데이터 로딩 (한번만)
        const globalPromises = [];
        
        if (fetchAllParksData) {
          console.log('[FacilityProvider] 공원 데이터 로딩 시작');
          globalPromises.push(fetchAllParksData(0, 1000).catch(err => console.error('공원 데이터 로딩 실패:', err)));
        }
        
        if (fetchAllLibrariesData) {
          console.log('[FacilityProvider] 도서관 데이터 로딩 시작');
          globalPromises.push(fetchAllLibrariesData(0, 1000).catch(err => console.error('도서관 데이터 로딩 실패:', err)));
        }
        
        await Promise.all(globalPromises);
        console.log('[FacilityProvider] 전체 데이터 로딩 완료');
        
        // 초기 위치 기반 데이터 로딩
        console.log('[FacilityProvider] 위치 기반 데이터 로딩 시작...');
        await loadLocationBasedData(currentLocation.lat, currentLocation.lng);
        
        console.log('모든 초기 시설 데이터 로딩 완료');
      } catch (error) {
        console.error('초기 시설 데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, [
    fetchAllParksData,
    fetchAllLibrariesData,
    loadLocationBasedData
  ]);

  // 선택 상태 관리
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [selectedCluster, setSelectedCluster] = React.useState<ClusteredFacility | null>(null);

  // 활성 카테고리 계산 (기본적으로 모든 카테고리 활성화)
  const activeCategories = useMemo(() => {
    if (!userPreferences) {
      // 사용자 설정이 없으면 모든 카테고리를 기본 활성화
      return ['sports', 'culture', 'restaurant', 'library', 'park', 'subway', 'bike', 'cooling_shelter', 'cultural_event', 'cultural_reservation'] as FacilityCategory[];
    }
    return userPreferences.preferredCategories || [];
  }, [userPreferences]);

  // 모든 시설 데이터 통합
  const facilities = useMemo(() => {
    const combined: Facility[] = [];
    
    // 기본 시설들
    combined.push(...allFacilities);
    
    // POI 데이터를 Facility로 변환하여 추가 (서울 120장소)
    if (pois && pois.length > 0) {
      const convertedPOIs = pois
        .map(poi => convertPOIToFacility(poi))
        .filter((facility): facility is Facility => facility !== null);
      
      combined.push(...convertedPOIs);
      console.log(`[FacilityProvider] POI 마커 추가: ${convertedPOIs.length}개`);
    }
    
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
    pois, // POI 데이터 의존성 추가
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
           subwayLoading ||
           poisLoading; // POI 로딩 상태 추가
  }, [
    facilitiesLoading,
    parksLoading,
    librariesLoading,
    culturalLoading,
    restaurantsLoading,
    coolingSheltersLoading,
    subwayLoading,
    poisLoading, // POI 로딩 상태 의존성 추가
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
    // 디버깅 로그 추가
    console.log(`[FacilityProvider] 필터링: 전체 시설 ${facilities.length}개, 활성 카테고리:`, activeCategories);
    
    if (activeCategories.length === 0) {
      console.log(`[FacilityProvider] 모든 시설 반환: ${facilities.length}개`);
      return facilities;
    }
    
    const filtered = facilities.filter(facility => 
      activeCategories.includes(facility.category)
    );
    
    console.log(`[FacilityProvider] 필터링된 시설: ${filtered.length}개`);
    return filtered;
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

  // 위치 업데이트 함수 (실시간 데이터 로딩)
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    // 이전 위치와 너무 가까우면 업데이트하지 않음 (성능 최적화)
    const lastLocation = lastLoadedLocationRef.current;
    if (lastLocation) {
      const distance = calculateDistance(
        { lat, lng }, 
        { lat: lastLocation.lat, lng: lastLocation.lng }
      );
      if (distance < 0.5) { // 0.5km 이내면 스킵
        return;
      }
    }

    setCurrentLocation({ lat, lng });
    await loadLocationBasedData(lat, lng);
  }, [loadLocationBasedData]);

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
    
    // 위치 관련
    currentLocation,
    
    // 액션 메서드
    selectFacility,
    selectCluster,
    toggleCategory,
    refreshFacilities,
    searchFacilities,
    updateLocation,
    
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
    currentLocation,
    selectFacility,
    selectCluster,
    toggleCategory,
    refreshFacilities,
    searchFacilities,
    updateLocation,
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
