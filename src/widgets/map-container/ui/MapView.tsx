// components/map/MapView.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { RefreshCw } from 'lucide-react';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';

import { CongestionPanel } from './CongestionPanel';
import { WeatherPanel } from './WeatherPanel';
import { MapControls } from './MapControls';
import { MapStatusIndicator } from './MapStatusIndicator';
// import { FacilityBottomSheet } from './FacilityBottomSheet'; // 사용하지 않음
import { useMapMarkers } from '@/shared/lib/hooks/useMapMarkers';
import { useCongestion } from '@/shared/lib/hooks/useCongestion';
import { useWeather } from '@/shared/lib/hooks/useWeather';
import { useCurrentLocationMarker } from '@/shared/lib/hooks/useCurrentLocationMarker';
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
  
  // 줌 레벨 레퍼런스로 관리 (재렌더링 방지)
  const currentZoomRef = React.useRef(3);
  const hasLoggedDataRef = React.useRef(false);
  
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
  
  // 초기 로드 시 데이터 확인 (한 번만)
  React.useEffect(() => {
    if (facilities.length > 0 && !hasLoggedDataRef.current) {
      hasLoggedDataRef.current = true;
      console.log('[MapView] 시설 데이터 로드 완료:', {
        facilitiesCount: facilities.length,
        activeCategories,
        currentLocation
      });
    }
  }, [facilities.length]);

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
  
  // 화면 영역 기반 마커 필터링 (줌 레벨별 모든 마커 표시)
  const getVisibleFacilities = React.useCallback(() => {
    const categoryFiltered = getFilteredFacilities();
    
    if (!effectiveMapInstance) return categoryFiltered;
    
    try {
      // 현재 지도의 화면 영역 가져오기
      const bounds = effectiveMapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const zoomLevel = effectiveMapInstance.getLevel();
      
      // 줌 레벨별 여유 마진 설정 (더 넓은 영역의 데이터 미리 로드)
      let marginRatio = 0.2; // 기본 20% 여유
      
      // 줌 레벨이 높을수록(멀리 볼수록) 마진을 줄임
      if (zoomLevel <= 3) {
        marginRatio = 0.1; // 가까이서 볼 때는 10%
      } else if (zoomLevel <= 6) {
        marginRatio = 0.15; // 중간 거리 15%
      } else if (zoomLevel <= 9) {
        marginRatio = 0.2; // 20%
      } else {
        marginRatio = 0.25; // 아주 멀리서 볼 때는 25%
      }
      
      const latMargin = (ne.getLat() - sw.getLat()) * marginRatio;
      const lngMargin = (ne.getLng() - sw.getLng()) * marginRatio;
      
      // 화면 영역 내의 모든 시설 필터링
      const visibleFacilities = categoryFiltered.filter(facility => {
        const lat = facility.position.lat;
        const lng = facility.position.lng;
        return lat >= (sw.getLat() - latMargin) && 
               lat <= (ne.getLat() + latMargin) && 
               lng >= (sw.getLng() - lngMargin) && 
               lng <= (ne.getLng() + lngMargin);
      });
      
      console.log(`[MapView] 줌 레벨 ${zoomLevel}: 화면 영역 내 ${visibleFacilities.length}개 시설 (전체 ${categoryFiltered.length}개 중)`);
      
      // 줌 레벨별 축척 정보 (참고용)
      const scaleInfo = {
        1: '20m', 2: '30m', 3: '50m', 4: '100m', 5: '250m',
        6: '500m', 7: '1km', 8: '2km', 9: '4km', 10: '8km',
        11: '16km', 12: '32km', 13: '64km', 14: '128km'
      };
      
      console.log(`[MapView] 현재 축척: ${scaleInfo[zoomLevel as keyof typeof scaleInfo] || 'unknown'}`);
      
      return visibleFacilities;
    } catch (error) {
      console.error('시설 필터링 중 오류:', error);
      return categoryFiltered;
    }
  }, [getFilteredFacilities, effectiveMapInstance, facilities.length, activeCategories]); // 필요한 의존성 추가
  
  // 디바운싱된 시설 목록 (지도 이동 시 즉시 업데이트하지 않음)
  const [debouncedFacilities, setDebouncedFacilities] = useState<Facility[]>(() => {
    // 초기값으로 현재 보이는 시설들을 설정
    return getVisibleFacilities();
  });
  
  // 줌 업데이트 트리거 (줌 변경 시 강제 업데이트)
  const [zoomUpdateTrigger, setZoomUpdateTrigger] = useState(0);
  
  React.useEffect(() => {
    // activeCategories, facilities, 또는 줌이 변경되었을 때 실행
    const timer = setTimeout(() => {
      const visible = getVisibleFacilities();
      setDebouncedFacilities(visible);
      console.log(`[MapView] 시설 업데이트: ${visible.length}개 (전체: ${facilities.length}개 중)`);
    }, 50); // 더 빠른 반응을 위해 디바운싱 시간 단축
    
    return () => clearTimeout(timer);
  }, [activeCategories, facilities.length, effectiveMapInstance, getVisibleFacilities, zoomUpdateTrigger]); // zoomUpdateTrigger 의존성 추가
  
  const filteredFacilities = debouncedFacilities;

  // 디버깅 로그 제거 (반복 로그 방지)
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

    // 지도 이동 시에는 데이터를 업데이트하지 않음
    // 사용자가 명시적으로 위치를 변경할 때만 업데이트
    
    // 줌 변경 핸들러 - 마커 업데이트 트리거
    const handleZoomChanged = () => {
      const newZoom = effectiveMapInstance.getLevel();
      const oldZoom = currentZoomRef.current;
      
      if (oldZoom !== newZoom) {
        currentZoomRef.current = newZoom;
        // 줌이 변경되면 항상 업데이트 (화면 영역이 바뀌므로)
        setZoomUpdateTrigger(prev => prev + 1);
      }
    };
    
    // 지도 이동 완료 핸들러
    const handleDragEnd = () => {
      // 지도 이동이 완료되면 화면 영역 내 마커 업데이트
      console.log('[MapView] 지도 이동 완료');
      setZoomUpdateTrigger(prev => prev + 1);
    };

    const clickListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'click',
      handleMapClick
    );

    const zoomChangedListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'zoom_changed',
      handleZoomChanged
    );
    
    // 지도 이동 완료 시 마커 업데이트
    const dragEndListener = windowWithKakao.kakao.maps.event.addListener(
      effectiveMapInstance,
      'dragend',
      handleDragEnd
    );

    return () => {
      try {
        const cleanupWindow = window as WindowWithKakao;
        if (cleanupWindow.kakao?.maps?.event) {
          // 이벤트 리스너 제거는 카카오맵이 자동으로 처리
        }
      } catch {
        // 조용히 처리
      }
    };
  }, [effectiveMapInstance, effectiveMapStatus?.success, effectiveFacilities, handleFacilitySelect, onMapClick, updateLocation, fetchCongestionData, fetchWeatherData]);

  // 초기 데이터 로딩은 위치 확인 후에 수행됨 (삭제)

  const { markersCount } = useMapMarkers({
    mapInstance: effectiveMapInstance,
    mapStatus: {
      success: effectiveMapStatus?.success ?? false,
      loading: effectiveMapStatus?.loading ?? false,
      error: effectiveMapStatus?.error ?? null,
    },
    visibleFacilities: filteredFacilities,
    onFacilitySelect: handleFacilitySelect,
    onClusterSelect: handleClusterSelect,
  });
  
  // 초기 위치 획득 및 데이터 로드 (지도가 준비되면 실행)
  const hasInitializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!navigator.geolocation) return;
    if (!effectiveMapInstance || !effectiveMapStatus?.success) return;
    if (hasInitializedRef.current) return; // 이미 실행했으면 스킵
    
    hasInitializedRef.current = true;
    console.log('[MapView] 현재 위치 가져오기 시작');
    
    // 먼저 사용자의 현재 위치를 가져온 후 지도를 이동하고 데이터를 로드
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`[MapView] 현재 위치 획득: (${lat}, ${lng})`);
        
        // 지도 중심을 사용자 위치로 이동
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps && effectiveMapInstance) {
          effectiveMapInstance.setCenter(new windowWithKakao.kakao.maps.LatLng(lat, lng));
          effectiveMapInstance.setLevel(3);
          currentZoomRef.current = 3;
        }
        
        // 위치 이동 후 데이터 로드 (강제 업데이트)
        console.log('[MapView] 사용자 위치로 데이터 로드 시작');
        const startTime = Date.now();
        await updateLocation(lat, lng);
        console.log(`[MapView] 데이터 로드 시간: ${Date.now() - startTime}ms`);
        
        // 혼잡도, 날씨 데이터도 로드
        await Promise.all([
          fetchCongestionData(lat, lng),
          fetchWeatherData(lat, lng)
        ]);
        
        console.log('[MapView] 초기 데이터 로드 완료');
      },
      async (error) => {
        console.error('[MapView] 위치 가져오기 실패:', error);
        // 실패 시에도 데이터는 로드하지 않음 (초기 위치 사용)
        console.log('[MapView] 위치 획득 실패, 기본 위치 사용');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [effectiveMapInstance, effectiveMapStatus?.success, updateLocation, fetchCongestionData, fetchWeatherData]); // 지도 준비 시 실행
  
  // 현재 위치 마커 표시 (위치 변경 시에만 업데이트)
  useCurrentLocationMarker({
    mapInstance: effectiveMapInstance,
    mapStatus: {
      success: effectiveMapStatus?.success ?? false,
      loading: effectiveMapStatus?.loading ?? false,
      error: effectiveMapStatus?.error ?? null
    },
    currentLocation: { coords: { lat: currentLocation.lat, lng: currentLocation.lng } },
    onLocationChange: React.useCallback((lat: number, lng: number) => {
      // 위치가 크게 변경되었을 때만 업데이트
      console.log(`[현재위치 변경] (${lat}, ${lng})`);
    }, []),
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
        onToggleCongestion={() => toggleCongestionDisplay(currentLocation)}
        showWeather={showWeather}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        onToggleWeather={() => toggleWeatherDisplay(currentLocation)}
        onMoveToCurrentLocation={onMoveToCurrentLocation || (() => {})}
      />

      {/* 혼잡도 패널 오버레이 */}
      {showCongestion && (
        <div className='fixed inset-0 z-40' onClick={() => toggleCongestionDisplay()} />
      )}

      {/* 혼잡도 패널 (아이콘 우측에 위치) */}
      {showCongestion && (
        <div className='absolute top-16 right-4 z-50 transition-all duration-300 ease-out'>
          <div className='relative'>
            {/* 말풍선 꼬리 */}
            <div className='absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white' />

            <CongestionPanel
              showCongestion={showCongestion}
              congestionData={congestionData}
              congestionLoading={congestionLoading}
              congestionError={congestionError}
              onRefresh={() => refreshCongestionData(currentLocation)}
            />
          </div>
        </div>
      )}

      {/* 날씨 패널 오버레이 */}
      {showWeather && (
        <div className='fixed inset-0 z-40' onClick={() => toggleWeatherDisplay()} />
      )}

      {/* 날씨 패널 (아이콘 우측에 위치) */}
      {showWeather && (
        <div className='absolute bottom-24 md:bottom-20 left-16 z-50 transition-all duration-300 ease-out'>
          <div className='relative'>
            {/* 말풍선 꼬리 */}
            <div className='absolute -left-2 top-6 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white' />

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
