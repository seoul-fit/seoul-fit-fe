// hooks/useMapMarkers.ts
import { useEffect, useRef, useCallback } from 'react';
import type { KakaoMap, KakaoCustomOverlay, WindowWithKakao } from '@/lib/kakao-map';
import { createCustomMarkerContent } from '@/utils/marker';
import type { Facility, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

// 디바운싱 유틸리티
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface UseMapMarkersProps {
  mapInstance: KakaoMap | null | undefined;
  mapStatus: { success: boolean; loading: boolean; error: string | null } | undefined;
  visibleFacilities: Facility[];
  onFacilitySelect: (facility: Facility) => void;
}

export const useMapMarkers = ({
  mapInstance,
  mapStatus,
  visibleFacilities,
  onFacilitySelect
}: UseMapMarkersProps) => {
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const facilityDataRef = useRef<Map<string, Facility>>(new Map());
  const mapListenersRef = useRef<any[]>([]);

  // 개선된 이벤트 바인딩 함수 (재시도 로직 포함)
  const bindMarkerEvent = useCallback((facility: Facility, retries = 3): void => {
    const markerId = `marker-${facility.id}`;
    const markerElement = document.getElementById(markerId);
    
    if (markerElement) {
      // 이미 이벤트가 바인딩되어 있는지 확인
      if (markerElement.onclick) {
        return;
      }
      
      // 클릭 이벤트 바인딩
      markerElement.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onFacilitySelect(facility);
      };

      // 호버 효과
      markerElement.onmouseenter = () => {
        markerElement.style.transform = 'scale(1.1)';
        markerElement.style.zIndex = '1001';
      };

      markerElement.onmouseleave = () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = '1000';
      };
    } else if (retries > 0) {
      // DOM 요소가 없으면 재시도 (재시도 횟수 줄임)
      const delay = 50 * (4 - retries);
      setTimeout(() => bindMarkerEvent(facility, retries - 1), delay);
    } else {
      // 디버그 모드에서만 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.debug(`마커 DOM 요소를 찾을 수 없음 (ID: ${facility.id})`);
      }
    }
  }, [onFacilitySelect]);

  // 특정 마커의 이벤트 바인딩 상태 확인
  const hasMarkerEvent = useCallback((facilityId: string): boolean => {
    const markerElement = document.getElementById(`marker-${facilityId}`);
    return markerElement?.onclick !== null;
  }, []);

  // 모든 마커의 이벤트 재바인딩
  const rebindAllMarkerEvents = useCallback(() => {
    facilityDataRef.current.forEach((facility, facilityId) => {
      if (!hasMarkerEvent(facilityId)) {
        bindMarkerEvent(facility);
      }
    });
  }, [bindMarkerEvent, hasMarkerEvent]);

  // 디바운싱된 재바인딩 함수
  const debouncedRebind = useCallback(
    debounce(rebindAllMarkerEvents, 300),
    [rebindAllMarkerEvents]
  );

  // 모든 마커 제거
  const clearMarkers = useCallback(() => {
    customOverlaysRef.current.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch (error) {
        console.error('마커 제거 중 오류:', error);
      }
    });
    customOverlaysRef.current = [];
    facilityDataRef.current.clear();
  }, []);

  // 마커 생성
  const createMarkers = useCallback(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    // 기존 마커 제거
    clearMarkers();

    // 새 커스텀 오버레이 생성
    const newOverlays = visibleFacilities
      .map(facility => {
        try {
          // 시설 설정 정보 가져오기 (FACILITY_CONFIGS 활용)
          const facilityConfig = FACILITY_CONFIGS[facility.category];
          if (!facilityConfig) {
            console.error(`시설 카테고리 설정을 찾을 수 없습니다: ${facility.category}`);
            return null;
          }

          const overlayPosition = new kakaoMaps.LatLng(
            facility.position.lat,
            facility.position.lng
          );

          const markerContent = createCustomMarkerContent(
            facility.category,
            facility.congestionLevel,
            facility.id,
            facility
          );

          const customOverlay = new kakaoMaps.CustomOverlay({
            position: overlayPosition,
            content: markerContent,
            xAnchor: 0.5,  // 중앙 정렬
            yAnchor: 1,    // 하단 정렬 (핀 포인트)
            zIndex: 1000
          });

          customOverlay.setMap(mapInstance);

          // 시설 데이터 저장
          facilityDataRef.current.set(facility.id, facility);

          // 개선된 이벤트 바인딩 (재시도 로직 포함)
          bindMarkerEvent(facility);

          return customOverlay;
        } catch (error) {
          console.error(`마커 생성 실패 (ID: ${facility.id}):`, error);
          return null;
        }
      })
      .filter((overlay): overlay is KakaoCustomOverlay => overlay !== null);

    customOverlaysRef.current = newOverlays;
  }, [mapInstance, mapStatus?.success, visibleFacilities, onFacilitySelect, clearMarkers, bindMarkerEvent]);

  // 특정 시설의 마커 하이라이트
  const highlightMarker = useCallback((facilityId: string, highlight: boolean = true) => {
    try {
      const markerElement = document.getElementById(`marker-${facilityId}`);
      if (markerElement) {
        if (highlight) {
          markerElement.style.transform = 'scale(1.2)';
          markerElement.style.zIndex = '1002';
          markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
        } else {
          markerElement.style.transform = 'scale(1)';
          markerElement.style.zIndex = '1000';
          markerElement.style.filter = 'none';
        }
      }
    } catch (error) {
      console.error(`마커 하이라이트 실패 (ID: ${facilityId}):`, error);
    }
  }, []);

  // 모든 마커 하이라이트 해제
  const clearAllHighlights = useCallback(() => {
    visibleFacilities.forEach(facility => {
      highlightMarker(facility.id, false);
    });
  }, [visibleFacilities, highlightMarker]);

  // 특정 카테고리의 마커만 표시/숨김
  const toggleCategoryMarkers = useCallback((category: FacilityCategory, visible: boolean) => {
    visibleFacilities
      .filter(facility => facility.category === category)
      .forEach(facility => {
        try {
          const markerElement = document.getElementById(`marker-${facility.id}`);
          if (markerElement) {
            markerElement.style.display = visible ? 'block' : 'none';
          }
        } catch (error) {
          console.error(`마커 표시/숨김 실패 (ID: ${facility.id}):`, error);
        }
      });
  }, [visibleFacilities]);

  // 시설 변경 시 마커 업데이트
  useEffect(() => {
    createMarkers();
  }, [createMarkers]);

  // 지도 이벤트 리스너 등록 (확대/축소/이동 시 마커 이벤트 재바인딩)
  useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    // 지도 이벤트 리스너들
    const zoomListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance, 
      'zoom_changed', 
      debouncedRebind
    );

    const centerListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance, 
      'center_changed', 
      debouncedRebind
    );

    const dragEndListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance, 
      'dragend', 
      debouncedRebind
    );

    // 리스너 참조 저장
    mapListenersRef.current = [zoomListener, centerListener, dragEndListener];

    return () => {
      // 이벤트 리스너 제거
      try {
        const cleanupWindow = window as WindowWithKakao;
        const kakaoMaps = cleanupWindow.kakao?.maps;
        if (kakaoMaps?.event) {
          mapListenersRef.current.forEach(listener => {
            (kakaoMaps.event as any).removeListener(listener);
          });
        }
      } catch (error) {
        console.warn('지도 이벤트 리스너 제거 실패:', error);
      }
      mapListenersRef.current = [];
    };
  }, [mapInstance, mapStatus?.success, debouncedRebind]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 지도 이벤트 리스너 제거
      try {
        const cleanupWindow = window as WindowWithKakao;
        const kakaoMaps = cleanupWindow.kakao?.maps;
        if (kakaoMaps?.event) {
          mapListenersRef.current.forEach(listener => {
            (kakaoMaps.event as any).removeListener(listener);
          });
        }
      } catch (error) {
        console.warn('지도 이벤트 리스너 제거 실패:', error);
      }
      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    clearMarkers,
    createMarkers,
    highlightMarker,
    clearAllHighlights,
    toggleCategoryMarkers,
    rebindAllMarkerEvents,
    markersCount: customOverlaysRef.current.length
  };
};