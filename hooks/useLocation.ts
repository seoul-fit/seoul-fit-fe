import { useState, useCallback, useEffect, useRef } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';
import { useLocationTrigger } from './useLocationTrigger';

interface LocationInfo {
  address: string;
  coords: { lat: number; lng: number };
  type: 'current' | 'searched';
}

export const useLocation = (mapInstance: KakaoMap | null) => {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { handleLocationChange } = useLocationTrigger();

  // 실시간 위치 추적 시작 (자동)
  const startLocationTracking = useCallback(() => {
    if (!mapInstance || !navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      console.log('이미 위치 추적 중');
      return;
    }

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    console.log('실시간 위치 추적 시작');

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 지도 중심을 새 위치로 이동
        mapInstance.setCenter(new kakaoMaps.LatLng(lat, lng));

        const coords = { lat, lng };
        setCurrentLocation({
          address: '현재 위치',
          coords,
          type: 'current',
        });

        // 위치 변화 시 트리거 호출
        handleLocationChange(coords);
      },
      error => {
        console.error('GPS 오류:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    watchIdRef.current = watchId;
  }, [mapInstance]);

  // 현재 위치로 이동하고 추적 시작
  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstance || !navigator.geolocation) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        mapInstance.setCenter(new kakaoMaps.LatLng(lat, lng));
        mapInstance.setLevel(3);

        const coords = { lat, lng };
        setCurrentLocation({
          address: '현재 위치',
          coords,
          type: 'current',
        });

        // 위치 변화 시 트리거 호출
        handleLocationChange(coords);

        // 실시간 추적 시작
        setTimeout(() => {
          startLocationTracking();
        }, 500);
      },
      error => {
        console.error('위치 오류:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [mapInstance, startLocationTracking]);

  // 지도 로드 시 자동으로 위치 추적 시작
  useEffect(() => {
    if (mapInstance && !currentLocation) {
      const timer = setTimeout(() => {
        moveToCurrentLocation();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mapInstance, currentLocation, moveToCurrentLocation]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    currentLocation,
    moveToCurrentLocation,
    setCurrentLocation,
  };
};
