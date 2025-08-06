// hooks/useCurrentLocationMarker.ts
import { useEffect, useRef, useCallback } from 'react';
import type { KakaoMap, KakaoMarker, WindowWithKakao } from '@/lib/kakao-map';

interface UseCurrentLocationMarkerProps {
  mapInstance: KakaoMap | null;
  mapStatus: { success: boolean };
  currentLocation: { coords: { lat: number; lng: number } } | null;
}

export const useCurrentLocationMarker = ({
  mapInstance,
  mapStatus,
  currentLocation
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

    // 새 마커 생성 (카카오 기본 마커)
    const marker = new kakaoMaps.Marker({
      position: new kakaoMaps.LatLng(lat, lng),
      title: '현재 위치'
    });

    marker.setMap(mapInstance);
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