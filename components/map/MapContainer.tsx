// components/map/MapContainer.tsx - Improved version with better performance
'use client';

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// 컴포넌트들
import { MapView } from './MapView';

// Hooks
import { useLocation } from '@/hooks/useLocation';
import { useCongestion } from '@/hooks/useCongestion';
import { useWeather } from '@/hooks/useWeather';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { useCurrentLocationMarker } from '@/hooks/useCurrentLocationMarker';
import { usePOI } from '@/hooks/usePOI';
import { convertPOIToFacility } from '@/services/poi';
import { getNearbyBikeStations, convertBikeStationToFacility } from '@/services/bikeStation';
import { useCoolingShelter } from '@/hooks/useCoolingShelter';
import { useSubwayStations } from '@/hooks/useSubwayStations';
import { useParks } from '@/hooks/useParks';
import type { BikeStationData, UserPreferences, FacilityCategory, Park } from '@/lib/types';

interface MapContainerProps {
  className?: string;
  preferences?: UserPreferences;
  onPreferenceToggle?: (category: FacilityCategory) => void;
}

// 디바운싱 유틸리티
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function MapContainer({ preferences, onPreferenceToggle }: MapContainerProps = {}) {
  // 지도 인스턴스 생성
  const { mapInstance, mapStatus } = useKakaoMap({
    containerId: 'kakaoMap',
    center: { lat: 37.5665, lng: 126.9780 },
    level: 3
  });

  // 위치 관련 hooks
  const { currentLocation, moveToCurrentLocation } = useLocation(mapInstance);

  // POI 관련 hooks
  const { pois, fetchNearbyPOIs } = usePOI();
  
  // 따릉이 대여소 상태
  const [bikeStations, setBikeStations] = useState<BikeStationData[]>([]);
  const [bikeError, setBikeError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 무더위 쉼터 상태
  const { facilities: coolingShelterFacilities, isLoading: coolingShelterLoading, error: coolingShelterError } = useCoolingShelter();

  // 지하철 상태
  const { subwayStations: subwayFacilities, error: subwayError } = useSubwayStations();

  // 공원 상태
  const { parks, isLoading: parksLoading, error: parksError, fetchParks } = useParks();

  // 마지막 데이터 로드 위치 추적
  const lastLoadedLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // POI와 따릉이를 Facility로 변환 (메모화)
  const facilitiesFromPOIs = useMemo(() => 
    pois.map(poi => convertPOIToFacility(poi)), 
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
      operatingHours: park.useReference
    })), 
    [parks]
  );

  // 모든 시설 통합 (메모화)
  const allFacilities = useMemo(() => 
    [...facilitiesFromPOIs, ...facilitiesFromBikes, ...coolingShelterFacilities, ...subwayFacilities, ...facilitiesFromParks],
    [facilitiesFromPOIs, facilitiesFromBikes, coolingShelterFacilities, subwayFacilities, facilitiesFromParks]
  );

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
    // 이미 같은 위치에서 로딩 중이면 중복 요청 방지
    const lastLocation = lastLoadedLocationRef.current;
    if (lastLocation && 
        Math.abs(lastLocation.lat - lat) < 0.001 && 
        Math.abs(lastLocation.lng - lng) < 0.001 &&
        isLoadingData) {
      return;
    }

    // 이전 로딩 타이머 취소
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setIsLoadingData(true);
    setBikeError(null);
    lastLoadedLocationRef.current = { lat, lng };

    try {
      // 모든 API 호출을 병렬로 처리 (타임아웃 설정)
      const promises = [
        fetchCongestionData(lat, lng),
        fetchWeatherData(lat, lng),
        fetchNearbyPOIs(lat, lng, 1.5),
        Promise.race([
          getNearbyBikeStations(lat, lng, 1.5).then(stations => {
            setBikeStations(stations ?? []);
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('따릉이 API 타임아웃')), 10000)
          )
        ]).catch(error => {
          setBikeError(error instanceof Error ? error.message : '따릉이 데이터 로드 실패');
          console.error('따릉이 데이터 로드 실패:', error);
        }),
        fetchParks(lat, lng)
      ];

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('위치 데이터 로드 실패:', error);
    } finally {
      // 로딩 상태를 약간 지연 후 해제 (UI 깜빡임 방지)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingData(false);
      }, 300);
    }
  }, [fetchCongestionData, fetchWeatherData, fetchNearbyPOIs, fetchParks, isLoadingData]);

  // 디바운싱된 위치 변경 핸들러
  const debouncedLocationChange = useCallback(
    debounce(handleLocationChange, 500),
    [handleLocationChange]
  );

  // 현재 위치 마커 표시
  useCurrentLocationMarker({
    mapInstance,
    mapStatus,
    currentLocation,
    onLocationChange: debouncedLocationChange
  });

  // 현재 위치가 설정되면 자동으로 데이터 로드 (한번만)
  useEffect(() => {
    if (currentLocation?.coords && 
        !weatherData && 
        !congestionData && 
        pois.length === 0 && 
        bikeStations.length === 0 &&
        !isLoadingData) {
      handleLocationChange(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [currentLocation?.coords, weatherData, congestionData, pois.length, bikeStations.length, handleLocationChange, isLoadingData]);

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

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // 에러 상태 통합
  const hasErrors = Boolean(
    (congestionError && showCongestion) || 
    (weatherError && showWeather) || 
    subwayError || 
    bikeError || 
    coolingShelterError || 
    parksError
  );

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
        onMoveToCurrentLocation={moveToCurrentLocation}
        mapInstance={mapInstance}
        mapStatus={mapStatus}
        allFacilities={allFacilities}
        preferences={preferences}
        onPreferenceToggle={onPreferenceToggle}
      />
    </div>
  );
}
