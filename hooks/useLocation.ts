// hooks/useLocation.ts
import { useState, useCallback, useEffect } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/lib/kakao-map';

interface LocationInfo {
  address: string;
  coords: { lat: number; lng: number };
  type: 'current' | 'searched';
}

export const useLocation = (mapInstance: KakaoMap | null) => {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (!mapInstance) {
      console.error('지도 인스턴스 없음');
      return;
    }
    
    if (!navigator.geolocation) {
      console.error('GPS 지원 안함');
      alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) {
      console.error('카카오맵 API 없음');
      return;
    }

    const kakaoMaps = windowWithKakao.kakao.maps;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        mapInstance.setCenter(new kakaoMaps.LatLng(lat, lng));
        mapInstance.setLevel(3);

        setCurrentLocation({
          address: '현재 위치',
          coords: { lat, lng },
          type: 'current'
        });
      },
      (error) => {
        console.error('GPS 실패:', error.message);
        // 위치 권한이 거부되었을 때 사용자에게 알림
        if (error.code === error.PERMISSION_DENIED) {
          alert('위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert('위치 정보를 사용할 수 없습니다.');
        } else if (error.code === error.TIMEOUT) {
          alert('위치 요청 시간이 초과되었습니다.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  }, [mapInstance]);

  // 지도 로드 시 바로 현재 위치로 이동 (한 번만 실행)
  useEffect(() => {
    if (mapInstance && !currentLocation) {
      // 약간의 지연을 두고 현재 위치 요청 (지도 초기화 완료 후)
      const timer = setTimeout(() => {
        moveToCurrentLocation();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [mapInstance, currentLocation]);

  return {
    currentLocation,
    moveToCurrentLocation,
    setCurrentLocation
  };
};