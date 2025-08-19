// components/map/MapView.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

import { CongestionPanel } from './CongestionPanel';
import { WeatherPanel } from './WeatherPanel';
import { MapControls } from './MapControls';
import { MapStatusIndicator } from './MapStatusIndicator';
// import { FacilityBottomSheet } from './FacilityBottomSheet'; // 사용하지 않음
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useCongestion } from '@/hooks/useCongestion';
import { useWeather } from '@/hooks/useWeather';
import { FACILITY_CATEGORIES } from '@/lib/types';
import { useMapContext } from './providers/MapProvider';
import { useFacilityContext } from './providers/FacilityProvider';

import type {
  CongestionData,
  WeatherData,
  Facility,
  UserPreferences,
  FacilityCategory,
  ClusteredFacility,
} from '@/lib/types';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';

// Provider 기반으로 단순화된 Props
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
  onMapClick?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  loading = false,
  onMoveToCurrentLocation,
  onMapClick,
}) => {
  // 렌더링 확인용 로그
  // console.log('[MapView] 컴포넌트 렌더링됨');
  
  // Provider에서 데이터 가져오기
  const { mapInstance: contextMapInstance, mapStatus: contextMapStatus } = useMapContext();
  const { 
    facilities, 
    getFilteredFacilities,
    activeCategories,
    toggleCategory,
    selectFacility,
    updateLocation,
    currentLocation
  } = useFacilityContext();
  
  // console.log('[MapView] Provider 데이터 확인:', {
  //   mapInstance: !!contextMapInstance,
  //   mapStatus: contextMapStatus,
  //   facilitiesLength: facilities?.length || 0,
  //   currentLocation
  // });

  // 실시간 혼잡도 데이터 훅
  const {
    showCongestion,
    congestionData,
    congestionLoading,
    congestionError,
    toggleCongestionDisplay,
    refreshCongestionData,
    fetchCongestionData
  } = useCongestion();

  // 실시간 날씨 데이터 훅
  const {
    showWeather,
    weatherData,
    weatherLoading,
    weatherError,
    toggleWeatherDisplay,
    refreshWeatherData,
    fetchWeatherData
  } = useWeather();

  // Debug logs
  // console.log('[MapView] 혼잡도 상태:', { showCongestion, congestionData: !!congestionData, congestionLoading, congestionError });
  // console.log('[MapView] 날씨 상태:', { showWeather, weatherData: !!weatherData, weatherLoading, weatherError });

  // Provider의 데이터 사용
  const effectiveMapInstance = contextMapInstance;
  const effectiveMapStatus = contextMapStatus;
  const effectiveFacilities = facilities;
  const filteredFacilities = getFilteredFacilities();

  // 디버깅 로그 추가
  // console.log(`[MapView] 시설 데이터 상태:`, {
  //   totalFacilities: facilities.length,
  //   filteredFacilities: filteredFacilities.length,
  //   activeCategories: activeCategories,
  //   mapStatus: effectiveMapStatus,
  //   mapInstance: !!effectiveMapInstance
  // });

  const handleToggleCategory = toggleCategory;

  const handleFacilitySelect = useCallback(
    (facility: Facility) => {
      selectFacility(facility);
    },
    [selectFacility]
  );

  const handleClusterSelect = useCallback(
    (cluster: ClusteredFacility) => {
      // Provider를 통해 클러스터 선택 상태 관리
      // console.log('Cluster selected:', cluster);
    },
    []
  );

  // 지도 이벤트 처리 (클릭 및 이동)
  React.useEffect(() => {
    if (!effectiveMapInstance || !effectiveMapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const handleMapClick = (mouseEvent: {
      latLng: { getLat: () => number; getLng: () => number };
    }) => {
      const clickPosition = mouseEvent.latLng;
      const lat = clickPosition.getLat();
      const lng = clickPosition.getLng();

      // 클릭 위치 주변의 지하철역 찾기 (반경 100m)
      const nearbySubway = effectiveFacilities.find(facility => {
        if (facility.category !== 'subway') return false;

        const distance =
          Math.sqrt(
            Math.pow(facility.position.lat - lat, 2) + Math.pow(facility.position.lng - lng, 2)
          ) * 111000; // 대략적인 거리 계산 (미터)

        return distance < 100; // 100m 이내
      });

      if (nearbySubway) {
        handleFacilitySelect(nearbySubway);
      }

      // 지도 클릭 이벤트 처리 (검색 제안 닫기 등)
      onMapClick?.();
    };

    // 디바운싱을 위한 타이머 참조
    let debounceTimer: NodeJS.Timeout | null = null;

    // 지도 이동/드래그 종료 시 위치 기반 데이터 업데이트
    const handleMapDragEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(async () => {
        try {
          const center = effectiveMapInstance.getCenter();
          const lat = center.getLat();
          const lng = center.getLng();
          
          // console.log(`지도 이동: (${lat}, ${lng})`);
          
          // 병렬로 데이터 로딩 (이전 버전과 동일한 패턴)
          const promises = [
            updateLocation(lat, lng),
            fetchCongestionData(lat, lng),
            fetchWeatherData(lat, lng)
          ];
          
          await Promise.allSettled(promises);
          // console.log('위치 기반 데이터 업데이트 완료');
        } catch (error) {
          console.error('지도 이동 시 데이터 업데이트 실패:', error);
        }
      }, 500); // 500ms 디바운싱
    };

    const clickListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'click',
      handleMapClick
    );

    const dragEndListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'dragend',
      handleMapDragEnd
    );

    const zoomChangedListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'zoom_changed',
      handleMapDragEnd
    );

    return () => {
      try {
        const cleanupWindow = window as WindowWithKakao;
        if (cleanupWindow.kakao?.maps?.event) {
          // cleanupWindow.kakao.maps.event.removeListener(clickListener);
          // cleanupWindow.kakao.maps.event.removeListener(dragEndListener);  
          // cleanupWindow.kakao.maps.event.removeListener(zoomChangedListener);
        }
        if (debounceTimer) clearTimeout(debounceTimer);
      } catch {
        // 조용히 처리
      }
    };
  }, [effectiveMapInstance, effectiveMapStatus?.success, effectiveFacilities, handleFacilitySelect, onMapClick, updateLocation, fetchCongestionData, fetchWeatherData]);

  // 초기 데이터 로딩
  React.useEffect(() => {
    if (!effectiveMapInstance || !effectiveMapStatus?.success) return;
    
    const loadInitialData = async () => {
      try {
        // console.log('[MapView] 초기 위치 기반 데이터 로딩 시작...', currentLocation);
        // console.log('[MapView] fetchCongestionData:', typeof fetchCongestionData);
        // console.log('[MapView] fetchWeatherData:', typeof fetchWeatherData);
        
        const promises = [
          fetchCongestionData(currentLocation.lat, currentLocation.lng),
          fetchWeatherData(currentLocation.lat, currentLocation.lng)
        ];
        
        await Promise.allSettled(promises);
        // console.log('[MapView] 초기 위치 기반 데이터 로딩 완료');
      } catch (error) {
        console.error('[MapView] 초기 위치 기반 데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, [effectiveMapInstance, effectiveMapStatus?.success, currentLocation, fetchCongestionData, fetchWeatherData]);

  // POI 선택 핸들러 제거 - 이제 Facility로 통합됨

  const { markersCount } = useMapMarkers({
    mapInstance: effectiveMapInstance,
    mapStatus: effectiveMapStatus,
    visibleFacilities: filteredFacilities,
    onFacilitySelect: handleFacilitySelect,
    onClusterSelect: handleClusterSelect,
  });

  return (
    <div className='relative w-full h-full'>
      {/* 로딩 오버레이 */}
      {(loading || effectiveMapStatus?.loading) && (
        <div className='absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-md'>
          <div className='flex flex-col items-center justify-center h-full space-y-3'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <Skeleton className='h-4 w-48' />
          </div>
        </div>
      )}

      {/* 카카오 지도 */}
      <div id='kakaoMap' className='w-full h-full' />

      {/* 지도 오류 */}
      {effectiveMapStatus?.error && (
        <div className='absolute inset-4 z-20 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg text-center'>
            <p className='text-red-600 mb-4'>{effectiveMapStatus?.error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className='h-4 w-4 mr-2' />
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
        onToggleCongestion={toggleCongestionDisplay}
        showWeather={showWeather}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        onToggleWeather={toggleWeatherDisplay}
        onMoveToCurrentLocation={onMoveToCurrentLocation || (() => {})}
      />

      {/* 혼잡도 패널 오버레이 */}
      {showCongestion && <div className='fixed inset-0 z-24' onClick={toggleCongestionDisplay} />}

      {/* 혼잡도 패널 (아이콘 우측에 위치) */}
      {showCongestion && (
        <div className='absolute top-4 right-20 z-25'>
          <div className='relative'>
            {/* 말풍선 꼬리 */}
            <div className='absolute left-0 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white' />

            <CongestionPanel
              showCongestion={showCongestion}
              congestionData={congestionData}
              congestionLoading={congestionLoading}
              congestionError={congestionError}
              onRefresh={refreshCongestionData}
            />
          </div>
        </div>
      )}

      {/* 날씨 패널 오버레이 */}
      {showWeather && <div className='fixed inset-0 z-24' onClick={toggleWeatherDisplay} />}

      {/* 날씨 패널 (아이콘 우측에 위치) */}
      {showWeather && (
        <div className='absolute bottom-36 left-20 z-25'>
          <div className='relative'>
            {/* 말풍선 꼬리 */}
            <div className='absolute right-0 top-4 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white' />

            <WeatherPanel
              showWeather={showWeather}
              weatherData={weatherData}
              weatherLoading={weatherLoading}
              weatherError={weatherError}
              onRefresh={refreshWeatherData}
            />
          </div>
        </div>
      )}

      {/* 카테고리 토글 버튼 */}
      <div className='absolute top-4 left-4 z-30 flex gap-2'>
        {Object.entries(FACILITY_CATEGORIES).map(([key, category]) => {
          const count = effectiveFacilities.filter(f => f.category === category).length;
          const isActive = activeCategories.includes(category);

          if (count === 0 || key === 'SUBWAY') return null;

          const config = FACILITY_CONFIGS[category];

          return (
            <Button
              key={category}
              variant='outline'
              size='sm'
              onClick={() => handleToggleCategory(category)}
              className={`text-xs px-2 py-1 h-8 flex items-center gap-1 border ${
                isActive
                  ? `${config.color} text-white border-transparent`
                  : 'bg-white/90 text-gray-700 border-gray-300'
              }`}
            >
              <span className='w-4 h-4'>{config.icon}</span>
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
