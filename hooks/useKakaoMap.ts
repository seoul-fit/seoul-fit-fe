// hooks/useKakaoMap.ts
import { useState, useEffect, useCallback } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';

interface MapPosition {
  lat: number;
  lng: number;
}

interface UseKakaoMapOptions {
  containerId: string;
  center: MapPosition;
  level?: number;
}

export const useKakaoMap = ({ containerId, center, level = 3 }: UseKakaoMapOptions) => {
  const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
  const [mapStatus, setMapStatus] = useState({
    loading: true,
    success: false,
    error: null as string | null,
  });

  const initializeMap = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      setMapStatus({ loading: true, success: false, error: null });

      // 이미 로드되어 있으면 바로 지도 생성
      const windowWithKakao = window as WindowWithKakao;
      if (windowWithKakao.kakao?.maps) {
        createMap();
        return;
      }

      // 스크립트 로드
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
      script.async = true;

      script.onload = () => {
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps) {
          windowWithKakao.kakao.maps.load(() => {
            createMap();
          });
        }
      };

      script.onerror = () => {
        setMapStatus({ loading: false, success: false, error: '카카오맵 로드 실패' });
      };

      document.head.appendChild(script);
    } catch (error) {
      setMapStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : '지도 초기화 실패',
      });
    }
  }, [containerId]);

  const createMap = () => {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        setMapStatus({ loading: false, success: false, error: '지도 컨테이너를 찾을 수 없습니다' });
        return;
      }

      const windowWithKakao = window as WindowWithKakao;
      if (!windowWithKakao.kakao?.maps) {
        setMapStatus({ loading: false, success: false, error: '카카오맵 API를 찾을 수 없습니다' });
        return;
      }

      const kakaoMaps = windowWithKakao.kakao.maps;
      const map = new kakaoMaps.Map(container, {
        center: new kakaoMaps.LatLng(center.lat, center.lng),
        level: level,
        scrollwheel: true,
        disableDoubleClick: false,
        disableDoubleClickZoom: false,
      });

      // 부드러운 줌 애니메이션 설정
      map.setZoomable(true);

      setMapInstance(map);
      setMapStatus({ loading: false, success: true, error: null });
    } catch (error) {
      setMapStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : '지도 생성 실패',
      });
    }
  };

  useEffect(() => {
    initializeMap();
  }, []);

  const setCenter = useCallback(
    (position: MapPosition) => {
      if (mapInstance && typeof window !== 'undefined') {
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps) {
          const newCenter = new windowWithKakao.kakao.maps.LatLng(position.lat, position.lng);
          mapInstance.setCenter(newCenter);
        }
      }
    },
    [mapInstance]
  );

  const setLevel = useCallback(
    (newLevel: number) => {
      if (mapInstance) {
        mapInstance.setLevel(newLevel);
      }
    },
    [mapInstance]
  );

  return {
    mapInstance,
    mapStatus,
    setCenter,
    setLevel,
  };
};
