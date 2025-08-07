// components/map/MapContainer.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
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

interface MapContainerProps {
  className?: string; // 추가적인 CSS 클래스
}

export default function MapContainer({}: MapContainerProps = {}) {
  // 지도 인스턴스 생성
  const { mapInstance, mapStatus } = useKakaoMap({
    containerId: 'kakaoMap',
    center: { lat: 37.5665, lng: 126.9780 },
    level: 3
  });

  // 위치 관련 hooks
  const { currentLocation, moveToCurrentLocation } = useLocation(mapInstance);

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

  // 위치 변경 핸들러
  const handleLocationChange = useCallback(async (lat: number, lng: number) => {
    // 혼잡도 데이터 업데이트 (항상 업데이트)
    await fetchCongestionData(lat, lng);
    
    // 날씨 데이터 업데이트 (항상 업데이트)
    await fetchWeatherData(lat, lng);
  }, [fetchCongestionData, fetchWeatherData]);

  // 현재 위치 마커 표시
  useCurrentLocationMarker({
    mapInstance,
    mapStatus,
    currentLocation,
    onLocationChange: handleLocationChange
  });

  // 현재 위치가 설정되면 자동으로 날씨와 혼잡도 데이터 로드
  useEffect(() => {
    if (currentLocation) {
      if (!weatherData) {
        fetchWeatherData(currentLocation.coords.lat, currentLocation.coords.lng);
      }
      if (!congestionData) {
        fetchCongestionData(currentLocation.coords.lat, currentLocation.coords.lng);
      }
    }
  }, [currentLocation, weatherData, congestionData, fetchWeatherData, fetchCongestionData]);

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
      {(congestionError && showCongestion) || (weatherError && showWeather) ? (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-80 max-w-[90vw]">
          {congestionError && showCongestion && (
            <Alert variant="destructive" className="mb-2">
              <Info className="h-4 w-4" />
              <AlertDescription>{congestionError}</AlertDescription>
            </Alert>
          )}
          {weatherError && showWeather && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>{weatherError}</AlertDescription>
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
      />
    </div>
  );
}