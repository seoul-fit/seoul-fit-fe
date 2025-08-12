// hooks/useMapMarkers.ts - Improved version with better event handling
import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { KakaoMap, KakaoCustomOverlay, WindowWithKakao } from '@/lib/kakao-map';
import { createCustomMarkerContent } from '@/utils/marker';
import type { Facility, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

// 개선된 디바운싱 유틸리티
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
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
  const eventBindingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 시설 데이터 메모화
  const facilitiesMap = useMemo(() => {
    const map = new Map<string, Facility>();
    visibleFacilities.forEach(facility => {
      map.set(facility.id, facility);
    });
    return map;
  }, [visibleFacilities]);

  // 개선된 이벤트 바인딩 함수
  const bindMarkerEvent = useCallback((facility: Facility): void => {
    const markerId = `marker-${facility.id}`;
    const markerElement = document.getElementById(markerId);
    
    if (!markerElement) return;
    
    // 이미 이벤트가 바인딩되어 있는지 확인
    if (markerElement.dataset.eventBound === 'true') return;
    
    // 클릭 이벤트 바인딩 (이벤트 위임 방식 사용)
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onFacilitySelect(facility);
    };

    const handleMouseEnter = () => {
      markerElement.style.transform = 'scale(1.1)';
      markerElement.style.zIndex = '1001';
      markerElement.style.transition = 'transform 0.2s ease-out';
    };

    const handleMouseLeave = () => {
      markerElement.style.transform = 'scale(1)';
      markerElement.style.zIndex = '1000';
    };

    // 이벤트 리스너 추가
    markerElement.addEventListener('click', handleClick);
    markerElement.addEventListener('mouseenter', handleMouseEnter);
    markerElement.addEventListener('mouseleave', handleMouseLeave);
    
    // 이벤트 바인딩 완료 표시
    markerElement.dataset.eventBound = 'true';
    
    // 정리 함수를 위한 참조 저장
    markerElement.dataset.cleanup = 'pending';
  }, [onFacilitySelect]);

  // 배치로 이벤트 바인딩
  const bindAllMarkerEvents = useCallback(() => {
    facilitiesMap.forEach((facility) => {
      bindMarkerEvent(facility);
    });
  }, [facilitiesMap, bindMarkerEvent]);

  // 최적화된 디바운싱 함수
  const debouncedEventBinding = useCallback(
    debounce(bindAllMarkerEvents, 150, false),
    [bindAllMarkerEvents]
  );

  // 모든 마커 제거 (메모리 누수 방지)
  const clearMarkers = useCallback(() => {
    // 기존 이벤트 리스너 정리
    facilityDataRef.current.forEach((facility) => {
      const markerElement = document.getElementById(`marker-${facility.id}`);
      if (markerElement && markerElement.dataset.cleanup === 'pending') {
        // 이벤트 리스너 제거는 overlay.setMap(null)에서 자동으로 처리됨
        markerElement.dataset.eventBound = 'false';
        markerElement.dataset.cleanup = 'done';
      }
    });

    // 커스텀 오버레이 제거
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

  // 마커 생성 (성능 최적화)
  const createMarkers = useCallback(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    // 기존 마커 제거
    clearMarkers();

    // 새 커스텀 오버레이 생성 (배치 처리)
    const newOverlays: KakaoCustomOverlay[] = [];
    
    visibleFacilities.forEach(facility => {
      try {
        const facilityConfig = FACILITY_CONFIGS[facility.category];
        if (!facilityConfig) {
          console.warn(`시설 카테고리 설정을 찾을 수 없습니다: ${facility.category}`);
          return;
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
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 1000
        });

        customOverlay.setMap(mapInstance);
        newOverlays.push(customOverlay);

        // 시설 데이터 저장
        facilityDataRef.current.set(facility.id, facility);
      } catch (error) {
        console.error(`마커 생성 실패 (ID: ${facility.id}):`, error);
      }
    });

    customOverlaysRef.current = newOverlays;

    // 이벤트 바인딩 (약간의 지연 후 실행)
    if (eventBindingTimeoutRef.current) {
      clearTimeout(eventBindingTimeoutRef.current);
    }
    
    eventBindingTimeoutRef.current = setTimeout(() => {
      bindAllMarkerEvents();
    }, 100);
  }, [mapInstance, mapStatus?.success, visibleFacilities, clearMarkers, bindAllMarkerEvents]);

  // 특정 시설의 마커 하이라이트 (성능 최적화)
  const highlightMarker = useCallback((facilityId: string, highlight: boolean = true) => {
    const markerElement = document.getElementById(`marker-${facilityId}`);
    if (!markerElement) return;

    if (highlight) {
      markerElement.style.transform = 'scale(1.2)';
      markerElement.style.zIndex = '1002';
      markerElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
      markerElement.style.transition = 'all 0.2s ease-out';
    } else {
      markerElement.style.transform = 'scale(1)';
      markerElement.style.zIndex = '1000';
      markerElement.style.filter = 'none';
      markerElement.style.transition = 'all 0.2s ease-out';
    }
  }, []);

  // 모든 마커 하이라이트 해제
  const clearAllHighlights = useCallback(() => {
    facilityDataRef.current.forEach((_, facilityId) => {
      highlightMarker(facilityId, false);
    });
  }, [highlightMarker]);

  // 특정 카테고리의 마커만 표시/숨김
  const toggleCategoryMarkers = useCallback((category: FacilityCategory, visible: boolean) => {
    facilityDataRef.current.forEach((facility, facilityId) => {
      if (facility.category === category) {
        const markerElement = document.getElementById(`marker-${facilityId}`);
        if (markerElement) {
          markerElement.style.display = visible ? 'block' : 'none';
          markerElement.style.transition = 'opacity 0.2s ease-out';
          markerElement.style.opacity = visible ? '1' : '0';
        }
      }
    });
  }, []);

  // 시설 변경 시 마커 업데이트
  useEffect(() => {
    createMarkers();
  }, [createMarkers]);

  // 지도 이벤트 리스너 등록 (최적화)
  useEffect(() => {
    if (!mapInstance || !mapStatus?.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    // 지도 이벤트 리스너들 (디바운싱 적용)
    const zoomListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance, 
      'zoom_changed', 
      debouncedEventBinding
    );

    const dragEndListener = windowWithKakao.kakao.maps.event.addListener(
      mapInstance, 
      'dragend', 
      debouncedEventBinding
    );

    // 리스너 참조 저장
    mapListenersRef.current = [zoomListener, dragEndListener];

    return () => {
      // 이벤트 리스너 제거
      try {
        const cleanupWindow = window as WindowWithKakao;
        const kakaoMaps = cleanupWindow.kakao?.maps;
        if (kakaoMaps?.event) {
          mapListenersRef.current.forEach(listener => {
            kakaoMaps.event.removeListener(listener);
          });
        }
      } catch (error) {
        console.warn('지도 이벤트 리스너 제거 실패:', error);
      }
      mapListenersRef.current = [];
    };
  }, [mapInstance, mapStatus?.success, debouncedEventBinding]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 타이머 정리
      if (eventBindingTimeoutRef.current) {
        clearTimeout(eventBindingTimeoutRef.current);
      }
      
      // 지도 이벤트 리스너 제거
      try {
        const cleanupWindow = window as WindowWithKakao;
        const kakaoMaps = cleanupWindow.kakao?.maps;
        if (kakaoMaps?.event) {
          mapListenersRef.current.forEach(listener => {
            kakaoMaps.event.removeListener(listener);
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
    rebindAllMarkerEvents: bindAllMarkerEvents,
    markersCount: customOverlaysRef.current.length
  };
};
