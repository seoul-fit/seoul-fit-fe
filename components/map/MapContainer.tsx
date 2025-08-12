// components/map/MapContainer.tsx
'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
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
  const [bikeError, setBikeError] = useState<string | null>(null); // bike 에러 상태 추가

  // 무더위 쉼터 상태
  const { facilities: coolingShelterFacilities, isLoading: coolingShelterLoading, error: coolingShelterError } = useCoolingShelter();

  // 지하철 상태
  const { subwayStations: subwayFacilities, error: subwayError } = useSubwayStations();

  // 공원 상태
  const { parks, isLoading: parksLoading, error: parksError, fetchParks } = useParks();

  // POI와 따릉이를 Facility로 변환
  const facilitiesFromPOIs = useMemo(() => 
    pois.map(poi => convertPOIToFacility(poi)), 
    [pois]
  );
  
  const facilitiesFromBikes = useMemo(() => 
    bikeStations.map(station => convertBikeStationToFacility(station)), 
    [bikeStations]
  );
  
  // 공원을 Facility로 변환
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

  // 위치 변경 핸들러 (모든 데이터 병렬 업데이트)
  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    setBikeError(null);
    
    // 모든 API 호출을 병렬로 처리하여 속도 향상
    await Promise.allSettled([
      fetchCongestionData(lat, lng),
      fetchWeatherData(lat, lng),
      fetchNearbyPOIs(lat, lng, 1.5),
      getNearbyBikeStations(lat, lng, 1.5).then(stations => {
        setBikeStations(stations ?? []);
      }).catch(error => {
        setBikeError(error instanceof Error ? error.message : '따릉이 데이터 로드 실패');
        console.error('따릉이 데이터 로드 실패:', error);
      }),
      fetchParks(lat, lng)
    ]);
  }, [fetchCongestionData, fetchWeatherData, fetchNearbyPOIs]);

  // 현재 위치 마커 표시
  useCurrentLocationMarker({
    mapInstance,
    mapStatus,
    currentLocation,
    onLocationChange: handleLocationChange
  });

  // 현재 위치가 설정되면 자동으로 데이터 로드 (한번만)
  useEffect(() => {
    if (currentLocation?.coords && 
        !weatherData && 
        !congestionData && 
        pois.length === 0 && 
        bikeStations.length === 0) {
      // handleLocationChange에서 모든 데이터를 로드하므로 여기서는 호출하지 않음
      handleLocationChange(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [currentLocation?.coords]);

  // 혼잡도 토글 핸들러
  const handleToggleCongestion = async () => {
    if (currentLocation) {
      await toggleCongestionDisplay(currentLocation.coords);
    } else {
      await toggleCongestionDisplay();
    }
  };

  // 날씨 토글 핸들러
  const handleToggleWeather = async () => {
    if (currentLocation) {
      await toggleWeatherDisplay(currentLocation.coords);
    } else {
      await toggleWeatherDisplay();
    }
  };

  // 혼잡도 새로고침 핸들러
  const handleRefreshCongestion = async () => {
    if (currentLocation) {
      await refreshCongestionData(currentLocation.coords);
    }
  };

  // 날씨 새로고침 핸들러
  const handleRefreshWeather = async () => {
    if (currentLocation) {
      await refreshWeatherData(currentLocation.coords);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 에러 알림들 - 상단 중앙 */}
      {(congestionError && showCongestion) || (weatherError && showWeather) || subwayError || bikeError || coolingShelterError || parksError ? (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-80 max-w-[90vw]">
          {congestionError && showCongestion && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{congestionError}</AlertDescription>
            </Alert>
          )}
          {weatherError && showWeather && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{weatherError}</AlertDescription>
            </Alert>
          )}
          {subwayError && (
              <Alert variant="destructive" className="mb-2">
                <Info className="h-4 w-4" />
                <AlertDescription>{subwayError}</AlertDescription>
              </Alert>
          )}
          {bikeError && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{bikeError}</AlertDescription>
            </Alert>
          )}
          {coolingShelterError && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{coolingShelterError}</AlertDescription>
            </Alert>
          )}
          {parksError && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{parksError}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : null}

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