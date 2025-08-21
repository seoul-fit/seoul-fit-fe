import { useState, useCallback, useEffect, useRef } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';
import { useLocationTrigger } from './useLocationTrigger';

export interface LocationInfo {
  address: string;
  coords: { lat: number; lng: number };
  type: 'current' | 'searched';
  // 기존 코드 호환성
  latitude?: number;
  longitude?: number;
}

// Simple location interface for testing
export interface SimpleLocation {
  lat: number;
  lng: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Simple useLocation hook for testing (overloaded function)
export function useLocation(): {
  location: SimpleLocation | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
  watchId: number | null;
  getCurrentLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
};

export function useLocation(options: LocationOptions): {
  location: SimpleLocation | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  accuracy: number | null;
  watchId: number | null;
  getCurrentLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
};

// Kakao Map version
export function useLocation(mapInstance: any): {
  currentLocation: LocationInfo | null;
  moveToCurrentLocation: () => void;
  setCurrentLocation: (location: LocationInfo | null) => void;
};

export function useLocation(mapInstanceOrOptions?: any): any {
  // If no arguments or options object, return simple location hook
  if (!mapInstanceOrOptions || (mapInstanceOrOptions && typeof mapInstanceOrOptions === 'object' && !mapInstanceOrOptions.setCenter)) {
    const options = mapInstanceOrOptions as LocationOptions | undefined;
    const [location, setLocation] = useState<SimpleLocation | null>(null);
    const [error, setError] = useState<GeolocationPositionError | null>(null);
    const [loading, setLoading] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 300000,
      ...options,
    };

    const getCurrentLocation = useCallback(() => {
      if (!navigator.geolocation) {
        setError({
          code: 0,
          message: 'Geolocation is not supported',
        } as GeolocationPositionError);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAccuracy(position.coords.accuracy);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setLoading(false);
        },
        defaultOptions
      );
    }, [defaultOptions]);

    const watchPosition = useCallback(() => {
      if (!navigator.geolocation) {
        setError({
          code: 0,
          message: 'Geolocation is not supported',
        } as GeolocationPositionError);
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setAccuracy(position.coords.accuracy);
        },
        (err) => {
          setError(err);
        },
        defaultOptions
      );

      setWatchId(id);
    }, [defaultOptions]);

    const stopWatching = useCallback(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    }, [watchId]);

    useEffect(() => {
      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }, [watchId]);

    return {
      location,
      error,
      loading,
      accuracy,
      watchId,
      getCurrentLocation,
      watchPosition,
      stopWatching,
    };
  }

  // Kakao Map version (existing implementation)
  const mapInstance = mapInstanceOrOptions;
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
}