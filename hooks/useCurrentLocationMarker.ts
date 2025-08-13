// hooks/useCurrentLocationMarker.ts
import { useEffect, useRef, useCallback } from 'react';
import type { KakaoMap, KakaoMarker, WindowWithKakao } from '@/lib/kakao-map';

// 디바운싱 유틸리티
const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface UseCurrentLocationMarkerProps {
  mapInstance: KakaoMap | null;
  mapStatus: { success: boolean };
  currentLocation: { coords: { lat: number; lng: number } } | null;
  onLocationChange?: (lat: number, lng: number) => void;
}

export const useCurrentLocationMarker = ({
  mapInstance,
  mapStatus,
  currentLocation,
  onLocationChange
}: UseCurrentLocationMarkerProps) => {
  const markerRef = useRef<KakaoMarker | null>(null);

  // 마커 생성
  const createMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstance || !mapStatus.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 새 마커 생성 (드래그 가능한 마커)
    const marker = new kakaoMaps.Marker({
      position: new kakaoMaps.LatLng(lat, lng),
      title: '현재 위치 (드래그하여 이동 가능)',
      draggable: true
    });

    marker.setMap(mapInstance);
    
    // 드래그 종료 시 위치 업데이트 (디바운싱 적용)
    const debouncedLocationChange = debounce((lat: number, lng: number) => {
      if (onLocationChange) {
        console.log(`마커 드래그로 위치 변경: ${lat}, ${lng}`);
        onLocationChange(lat, lng);
      }
    }, 1000); // 1초 디바운싱
    
    kakaoMaps.event.addListener(marker, 'dragend', () => {
      const position = marker.getPosition();
      const newLat = position.getLat();
      const newLng = position.getLng();
      
      // 지도 중심을 마커 위치로 이동
      mapInstance.setCenter(position);
      
      // 디바운싱된 위치 변경 콜백 호출
      debouncedLocationChange(newLat, newLng);
    });
    
    markerRef.current = marker;
  }, [mapInstance, mapStatus.success]);

  // 현재 위치 있으면 마커 생성
  useEffect(() => {
    if (currentLocation?.coords) {
      createMarker(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [currentLocation, createMarker]);

  // 정리
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  return {};
};