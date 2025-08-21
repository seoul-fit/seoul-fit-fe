/**
 * @fileoverview 시설 데이터 컨텍스트 프로바이더
 * @description 시설 데이터와 관련 상태를 관리하는 컨텍스트 프로바이더
 * @author Seoul Fit Team
 * @since 2.0.0
 */

'use client';

import React, { createContext, useContext, useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useFacilities } from '@/shared/lib/hooks/useFacilities';
import { useParks } from '@/shared/lib/hooks/useParks';
import { useLibraries } from '@/shared/lib/hooks/useLibraries';
import { useCulturalSpaces } from '@/shared/lib/hooks/useCulturalSpaces';
import { useRestaurants } from '@/shared/lib/hooks/useRestaurants';
import { useCoolingShelter } from '@/shared/lib/hooks/useCoolingShelter';
import { useSubwayStations } from '@/shared/lib/hooks/useSubwayStations';
import { usePOI } from '@/shared/lib/hooks/usePOI';
import { useBikeStations } from '@/shared/lib/hooks/useBikeStations';
import { useSportsFacilities } from '@/shared/lib/hooks/useSportsFacilities';
import { useRestaurantFacilities } from '@/shared/lib/hooks/useRestaurantFacilities';
import { convertPOIToFacility } from '@/shared/api/poi';
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
  onPreferenceChange: _onPreferenceChange,
  onFacilitySelect,
  onClusterSelect,
  children,
}: FacilityProviderProps) {
  // console.log('[FacilityProvider] 렌더링 시작'); // 반복 로그 제거
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
  const { facilities: coolingShelters, isLoading: coolingSheltersLoading, fetchCoolingShelters } = useCoolingShelter();
  const { subwayStations, loading: subwayLoading } = useSubwayStations();
  const { pois, loading: poisLoading, error: _poisError, fetchNearbyPOIs } = usePOI();
  const { facilities: bikeStations, loading: bikeLoading, fetchBikeStations } = useBikeStations();
  const { sportsFacilities, loading: sportsLoading, fetchSportsFacilities } = useSportsFacilities();
  const { restaurants: restaurantFacilities, loading: restaurantsLoading, fetchRestaurants } = useRestaurantFacilities();

  // Debug POI hook
  // console.log('[FacilityProvider] POI hook state:', { 
  //   poisCount: pois?.length || 0, 
  //   poisLoading, 
  //   poisError,
  //   hasFetchFunction: !!fetchNearbyPOIs 
  // }); // 반복 로그 제거

  // 위치 기반 실시간 데이터 로딩 상태
  const [currentLocation, setCurrentLocation] = React.useState<{ lat: number; lng: number }>({
    lat: 37.5665,
    lng: 126.9780
  });
  const lastLoadedLocationRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const hasLoggedFacilitiesRef = React.useRef(false);

  // 위치 기반 데이터 로딩 함수 (줌 레벨에 따른 반경 조정)
  const loadLocationBasedData = useCallback(async (lat: number, lng: number, zoomLevel?: number) => {
    try {
      // 줌 레벨에 따른 로딩 반경 설정 (km)
      let radius = 2.0; // 기본값
      
      if (zoomLevel !== undefined) {
        // 줌 레벨별 적절한 반경 설정
        const radiusMap: Record<number, number> = {
          1: 0.1,   // 20m
          2: 0.15,  // 30m
          3: 0.25,  // 50m
          4: 0.5,   // 100m
          5: 1.0,   // 250m
          6: 2.0,   // 500m
          7: 3.0,   // 1km
          8: 5.0,   // 2km
          9: 8.0,   // 4km
          10: 12.0, // 8km
          11: 20.0, // 16km
          12: 30.0, // 32km
          13: 50.0, // 64km
          14: 100.0 // 128km
        };
        radius = radiusMap[zoomLevel] || 2.0;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`위치 기반 데이터 로딩: (${lat}, ${lng}), 반경: ${radius}km`);
      }
      
      // 위치 기반 데이터만 업데이트 (전체 데이터는 한번만 로딩)
      const promises = [];
      
      // 병렬로 데이터 로드 (빠른 응답을 위해)
      // POI 데이터 로딩 (서울 120장소)
      if (fetchNearbyPOIs) {
        promises.push(
          fetchNearbyPOIs(lat, lng, radius).catch(err => {
            console.error('POI 데이터 로딩 실패:', err);
            return [];
          })
        );
      }
      
      // 따릉이 데이터 로딩
      if (fetchBikeStations) {
        promises.push(
          fetchBikeStations(lat, lng, Math.min(radius, 5.0)).catch(err => { // 최대 5km
            console.error('따릉이 데이터 로딩 실패:', err);
            return [];
          })
        );
      }
      
      if (fetchCulturalSpaces) {
        promises.push(fetchCulturalSpaces(lat, lng).catch(err => console.error('문화공간 데이터 로딩 실패:', err)));
      }
      
      if (fetchCoolingShelters) {
        promises.push(fetchCoolingShelters(lat, lng).catch(err => console.error('무더위쉼터 데이터 로딩 실패:', err)));
      }
      
      // 체육시설 데이터 로딩
      if (fetchSportsFacilities) {
        promises.push(
          fetchSportsFacilities(lat, lng, radius).catch(err => {
            console.error('체육시설 데이터 로딩 실패:', err);
            return [];
          })
        );
      }
      
      // 음식점 데이터 로딩
      if (fetchRestaurants) {
        promises.push(
          fetchRestaurants(lat, lng).catch(err => {
            console.error('음식점 데이터 로딩 실패:', err);
            return [];
          })
        );
      }
      
      await Promise.all(promises);
      
      lastLoadedLocationRef.current = { lat, lng };
      console.log('위치 기반 데이터 로딩 완료');
    } catch (error) {
      console.error('위치 기반 데이터 로딩 실패:', error);
    }
  }, [fetchCulturalSpaces, fetchCoolingShelters, fetchNearbyPOIs, fetchBikeStations, fetchSportsFacilities, fetchRestaurants]);

  // 컴포넌트 마운트 시 초기 데이터 로딩 (한번만 실행)
  useEffect(() => {
    console.log('[FacilityProvider] 초기 데이터 로딩 시작');
    const loadInitialData = async () => {
      try {
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
        
        // 초기 위치 기반 데이터는 로드하지 않음
        // 실제 사용자 위치가 확인되면 MapView에서 updateLocation을 호출할 것임
        console.log('[FacilityProvider] 사용자 위치 확인 대기 중...');
        
        console.log('모든 초기 시설 데이터 로딩 완료');
      } catch (error) {
        console.error('초기 시설 데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 선택 상태 관리
  const [selectedFacility, setSelectedFacility] = React.useState<Facility | null>(null);
  const [selectedCluster, setSelectedCluster] = React.useState<ClusteredFacility | null>(null);

  // 활성 카테고리 상태 관리
  const [activeCategories, setActiveCategories] = useState<FacilityCategory[]>(() => {
    // userPreferences에서 초기값 설정
    if (userPreferences?.preferredCategories && userPreferences.preferredCategories.length > 0) {
      console.log('[FacilityProvider] 사용자 선호 카테고리로 초기화:', userPreferences.preferredCategories);
      return userPreferences.preferredCategories;
    }
    // 기본값: 주요 카테고리 활성화 (체육시설, 음식점 포함)
    const defaultCategories = ['subway', 'bike', 'library', 'park', 'cooling_shelter', 'culture', 'cultural_event', 'cultural_reservation', 'sports', 'restaurant'] as FacilityCategory[];
    console.log('[FacilityProvider] 기본 카테고리로 초기화:', defaultCategories);
    return defaultCategories;
  });
  
  // userPreferences가 변경될 때 activeCategories 업데이트
  useEffect(() => {
    if (userPreferences?.preferredCategories) {
      setActiveCategories(userPreferences.preferredCategories);
    }
  }, [userPreferences?.preferredCategories]);

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
    }
    
    // 각 카테고리별 시설들 추가
    if (parks && parks.length > 0) {
      // 첫 번째 공원 데이터 구조 확인 (디버깅용)
      console.log('[FacilityProvider] 공원 데이터 샘플:', parks[0]);
      
      combined.push(...parks.map((p, index) => {
        // Park 타입이 이미 position을 가지고 있는지 확인
        const park = p as any;
        
        // latitude/longitude가 있는 경우 우선 사용
        let position;
        if (park.latitude !== undefined && park.longitude !== undefined) {
          position = { 
            lat: parseFloat(String(park.latitude)) || 0, 
            lng: parseFloat(String(park.longitude)) || 0 
          };
        } else if (park.lat !== undefined && park.lng !== undefined) {
          position = { 
            lat: parseFloat(String(park.lat)) || 0, 
            lng: parseFloat(String(park.lng)) || 0 
          };
        } else if (park.position) {
          position = park.position;
        } else {
          console.warn('[FacilityProvider] 공원 좌표 없음:', park.name);
          position = { lat: 0, lng: 0 };
        }
        
        // 첫 3개 공원의 좌표 변환 확인
        if (index < 3) {
          console.log('[FacilityProvider] 공원 좌표 변환:', {
            이름: park.name,
            원본: { latitude: park.latitude, longitude: park.longitude, lat: park.lat, lng: park.lng, position: park.position },
            변환: position
          });
        }
        
        // 필수 필드 설정
        const facilityData = {
          ...park,
          id: park.id || `park_${index}`,
          name: park.name || '이름 없음',
          address: park.address || '',
          position,
          category: 'park' as const,
          congestionLevel: 'low' as const
        };
        
        return facilityData;
      }));
    }
    if (libraries && libraries.length > 0) {
      // 첫 번째 도서관 데이터 구조 확인 (디버깅용)
      console.log('[FacilityProvider] 도서관 데이터 샘플:', libraries[0]);
      
      combined.push(...libraries.map((l, index) => {
        // Library 타입이 이미 position을 가지고 있는지 확인
        const library = l as any;
        
        // 다양한 좌표 필드 확인
        let position;
        if (library.xcnts !== undefined && library.ydnts !== undefined) {
          // xcnts는 위도(lat), ydnts는 경도(lng)
          position = { 
            lat: parseFloat(String(library.xcnts)) || 0, 
            lng: parseFloat(String(library.ydnts)) || 0 
          };
        } else if (library.latitude !== undefined && library.longitude !== undefined) {
          position = { 
            lat: parseFloat(String(library.latitude)) || 0, 
            lng: parseFloat(String(library.longitude)) || 0 
          };
        } else if (library.lat !== undefined && library.lng !== undefined) {
          position = { 
            lat: parseFloat(String(library.lat)) || 0, 
            lng: parseFloat(String(library.lng)) || 0 
          };
        } else if (library.position) {
          position = library.position;
        } else {
          console.warn('[FacilityProvider] 도서관 좌표 없음:', library.lbrryName || library.name);
          position = { lat: 0, lng: 0 };
        }
        
        // 첫 3개 도서관의 좌표 변환 확인
        if (index < 3) {
          console.log('[FacilityProvider] 도서관 좌표 변환:', {
            이름: library.lbrryName || library.name,
            원본: { xcnts: library.xcnts, ydnts: library.ydnts, latitude: library.latitude, longitude: library.longitude, position: library.position },
            변환: position
          });
        }
        
        // name 필드 설정 (lbrryName 우선)
        const facilityData = {
          ...library,
          id: library.id || `library_${library.lbrrySeqNo || index}`,
          name: library.lbrryName || library.name || '이름 없음',
          address: library.adres || library.address || '',
          position,
          category: 'library' as const,
          congestionLevel: 'low' as const
        };
        
        return facilityData;
      }));
    }
    if (culturalSpaces) {
      combined.push(...culturalSpaces.map(cs => ({
        ...cs,
        position: { lat: cs.lat, lng: cs.lng },
        category: 'culture' as const,
        congestionLevel: 'low' as const
      })));
    }
    if (coolingShelters) combined.push(...coolingShelters);
    if (subwayStations) combined.push(...subwayStations);
    
    // 따릉이 스테이션 추가
    if (bikeStations && bikeStations.length > 0) {
      combined.push(...bikeStations);
    }
    
    // 체육시설 추가
    if (sportsFacilities && sportsFacilities.length > 0) {
      combined.push(...sportsFacilities);
    }
    
    // 음식점 추가
    if (restaurantFacilities && restaurantFacilities.length > 0) {
      combined.push(...restaurantFacilities);
    }
    
    // 디버깅용 로그 (최초 1회만)
    if (combined.length > 0 && !hasLoggedFacilitiesRef.current) {
      hasLoggedFacilitiesRef.current = true;
      console.log('[FacilityProvider] 시설 데이터 통합 완료:', {
        total: combined.length,
        pois: pois?.length || 0,
        parks: parks?.length || 0,
        libraries: libraries?.length || 0,
        culturalSpaces: culturalSpaces?.length || 0,
        coolingShelters: coolingShelters?.length || 0,
        subwayStations: subwayStations?.length || 0,
        bikeStations: bikeStations?.length || 0,
        sportsFacilities: sportsFacilities?.length || 0,
        restaurants: restaurantFacilities?.length || 0
      });
    }
    
    return combined;
  }, [
    allFacilities,
    pois, // POI 데이터 의존성 추가
    parks,
    libraries,
    culturalSpaces,
    coolingShelters,
    subwayStations,
    bikeStations, // 따릉이 데이터 의존성 추가
    sportsFacilities, // 체육시설 데이터 의존성 추가
    restaurantFacilities, // 음식점 데이터 의존성 추가
  ]);

  // 클러스터된 시설 데이터 (임시로 빈 배열)
  const clusteredFacilities = useMemo<ClusteredFacility[]>(() => {
    // TODO: 실제 클러스터링 로직 구현
    return [];
  }, []);

  // 로딩 상태 통합
  const loading = useMemo(() => {
    return facilitiesLoading || 
           parksLoading || 
           librariesLoading || 
           culturalLoading || 
           restaurantsLoading || 
           coolingSheltersLoading || 
           subwayLoading ||
           poisLoading || // POI 로딩 상태 추가
           sportsLoading || // 체육시설 로딩 상태 추가
           bikeLoading; // 따릉이 로딩 상태 추가
  }, [
    facilitiesLoading,
    parksLoading,
    librariesLoading,
    culturalLoading,
    restaurantsLoading,
    coolingSheltersLoading,
    subwayLoading,
    poisLoading, // POI 로딩 상태 의존성 추가
    sportsLoading, // 체육시설 로딩 상태 의존성 추가
    bikeLoading, // 따릉이 로딩 상태 의존성 추가
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
    console.log('[FacilityProvider] toggleCategory 호출됨:', category);
    console.log('[FacilityProvider] 현재 activeCategories:', activeCategories);
    
    // 로컬 상태 업데이트 (맵 마커 표시/숨김용)
    setActiveCategories(prev => {
      const isActive = prev.includes(category);
      const newCategories = isActive 
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      console.log(`[카테고리 토글] ${category}: ${!isActive ? '활성화' : '비활성화'}`);
      console.log('[FacilityProvider] 새로운 activeCategories:', newCategories);
      return newCategories;
    });
    
    // 주의: onPreferenceChange는 사이드바에서만 호출해야 함
    // 맵 토글 버튼에서는 호출하지 않음 (백엔드 업데이트 방지)
  }, [activeCategories]);

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

  // 필터링된 시설 가져오기 (카테고리 필터링만)
  const getFilteredFacilities = useCallback(() => {
    // 초기 로드 중이면 빈 배열 반환
    if (facilities.length === 0) {
      console.log('[FacilityProvider] getFilteredFacilities: 시설 데이터 없음');
      return [];
    }
    
    // activeCategories가 비어있으면 기본 카테고리 반환
    if (activeCategories.length === 0) {
      console.log('[FacilityProvider] getFilteredFacilities: activeCategories 비어있음, 기본 카테고리로 필터링');
      // 기본 카테고리로 필터링 (sports, restaurant 포함)
      const defaultCategories = ['subway', 'bike', 'library', 'park', 'cooling_shelter', 'culture', 'cultural_event', 'cultural_reservation', 'sports', 'restaurant'];
      const filtered = facilities.filter(facility => 
        defaultCategories.includes(facility.category)
      );
      console.log(`[FacilityProvider] 기본 카테고리 필터링 결과: ${filtered.length}개`);
      return filtered;
    }
    
    const filtered = facilities.filter(facility => 
      activeCategories.includes(facility.category)
    );
    
    console.log(`[FacilityProvider] getFilteredFacilities 결과: ${filtered.length}개 (activeCategories: ${activeCategories.join(', ')})`);
    
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
  const updateLocationInternal = useCallback(async (lat: number, lng: number, forceUpdate: boolean = false) => {
    // 강제 업데이트가 아닌 경우에만 거리 체크
    if (!forceUpdate) {
      // 이전 위치와 너무 가까우면 업데이트하지 않음 (성능 최적화)
      const lastLocation = lastLoadedLocationRef.current;
      if (lastLocation) {
        const distance = calculateDistance(
          { lat, lng }, 
          { lat: lastLocation.lat, lng: lastLocation.lng }
        );
        if (distance < 0.3) { // 0.3km 이내면 스킵 (더 정확하게)
          console.log(`[FacilityProvider] 위치 업데이트 스킵 (거리: ${distance.toFixed(2)}km)`);
          return;
        }
      }
    }

    console.log(`[FacilityProvider] 위치 업데이트: (${lat}, ${lng})`); 
    setCurrentLocation({ lat, lng });
    await loadLocationBasedData(lat, lng);
  }, [loadLocationBasedData]);
  
  // 외부에서 사용할 updateLocation (처음 호출 시에는 forceUpdate=true)
  const hasLocationUpdatedRef = useRef(false);
  const updateLocation = useCallback(async (lat: number, lng: number, manualForce?: boolean) => {
    // 첫 번째 호출이거나 수동 강제 업데이트면 강제 업데이트
    const forceUpdate = manualForce || !hasLocationUpdatedRef.current;
    if (forceUpdate) {
      hasLocationUpdatedRef.current = true;
      console.log(`[FacilityProvider] 강제 위치 업데이트: (${lat}, ${lng})`);
    }
    await updateLocationInternal(lat, lng, forceUpdate);
  }, [updateLocationInternal]);

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

  // console.log('[FacilityProvider] Context 값:', {
  //   activeCategories,
  //   toggleCategory: !!toggleCategory,
  //   facilitiesCount: facilities.length
  // }); // 반복 로그 제거
  
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
