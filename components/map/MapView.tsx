// components/map/MapView.tsx
'use client';

import React, { useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

import { CongestionPanel } from './CongestionPanel';
import { WeatherPanel } from './WeatherPanel';
import { MapControls } from './MapControls';
import { MapStatusIndicator } from './MapStatusIndicator';
// import { FacilityBottomSheet } from './FacilityBottomSheet'; // 사용하지 않음
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useFacilities } from '@/hooks/useFacilities';
import { FACILITY_CATEGORIES } from '@/lib/types';

import type { 
  CongestionData, 
  WeatherData, 
  Facility,
  UserPreferences,
  FacilityCategory,
  ClusteredFacility
} from '@/lib/types';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';

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
  mapInstance?: KakaoMap | null | undefined;
  mapStatus?: { success: boolean; loading: boolean; error: string | null } | undefined;
  allFacilities?: Facility[];
  visibleFacilities?: Facility[];
  preferences?: UserPreferences;
  onPreferenceToggle?: (category: FacilityCategory) => void;
  onFacilitySelect?: (facility: Facility) => void;
  onClusterSelect?: (cluster: ClusteredFacility) => void;
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
  mapStatus,
  allFacilities = [],
  visibleFacilities = [],
  preferences,
  onPreferenceToggle,
  onFacilitySelect,
  onClusterSelect
}) => {
  // 백엔드로부터 받은 사용자 선호도 or 기본값 사용 (마커 표시용)
  const { visibleFacilities: filteredFacilities, preferences: internalPreferences, toggleCategory } = useFacilities({
    facilities: visibleFacilities, // 지하철 제외된 시설들
    initialPreferences: preferences
  });
  
  const currentPreferences = preferences || internalPreferences;
  const handleToggleCategory = onPreferenceToggle || toggleCategory;



  const handleFacilitySelect = useCallback((facility: Facility) => {
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    }
    // 개별 시설 선택 로직은 MapContainer에서 처리
  }, [onFacilitySelect]);
  
  const handleClusterSelect = useCallback((cluster: ClusteredFacility) => {
    if (onClusterSelect) {
      onClusterSelect(cluster);
    }
  }, [onClusterSelect]);

  // 지하철역 클릭 처리를 위한 지도 이벤트
  React.useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const handleMapClick = (mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
      const clickPosition = mouseEvent.latLng;
      const lat = clickPosition.getLat();
      const lng = clickPosition.getLng();
      
      // 클릭 위치 주변의 지하철역 찾기 (반경 100m)
      const nearbySubway = allFacilities.find(facility => {
        if (facility.category !== 'subway') return false;
        
        const distance = Math.sqrt(
          Math.pow(facility.position.lat - lat, 2) + 
          Math.pow(facility.position.lng - lng, 2)
        ) * 111000; // 대략적인 거리 계산 (미터)
        
        return distance < 100; // 100m 이내
      });
      
      if (nearbySubway) {
        handleFacilitySelect(nearbySubway);
      }
    };

    const clickListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance,
      'click',
      handleMapClick
    );

    return () => {
      try {
        const cleanupWindow = window as WindowWithKakao;
        if (cleanupWindow.kakao?.maps?.event && clickListener) {
          // cleanupWindow.kakao.maps.event.removeListener(clickListener);
        }
      } catch {
        // 조용히 처리
      }
    };
  }, [mapInstance, mapStatus?.success, allFacilities, handleFacilitySelect]);

  // POI 선택 핸들러 제거 - 이제 Facility로 통합됨

  const { markersCount } = useMapMarkers({
    mapInstance,
    mapStatus,
    visibleFacilities: filteredFacilities,
    onFacilitySelect: handleFacilitySelect,
    onClusterSelect: handleClusterSelect
  });



  return (
    <div className="relative w-full h-full">
      {/* 로딩 오버레이 */}
      {(loading || mapStatus?.loading) && (
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
      {mapStatus?.error && (
        <div className="absolute inset-4 z-20 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-red-600 mb-4">{mapStatus?.error}</p>
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

      {/* 혼잡도 패널 오버레이 */}
      {showCongestion && (
        <div 
          className="fixed inset-0 z-24" 
          onClick={onToggleCongestion}
        />
      )}

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

      {/* 날씨 패널 오버레이 */}
      {showWeather && (
        <div 
          className="fixed inset-0 z-24" 
          onClick={onToggleWeather}
        />
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

      {/* 카테고리 토글 버튼 */}
      <div className="absolute top-4 left-4 z-30 flex gap-2">
        {Object.entries(FACILITY_CATEGORIES).map(([key, category]) => {
          const count = allFacilities.filter(f => f.category === category).length;
          const isActive = currentPreferences?.[category];
          
          if (count === 0 || key === 'SUBWAY') return null;
          
          const config = FACILITY_CONFIGS[category];
          
          return (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => handleToggleCategory(category)}
              className={`text-xs px-2 py-1 h-8 flex items-center gap-1 border ${
                isActive 
                  ? `${config.color} text-white border-transparent` 
                  : 'bg-white/90 text-gray-700 border-gray-300'
              }`}
            >
              <span className="w-4 h-4">{config.icon}</span>
              {count}
            </Button>
          );
        })}
      </div>

      {/* 상태 표시기 */}
      <MapStatusIndicator
        showCongestion={showCongestion}
        congestionData={congestionData}
        showWeather={showWeather}
        weatherData={weatherData}
        markersCount={markersCount}
      />



    </div>
  );
};