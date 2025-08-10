// components/map/MapContainer.tsx
'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
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
import { useFacilities } from '@/hooks/useFacilities';
import { convertPOIToFacility } from '@/services/poi';
// import { getNearbyBikeStations, convertBikeStationToFacility } from '@/services/bikeStation';

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

  // POI 관련 hooks
  const { pois, fetchNearbyPOIs } = usePOI();
  
  // 따릉이 대여소 상태 (임시 비활성화)
  // const [bikeStations, setBikeStations] = useState([]);
  // const [bikeLoading, setBikeLoading] = useState(false);

  // POI와 따릉이를 Facility로 변환
  const facilitiesFromPOIs = useMemo(() => 
    pois.map(poi => convertPOIToFacility(poi)), 
    [pois]
  );
  
  // const facilitiesFromBikes = useMemo(() => 
  //   bikeStations.map(station => convertBikeStationToFacility(station)), 
  //   [bikeStations]
  // );
  
  const allFacilities = useMemo(() => 
    [...facilitiesFromPOIs], // ...facilitiesFromBikes 임시 비활성화
    [facilitiesFromPOIs]
  );

  const { visibleFacilities } = useFacilities({
    facilities: allFacilities
  });

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
    
    // POI 데이터 업데이트
    await fetchNearbyPOIs(lat, lng, 1.5);
    
    // 따릉이 데이터 업데이트 (임시 비활성화)
    // setBikeLoading(true);
    // try {
    //   const stations = await getNearbyBikeStations(lat, lng, 1.5);
    //   setBikeStations(stations);
    // } catch (error) {
    //   console.error('따릉이 데이터 로드 실패:', error);
    // } finally {
    //   setBikeLoading(false);
    // }
  }, [fetchCongestionData, fetchWeatherData, fetchNearbyPOIs]);

  // 현재 위치 마커 표시
  useCurrentLocationMarker({
    mapInstance,
    mapStatus,
    currentLocation,
    onLocationChange: handleLocationChange
  });

  // 현재 위치가 설정되면 자동으로 날씨, 혼잡도, POI 데이터 로드
  useEffect(() => {
    if (currentLocation) {
      const { lat, lng } = currentLocation.coords;
      
      if (!weatherData) {
        fetchWeatherData(lat, lng);
      }
      if (!congestionData) {
        fetchCongestionData(lat, lng);
      }
      if (pois.length === 0) {
        fetchNearbyPOIs(lat, lng, 1.5);
      }
      // if (bikeStations.length === 0) {
      //   setBikeLoading(true);
      //   getNearbyBikeStations(lat, lng, 1.5)
      //     .then(stations => setBikeStations(stations))
      //     .catch(error => console.error('따릉이 데이터 로드 실패:', error))
      //     .finally(() => setBikeLoading(false));
      // }
    }
  }, [currentLocation, weatherData, congestionData, pois.length, fetchWeatherData, fetchCongestionData, fetchNearbyPOIs]);

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
        visibleFacilities={visibleFacilities}
        allFacilities={allFacilities}
      />
    </div>
  );
}