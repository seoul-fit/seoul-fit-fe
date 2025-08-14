// components/map/MapContainer.tsx - Improved version with better performance
'use client';

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// 컴포넌트들
import { MapView } from './MapView';
// import { useClusteredMarkers } from '@/hooks/useClusteredMarkers'; // 사용하지 않음
import { ClusterBottomSheet } from './ClusterBottomSheet';
import { FacilityBottomSheet } from './FacilityBottomSheet';

// Hooks
import { useLocation } from '@/hooks/useLocation';
import { useCongestion } from '@/hooks/useCongestion';
import { useWeather } from '@/hooks/useWeather';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { useCurrentLocationMarker } from '@/hooks/useCurrentLocationMarker';
import { usePOI } from '@/hooks/usePOI';
import { convertPOIToFacility } from '@/services/poi';
import { getNearbyBikeStations, convertBikeStationToFacility } from '@/services/bikeStation';
import { convertRestaurantToFacility } from '@/services/restaurant';
import { useCoolingShelter } from '@/hooks/useCoolingShelter';
import { useSubwayStations } from '@/hooks/useSubwayStations';
import { useParks } from '@/hooks/useParks';
import { useLibraries } from '@/hooks/useLibraries';
import { useCulturalSpaces } from '@/hooks/useCulturalSpaces';
import { useCulturalEvents } from '@/hooks/useCulturalEvents';
import { useCulturalReservations } from '@/hooks/useCulturalReservations';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useZoomLevel } from '@/hooks/useZoomLevel';
import { useSearchMarker } from '@/hooks/useSearchMarker';
import type { BikeStationData, UserPreferences, FacilityCategory, ClusteredFacility, Facility, KakaoLatLng } from '@/lib/types';
import type { SearchItem } from '@/hooks/useSearchCache';

interface MapContainerProps {
  className?: string;
  preferences?: UserPreferences;
  onPreferenceToggle?: (category: FacilityCategory) => void;
  onMapClick?: () => void;
  onLocationReset?: () => void;
}

export interface MapContainerRef {
  handleSearchSelect: (searchItem: SearchItem) => Promise<void>;
  handleSearchClear: () => void;
}

// 디바운싱 유틸리티
const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const MapContainer = React.forwardRef<MapContainerRef, MapContainerProps>(({ preferences, onPreferenceToggle, onMapClick, onLocationReset }, ref) => {
  // 선택된 시설 및 클러스터 상태
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<ClusteredFacility | null>(null);
  
  // selectedFacility가 변경될 때 selectedCluster 초기화
  useEffect(() => {
    if (selectedFacility) {
      setSelectedCluster(null);
    }
  }, [selectedFacility]);
  // 지도 인스턴스 생성
  const { mapInstance, mapStatus } = useKakaoMap({
    containerId: 'kakaoMap',
    center: { lat: 37.5665, lng: 126.9780 },
    level: 3
  });

  // 위치 관련 hooks
  const { currentLocation, moveToCurrentLocation, setCurrentLocation } = useLocation(mapInstance);
  
  // 줌 레벨 관련 hooks
  const { zoomInfo, isZooming, searchRadius } = useZoomLevel({ 
    mapInstance, 
    mapStatus 
  });

  // POI 관련 hooks
  const { pois, fetchNearbyPOIs } = usePOI();
  
  // 따릉이 대여소 상태
  const [bikeStations, setBikeStations] = useState<BikeStationData[]>([]);
  const [bikeError, setBikeError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 무더위 쉼터 상태 (위치 기반)
  const { facilities: coolingShelterFacilities, error: coolingShelterError, fetchCoolingShelters } = useCoolingShelter();

  // 지하철 상태 (전체 데이터 한 번만 로드)
  const { subwayStations: subwayFacilities, error: subwayError } = useSubwayStations();

  // 공원 상태
  const { parks, error: parksError, fetchParks } = useParks();
  
  // 도서관 상태
  const { libraries, error: librariesError, fetchLibraries } = useLibraries();
  
  // 문화공간 상태
  const { culturalSpaces, error: culturalSpacesError, fetchCulturalSpaces } = useCulturalSpaces();
  
  // 문화행사 상태
  const { culturalEvents, error: culturalEventsError, fetchCulturalEvents } = useCulturalEvents();
  
  // 문화예약 상태
  const { culturalReservations, error: culturalReservationsError, fetchCulturalReservations } = useCulturalReservations();
  
  // 맛집 상태
  const { restaurants, fetchRestaurants } = useRestaurants();

  // 검색 마커 상태
  const { searchMarker, searchError, selectSearchResult, clearSearchMarker } = useSearchMarker();

  // 마지막 데이터 로드 위치 추적
  const lastLoadedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // POI를 Facility로 변환 (지하철역 제외, 메모화)
  const facilitiesFromPOIs = useMemo(() => 
    pois.map(poi => convertPOIToFacility(poi)).filter(facility => facility !== null) as Facility[], 
    [pois]
  );
  
  const facilitiesFromBikes = useMemo(() => 
    bikeStations.map(station => convertBikeStationToFacility(station)), 
    [bikeStations]
  );
  
  // 공원을 Facility로 변환 (메모화)
  const facilitiesFromParks = useMemo(() => 
    parks.map(park => ({
      id: park.id.toString(),
      name: park.name,
      category: 'park' as const,
      position: {
        lat: park.latitude || 0,
        lng: park.longitude || 0
      },
      address: park.address || '',
      phone: park.adminTel,
      description: park.content,
      congestionLevel: 'low' as const,
      operatingHours: park.useReference,
      website: park.templateUrl,
      park: {
        area: park.area,
        openDate: park.openDate,
        mainEquipment: park.mainEquipment,
        mainPlants: park.mainPlants,
        zone: park.zone,
        managementDept: park.managementDept,
        imageUrl: park.imageUrl
      }
    })), 
    [parks]
  );
  
  // 도서관을 Facility로 변환 (메모화)
  const facilitiesFromLibraries = useMemo(() => 
    libraries.map(library => ({
      id: library.id?.toString() || Math.random().toString(),
      name: library.lbrryName || library.name || '도서관',
      category: 'library' as const,
      position: {
        lat: library.xcnts || library.latitude || 0,
        lng: library.ydnts || library.longitude || 0
      },
      address: library.adres || library.address || '',
      phone: library.telNo || library.phoneNumber,
      website: library.hmpgUrl || library.website,
      description: `${library.lbrrySeName || ''} | ${library.codeValue || ''}`.trim().replace(/^\|\s*|\s*\|$/g, ''),
      congestionLevel: 'low' as const,
      operatingHours: library.opTime || library.operatingHours,
      library: {
        closeDate: library.fdrmCloseDate,
        seqNo: library.lbrrySeqNo,
        guCode: library.guCode
      }
    })), 
    [libraries]
  );
  
  // 문화공간을 Facility로 변환 (메모화)
  const facilitiesFromCulturalSpaces = useMemo(() => 
    culturalSpaces.map(space => ({
      id: space.id?.toString() || Math.random().toString(),
      name: space.name || '문화공간',
      category: 'culture' as const,
      position: {
        lat: space.latitude || 0,
        lng: space.longitude || 0
      },
      address: space.address || '',
      phone: space.phone,
      description: space.description,
      congestionLevel: 'low' as const,
      operatingHours: space.operatingHours
    })), 
    [culturalSpaces]
  );
  
  // 문화행사를 Facility로 변환 (메모화)
  const facilitiesFromCulturalEvents = useMemo(() => 
    culturalEvents.map(event => ({
      id: event.id?.toString() || Math.random().toString(),
      name: event.title || '문화행사',
      category: 'cultural_event' as const,
      position: {
        lat: event.latitude || 0,
        lng: event.longitude || 0
      },
      address: `${event.place || ''} (${event.district || ''})`.trim(),
      phone: event.orgName ? `주최: ${event.orgName}` : undefined,
      description: `${event.codeName || ''} | ${event.useTarget || ''}`.trim().replace(/^\|\s*|\s*\|$/g, ''),
      congestionLevel: 'low' as const,
      operatingHours: event.eventDate || `${event.startDate} ~ ${event.endDate}`,
      website: event.orgLink || event.homepageAddr,
      // 문화행사 전용 정보
      culturalEvent: {
        codeName: event.codeName,
        district: event.district,
        eventDate: event.eventDate,
        startDate: event.startDate,
        endDate: event.endDate,
        place: event.place,
        orgName: event.orgName,
        useTarget: event.useTarget,
        useFee: event.useFee,
        isFree: event.isFree,
        themeCode: event.themeCode,
        ticket: event.ticket,
        mainImg: event.mainImg,
        program: event.program,
        etcDesc: event.etcDesc
      }
    })), 
    [culturalEvents]
  );
  
  // 문화예약을 Facility로 변환 (메모화)
  const facilitiesFromCulturalReservations = useMemo(() => 
    culturalReservations.map(reservation => ({
      id: reservation.id?.toString() || Math.random().toString(),
      name: reservation.name || '문화예약',
      category: 'cultural_reservation' as const,
      position: {
        lat: reservation.latitude || 0,
        lng: reservation.longitude || 0
      },
      address: reservation.address || '',
      phone: reservation.phoneNumber,
      description: reservation.description,
      congestionLevel: 'low' as const,
      website: reservation.reservationUrl,
      isReservable: true
    })), 
    [culturalReservations]
  );
  
  // 맛집을 Facility로 변환 (메모화)
  const facilitiesFromRestaurants = useMemo(() => 
    restaurants.map(restaurant => convertRestaurantToFacility(restaurant)), 
    [restaurants]
  );

  // 모든 시설 통합 (지하철 제외 - 카카오맵 기본 지하철역 사용)
  const allFacilities = useMemo(() => 
    [...facilitiesFromPOIs, ...facilitiesFromBikes, ...coolingShelterFacilities, ...facilitiesFromParks, ...facilitiesFromLibraries, ...facilitiesFromCulturalSpaces, ...facilitiesFromCulturalEvents, ...facilitiesFromCulturalReservations, ...facilitiesFromRestaurants],
    [facilitiesFromPOIs, facilitiesFromBikes, coolingShelterFacilities, facilitiesFromParks, facilitiesFromLibraries, facilitiesFromCulturalSpaces, facilitiesFromCulturalEvents, facilitiesFromCulturalReservations, facilitiesFromRestaurants]
  );
  
  // 클러스터링된 마커 데이터 (사용하지 않으므로 제거)
  // const { markers, clusteredFacilities } = useClusteredMarkers(allFacilities);
  
  // 지하철역은 별도 관리 (마커 표시 안함, 클릭 이벤트만)
  const allFacilitiesWithSubway = useMemo(() => 
    [...allFacilities, ...subwayFacilities],
    [allFacilities, subwayFacilities]
  );

  // 검색 마커 포함한 전체 시설 (표시용)
  const allFacilitiesWithSearch = useMemo(() => {
    const facilities = [...allFacilities];
    if (searchMarker) {
      facilities.push(searchMarker);
    }
    return facilities;
  }, [allFacilities, searchMarker]);

  // 혼잡도 관련 hooks
  const {
    showCongestion,
    congestionData,
    congestionLoading,
    congestionError,
    toggleCongestionDisplay,
    refreshCongestionData,
    fetchCongestionData
  } = useCongestion();

  // 날씨 관련 hooks
  const {
    showWeather,
    weatherData,
    weatherLoading,
    weatherError,
    toggleWeatherDisplay,
    refreshWeatherData,
    fetchWeatherData
  } = useWeather();

  // 위치 변경 핸들러 (개선된 버전)
  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    // 이미 같은 위치에서 로딩 중이면 중복 요청 방지 (더 엄격한 조건)
    const lastLocation = lastLoadedLocationRef.current;
    if (lastLocation && 
        Math.abs(lastLocation.lat - lat) < 0.0001 && 
        Math.abs(lastLocation.lng - lng) < 0.0001) {
      console.log('같은 위치 중복 요청 방지');
      return;
    }

    // 현재 로딩 중이면 요청 무시
    if (isLoadingData) {
      console.log('이미 로딩 중이므로 요청 무시');
      return;
    }

    // 이전 로딩 타이머 취소
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    console.log(`위치 데이터 로드 시작: ${lat}, ${lng}`);
    setIsLoadingData(true);
    setBikeError(null);
    lastLoadedLocationRef.current = { lat, lng };

    try {
      // 위치 기반 API 호출을 병렬로 처리 (따릉이, 무더위 쉼터 포함)
      console.log('시설 데이터 로드 시작:', { lat, lng, searchRadius });
      
      const promises = [
        fetchCongestionData(lat, lng),
        fetchWeatherData(lat, lng),
        fetchNearbyPOIs(lat, lng, 1.5), // POI는 1.5km 고정 반경
        // 따릉이 위치 기반 호출 (1km 고정)
        Promise.race([
          getNearbyBikeStations(lat, lng, 1).then(stations => {
            console.log('따릉이 데이터:', stations?.length || 0, '개');
            setBikeStations(stations ?? []);
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('따릉이 API 타임아웃')), 10000)
          )
        ]).catch(error => {
          setBikeError(error instanceof Error ? error.message : '따릉이 데이터 로드 실패');
          console.error('따릉이 데이터 로드 실패:', error);
        }),
        fetchParks(lat, lng).then(() => console.log('공원 데이터:', parks.length, '개')),
        // 무더위 쉼터 위치 기반 호출
        fetchCoolingShelters(lat, lng).then(() => console.log('무더위 쉼터 데이터:', coolingShelterFacilities.length, '개')),
        // 도서관 위치 기반 호출
        fetchLibraries(lat, lng).then(() => console.log('도서관 데이터:', libraries.length, '개')),
        // 문화공간 위치 기반 호출
        fetchCulturalSpaces(lat, lng).then(() => console.log('문화공간 데이터:', culturalSpaces.length, '개')),
        // 문화행사 위치 기반 호출
        fetchCulturalEvents(lat, lng).then(() => console.log('문화행사 데이터:', culturalEvents.length, '개')),
        // 문화예약 위치 기반 호출
        fetchCulturalReservations(lat, lng).then(() => console.log('문화예약 데이터:', culturalReservations.length, '개')),
        // 맛집 위치 기반 호출
        fetchRestaurants(lat, lng).then(() => console.log('맛집 데이터:', restaurants.length, '개'))
      ];

      await Promise.allSettled(promises);
      console.log('위치 데이터 로드 완료');
    } catch (error) {
      console.error('위치 데이터 로드 실패:', error);
    } finally {
      // 로딩 상태를 약간 지연 후 해제 (UI 깜빡임 방지)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingData(false);
      }, 500);
    }
  }, [searchRadius, isLoadingData, fetchCongestionData, fetchWeatherData, fetchNearbyPOIs, fetchParks, fetchCoolingShelters, fetchLibraries, fetchCulturalSpaces, fetchCulturalEvents, fetchCulturalReservations, fetchRestaurants, parks.length, coolingShelterFacilities.length, libraries.length, culturalSpaces.length, culturalEvents.length, culturalReservations.length, restaurants.length]);

  // 디바운싱된 위치 변경 핸들러
  const debouncedLocationChange = useCallback(
    (lat: number, lng: number) => {
      const debouncedFn = debounce((lat: number, lng: number) => {
        setCurrentLocation({
          address: '이동된 위치',
          coords: { lat, lng },
          type: 'current'
        });
        handleLocationChange(lat, lng);
      }, 1000);
      debouncedFn(lat, lng);
    },
    [handleLocationChange, setCurrentLocation]
  );

  // 현재 위치 마커 표시
  useCurrentLocationMarker({
    mapInstance,
    mapStatus,
    currentLocation,
    onLocationChange: debouncedLocationChange
  });

  // 초기 데이터 로드 상태 추적
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // 현재 위치가 설정되면 자동으로 데이터 로드 (한번만)
  useEffect(() => {
    if (currentLocation?.coords && !hasInitialLoad && !isLoadingData) {
      setHasInitialLoad(true);
      handleLocationChange(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [currentLocation?.coords, hasInitialLoad, isLoadingData, handleLocationChange]);

  // 줌 레벨 범위가 변경되면 데이터 새로고침 (현재 위치 기준)
  useEffect(() => {
    if (currentLocation?.coords && !isZooming && !isLoadingData && hasInitialLoad) {
      const timeout = setTimeout(() => {
        handleLocationChange(currentLocation.coords.lat, currentLocation.coords.lng);
      }, 1000); // 줌 완료 후 지연 시간 증가
      
      return () => clearTimeout(timeout);
    }
  }, [zoomInfo.range, currentLocation?.coords, isZooming, isLoadingData, hasInitialLoad, handleLocationChange]);

  // 혼잡도 토글 핸들러
  const handleToggleCongestion = useCallback(async () => {
    if (currentLocation) {
      await toggleCongestionDisplay(currentLocation.coords);
    } else {
      await toggleCongestionDisplay();
    }
  }, [currentLocation, toggleCongestionDisplay]);

  // 날씨 토글 핸들러
  const handleToggleWeather = useCallback(async () => {
    if (currentLocation) {
      await toggleWeatherDisplay(currentLocation.coords);
    } else {
      await toggleWeatherDisplay();
    }
  }, [currentLocation, toggleWeatherDisplay]);

  // 혼잡도 새로고침 핸들러
  const handleRefreshCongestion = useCallback(async () => {
    if (currentLocation) {
      await refreshCongestionData(currentLocation.coords);
    }
  }, [currentLocation, refreshCongestionData]);

  // 날씨 새로고침 핸들러
  const handleRefreshWeather = useCallback(async () => {
    if (currentLocation) {
      await refreshWeatherData(currentLocation.coords);
    }
  }, [currentLocation, refreshWeatherData]);

  // 지도 중심 이동 핸들러 (재시도 횟수 제한)
  const handleMapMove = useCallback((lat: number, lng: number, retryCount: number = 0) => {
    console.log('지도 이동 요청:', { 
      lat, 
      lng, 
      mapInstance: !!mapInstance, 
      success: mapStatus.success,
      loading: mapStatus.loading,
      retryCount 
    });
    
    // 최대 3번까지만 재시도
    if (retryCount >= 3) {
      console.error('지도 이동 재시도 횟수 초과');
      return;
    }
    
    // 지도가 준비되지 않았으면 잠시 후 재시도
    interface KakaoWindow extends Window {
      kakao?: {
        maps?: {
          LatLng: new (lat: number, lng: number) => KakaoLatLng;
        };
      };
    }
    
    if (!mapInstance || !mapStatus.success || mapStatus.loading || !(window as KakaoWindow).kakao?.maps) {
      console.log(`지도 준비 중 (${retryCount + 1}/3), 1초 후 재시도`);
      setTimeout(() => handleMapMove(lat, lng, retryCount + 1), 1000);
      return;
    }
    
    try {
      const moveLatLng = new (window as KakaoWindow).kakao!.maps!.LatLng(lat, lng);
      mapInstance.setCenter(moveLatLng);
      mapInstance.setLevel(3); // 상세 보기를 위해 줌 레벨 조정
      console.log('지도 이동 완료:', { lat, lng });
    } catch (error) {
      console.error('지도 이동 실패:', error);
    }
  }, [mapInstance, mapStatus.success, mapStatus.loading]);

  // 검색 결과 선택 핸들러
  const handleSearchSelect = useCallback(async (searchItem: SearchItem) => {
    await selectSearchResult(
      searchItem,
      handleMapMove,
      setSelectedFacility
    );
  }, [selectSearchResult, handleMapMove]);

  // 검색 마커 제거 핸들러 (내 위치 버튼 클릭 시)
  const handleMoveToCurrentLocation = useCallback(() => {
    clearSearchMarker();
    setSelectedFacility(null);
    setSelectedCluster(null);
    onLocationReset?.(); // 검색어 초기화
    moveToCurrentLocation();
  }, [clearSearchMarker, moveToCurrentLocation, onLocationReset]);

  // 검색 초기화 핸들러
  const handleSearchClear = useCallback(() => {
    clearSearchMarker();
    setSelectedFacility(null);
    setSelectedCluster(null);
  }, [clearSearchMarker]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // 에러 상태 통합 (메모이제이션)
  const hasErrors = useMemo(() => Boolean(
    (congestionError && showCongestion) || 
    (weatherError && showWeather) || 
    subwayError || 
    bikeError || 
    coolingShelterError || 
    parksError ||
    librariesError ||
    culturalSpacesError ||
    culturalEventsError ||
    culturalReservationsError ||
    searchError
  ), [
    congestionError, showCongestion,
    weatherError, showWeather,
    subwayError, bikeError, coolingShelterError,
    parksError, librariesError, culturalSpacesError,
    culturalEventsError, culturalReservationsError,
    searchError
  ]);

  // ref로 외부 함수 노출
  React.useImperativeHandle(ref, () => ({
    handleSearchSelect,
    handleSearchClear
  }), [handleSearchSelect, handleSearchClear]);

  return (
    <div className="relative w-full h-full">
      {/* 에러 알림들 - 상단 중앙 (개선된 스타일) */}
      {hasErrors && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-80 max-w-[90vw] space-y-2">
          {congestionError && showCongestion && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{congestionError}</AlertDescription>
            </Alert>
          )}
          {weatherError && showWeather && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{weatherError}</AlertDescription>
            </Alert>
          )}
          {subwayError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{subwayError}</AlertDescription>
            </Alert>
          )}
          {bikeError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{bikeError}</AlertDescription>
            </Alert>
          )}
          {coolingShelterError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{coolingShelterError}</AlertDescription>
            </Alert>
          )}
          {parksError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{parksError}</AlertDescription>
            </Alert>
          )}
          {librariesError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{librariesError}</AlertDescription>
            </Alert>
          )}
          {culturalSpacesError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{culturalSpacesError}</AlertDescription>
            </Alert>
          )}
          {culturalEventsError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{culturalEventsError}</AlertDescription>
            </Alert>
          )}
          {culturalReservationsError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4" />
              <AlertDescription>{culturalReservationsError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* 로딩 인디케이터 */}
      {isLoadingData && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-700">데이터 로딩 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* 지도 뷰 - 전체 화면 */}
      <MapView
        loading={mapStatus.loading}
        showCongestion={showCongestion}
        congestionData={congestionData}
        congestionLoading={congestionLoading}
        congestionError={congestionError}
        showWeather={showWeather}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        onRefreshCongestion={handleRefreshCongestion}
        onRefreshWeather={handleRefreshWeather}
        onToggleCongestion={handleToggleCongestion}
        onToggleWeather={handleToggleWeather}
        onMoveToCurrentLocation={handleMoveToCurrentLocation}
        mapInstance={mapInstance}
        mapStatus={mapStatus}
        allFacilities={allFacilitiesWithSubway}
        visibleFacilities={allFacilitiesWithSearch}
        preferences={preferences}
        onPreferenceToggle={onPreferenceToggle}
        onFacilitySelect={setSelectedFacility}
        onClusterSelect={setSelectedCluster}
        onMapClick={onMapClick}
      />
      
      {/* 클러스터 바텀시트 */}
      <ClusterBottomSheet
        cluster={selectedCluster!}
        isOpen={!!selectedCluster && !selectedFacility}
        onClose={() => setSelectedCluster(null)}
      />
      
      {/* 개별 시설 바텀시트 */}
      <FacilityBottomSheet
        facility={selectedFacility}
        isOpen={!!selectedFacility}
        onClose={() => {
          setSelectedFacility(null);
          // 클러스터가 선택되어 있으면 다시 클러스터 바텀시트 표시
        }}
        weatherData={weatherData}
        congestionData={congestionData}
      />
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
