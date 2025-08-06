// hooks/useMapMarkers.ts
import { useEffect, useRef, useCallback } from 'react';
import type { KakaoMap, KakaoCustomOverlay, WindowWithKakao } from '@/lib/kakao-map';
import { createCustomMarkerContent } from '@/utils/marker';
import type { Facility, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';

interface UseMapMarkersProps {
  mapInstance: KakaoMap | null;
  mapStatus: { success: boolean; loading: boolean; error: string | null };
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

  // 모든 마커 제거
  const clearMarkers = useCallback(() => {
    customOverlaysRef.current.forEach(overlay => {
      try {
        overlay.setMap(null);
      } catch (error) {
        console.warn('마커 제거 중 오류:', error);
      }
    });
    customOverlaysRef.current = [];
  }, []);

  // 마커 생성
  const createMarkers = useCallback(() => {
    if (!mapInstance || !mapStatus.success) return;

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
            console.warn(`시설 카테고리 설정을 찾을 수 없습니다: ${facility.category}`);
            return null;
          }

          const overlayPosition = new kakaoMaps.LatLng(
            facility.position.lat,
            facility.position.lng
          );

          const markerContent = createCustomMarkerContent(
            facility.category,
            facility.congestionLevel,
            facility.id
          );

          const customOverlay = new kakaoMaps.CustomOverlay({
            position: overlayPosition,
            content: markerContent,
            xAnchor: 0.5,  // 중앙 정렬
            yAnchor: 1,    // 하단 정렬 (핀 포인트)
            zIndex: 1000
          });

          customOverlay.setMap(mapInstance);

          // 마커 클릭 이벤트 설정 (비동기 처리)
          setTimeout(() => {
            try {
              const markerId = `marker-${facility.id}`;
              const markerElement = document.getElementById(markerId);
              if (markerElement) {
                // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
                const newElement = markerElement.cloneNode(true) as HTMLElement;
                markerElement.parentNode?.replaceChild(newElement, markerElement);
                
                newElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFacilitySelect(facility);
                });

                // 호버 효과를 위한 추가 이벤트
                newElement.addEventListener('mouseenter', () => {
                  newElement.style.transform = 'scale(1.1)';
                  newElement.style.zIndex = '1001';
                });

                newElement.addEventListener('mouseleave', () => {
                  newElement.style.transform = 'scale(1)';
                  newElement.style.zIndex = '1000';
                });
              }
            } catch (error) {
              console.warn(`마커 이벤트 설정 실패 (ID: ${facility.id}):`, error);
            }
          }, 100);

          return customOverlay;
        } catch (error) {
          console.error(`마커 생성 실패 (ID: ${facility.id}):`, error);
          return null;
        }
      })
      .filter((overlay): overlay is KakaoCustomOverlay => overlay !== null);

    customOverlaysRef.current = newOverlays;
  }, [mapInstance, mapStatus.success, visibleFacilities, onFacilitySelect, clearMarkers]);

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
      console.warn(`마커 하이라이트 실패 (ID: ${facilityId}):`, error);
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
          console.warn(`마커 표시/숨김 실패 (ID: ${facility.id}):`, error);
        }
      });
  }, [visibleFacilities]);

  // 시설 변경 시 마커 업데이트
  useEffect(() => {
    createMarkers();
  }, [createMarkers]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return {
    clearMarkers,
    createMarkers,
    highlightMarker,
    clearAllHighlights,
    toggleCategoryMarkers,
    markersCount: customOverlaysRef.current.length
  };
};