// components/map/MapView.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

import { CongestionPanel } from './CongestionPanel';
import { WeatherPanel } from './WeatherPanel';
import { MapControls } from './MapControls';
import { MapStatusIndicator } from './MapStatusIndicator';
import { FacilityBottomSheet } from './FacilityBottomSheet';
import { useFacilities } from '@/hooks/useFacilities';
import { useMapMarkers } from '@/hooks/useMapMarkers';

import type { 
  CongestionData, 
  WeatherData, 
  Facility, 
} from '@/lib/types';
import type { KakaoMap } from '@/lib/kakao-map';

interface MapViewProps {
  loading?: boolean;
  showCongestion?: boolean;
  congestionData?: CongestionData | null;
  congestionLoading?: boolean;
  congestionError?: string | null;
  showWeather?: boolean;
  weatherData?: WeatherData | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
  onRefreshCongestion?: () => void;
  onRefreshWeather?: () => void;
  onToggleCongestion?: () => void;
  onToggleWeather?: () => void;
  onMoveToCurrentLocation?: () => void;
}

interface MapViewPropsExtended extends MapViewProps {
  mapInstance?: KakaoMap | null;
  mapStatus?: { success: boolean; loading: boolean; error: string | null };
}

export const MapView: React.FC<MapViewPropsExtended> = ({
  loading = false,
  showCongestion = false,
  congestionData = null,
  congestionLoading = false,
  congestionError = null,
  showWeather = false,
  weatherData = null,
  weatherLoading = false,
  weatherError = null,
  onRefreshCongestion,
  onRefreshWeather,
  onToggleCongestion,
  onToggleWeather,
  onMoveToCurrentLocation,
  mapInstance,
  mapStatus
}) => {
  const { visibleFacilities } = useFacilities();

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleFacilitySelect = useCallback((facility: Facility) => {
    setSelectedFacility(facility);
    setIsBottomSheetOpen(true);
  }, []);

  const { markersCount } = useMapMarkers({
    mapInstance,
    mapStatus,
    visibleFacilities,
    onFacilitySelect: handleFacilitySelect
  });



  return (
    <div className="relative w-full h-full">
      {/* 로딩 오버레이 */}
      {(loading || mapStatus.loading) && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-md">
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      )}

      {/* 카카오 지도 */}
      <div id="kakaoMap" className="w-full h-full" />

      {/* 지도 오류 */}
      {mapStatus.error && (
        <div className="absolute inset-4 z-20 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-red-600 mb-4">{mapStatus.error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>
      )}

      {/* 지도 컨트롤 버튼들 */}
      <MapControls
        showCongestion={showCongestion}
        congestionData={congestionData}
        congestionLoading={congestionLoading}
        onToggleCongestion={onToggleCongestion || (() => {})}
        showWeather={showWeather}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        onToggleWeather={onToggleWeather || (() => {})}
        onMoveToCurrentLocation={onMoveToCurrentLocation || (() => {})}
      />

      {/* 혼잡도 패널 (아이콘 우측에 위치) */}
      {showCongestion && (
        <div className="absolute top-4 right-20 z-25">
          <div className="relative">
            {/* 말풍선 꼬리 */}
            <div className="absolute left-0 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white"></div>
            
            <CongestionPanel
              showCongestion={showCongestion}
              congestionData={congestionData}
              congestionLoading={congestionLoading}
              congestionError={congestionError}
              onRefresh={onRefreshCongestion || (() => {})}
            />
          </div>
        </div>
      )}

      {/* 날씨 패널 (아이콘 우측에 위치) */}
      {showWeather && (
        <div className="absolute bottom-36 left-20 z-25">
          <div className="relative">
            {/* 말풍선 꼬리 */}
            <div className="absolute right-0 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white"></div>
            
            <WeatherPanel
              showWeather={showWeather}
              weatherData={weatherData}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefresh={onRefreshWeather || (() => {})}
            />
          </div>
        </div>
      )}

      {/* 상태 표시기 */}
      <MapStatusIndicator
        showCongestion={showCongestion}
        congestionData={congestionData}
        showWeather={showWeather}
        weatherData={weatherData}
        markersCount={markersCount}
      />

      {/* 시설 정보 바텀 시트 */}
      <FacilityBottomSheet
        facility={selectedFacility}
        isOpen={isBottomSheetOpen}
        onClose={() => {
          setIsBottomSheetOpen(false);
          setSelectedFacility(null);
        }}
      />
    </div>
  );
};