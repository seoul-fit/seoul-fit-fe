'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  MapPin, Settings, Layers, Search, RefreshCw, Info, Navigation,
  Menu, Dumbbell, BookOpen, UtensilsCrossed, TreePine, Calendar,
  Users, Clock, ExternalLink, Star, Bell, Eye, EyeOff
} from "lucide-react";
import LoginButton from "@/components/LoginButton";
import { CongestionData, WeatherData } from '@/lib/types';
import { getCongestionClass, getCongestionColor, getNearestCongestionData } from '@/services/congestion';
import { getNearestWeatherData } from "@/services/weather";

// 카카오 맵 API 타입 정의
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  getLevel(): number;
  setLevel(level: number): void;
  relayout(): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
  setPosition(position: KakaoLatLng): void;
  setContent(content: string | HTMLElement): void;
  getPosition(): KakaoLatLng;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMarkerOptions {
  position: KakaoLatLng;
  title?: string;
}

interface KakaoCustomOverlayOptions {
  position: KakaoLatLng;
  content: string | HTMLElement;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
}

interface KakaoMapsAPI {
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  event: {
    addListener: (target: KakaoMap | KakaoMarker | KakaoCustomOverlay, type: string, handler: () => void) => void;
  };
  load: (callback: () => void) => void;
}

interface WindowWithKakao extends Window {
  kakao?: {
    maps?: KakaoMapsAPI;
  };
}

// 기존 타입 정의들
interface MapStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface LocationInfo {
  address: string;
  coords: { lat: number; lng: number };
  type: 'current' | 'searched';
}

interface FacilityType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  coords: { lat: number; lng: number };
  address: string;
  crowdLevel: 'low' | 'medium' | 'high';
  distance: number;
  isReservable: boolean;
  operatingHours: string;
  rating?: number;
  description?: string;
}

const INITIAL_FACILITY_TYPES: FacilityType[] = [
  { id: 'sports', name: '체육시설', icon: <Dumbbell className="h-4 w-4" />, color: '#3B82F6', enabled: true },
  { id: 'culture', name: '문화시설', icon: <Calendar className="h-4 w-4" />, color: '#8B5CF6', enabled: true },
  { id: 'food', name: '맛집', icon: <UtensilsCrossed className="h-4 w-4" />, color: '#EF4444', enabled: true },
  { id: 'library', name: '도서관', icon: <BookOpen className="h-4 w-4" />, color: '#10B981', enabled: true },
  { id: 'park', name: '공원', icon: <TreePine className="h-4 w-4" />, color: '#059669', enabled: true }
];

// 샘플 시설 데이터
const SAMPLE_FACILITIES: Facility[] = [
  {
    id: '1',
    name: '올림픽공원 체육관',
    type: 'sports',
    coords: { lat: 37.5219, lng: 127.1227 },
    address: '서울특별시 송파구 올림픽로 424',
    crowdLevel: 'medium',
    distance: 1.2,
    isReservable: true,
    operatingHours: '06:00-22:00',
    rating: 4.3,
    description: '올림픽공원 내 종합 체육시설'
  },
  {
    id: '2',
    name: '세종문화회관',
    type: 'culture',
    coords: { lat: 37.5720, lng: 126.9794 },
    address: '서울특별시 중구 세종대로 175',
    crowdLevel: 'high',
    distance: 0.8,
    isReservable: true,
    operatingHours: '09:00-18:00',
    rating: 4.6,
    description: '서울시 대표 문화예술 공연장'
  },
  {
    id: '3',
    name: '국립중앙도서관',
    type: 'library',
    coords: { lat: 37.5063, lng: 127.0366 },
    address: '서울특별시 서초구 반포대로 201',
    crowdLevel: 'low',
    distance: 2.1,
    isReservable: false,
    operatingHours: '09:00-18:00',
    rating: 4.4,
    description: '국내 최대 규모의 국립도서관'
  },
  {
    id: '4',
    name: '광화문 맛집거리',
    type: 'food',
    coords: { lat: 37.5663, lng: 126.9779 },
    address: '서울특별시 중구 세종대로 일대',
    crowdLevel: 'high',
    distance: 0.3,
    isReservable: false,
    operatingHours: '11:00-22:00',
    rating: 4.1,
    description: '전통과 현대가 어우러진 맛집 밀집지역'
  },
  {
    id: '5',
    name: '남산공원',
    type: 'park',
    coords: { lat: 37.5538, lng: 126.9810 },
    address: '서울특별시 중구 회현동1가 100-177',
    crowdLevel: 'medium',
    distance: 1.5,
    isReservable: false,
    operatingHours: '24시간',
    rating: 4.5,
    description: '서울 도심 속 대표적인 자연휴식공간'
  }
];

// 커스텀 마커
const createCustomMarkerContent = (facilityType: FacilityType, crowdLevel: string, facilityId: string): string => {
  // 혼잡도에 따른 배경색
  const getCrowdBgColor = (level: string): string => {
    switch (level) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // 아이콘 SVG 생성
  const getIconSVG = (typeId: string): string => {
    switch (typeId) {
      case 'sports':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`;
      case 'culture':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`;
      case 'food':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M15 2h4v6h-4z"/></svg>`;
      case 'library':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`;
      case 'park':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="m12 3 4 4H8l4-4Z"/><path d="m12 3 4 4H8l4-4Z"/><path d="M8 7h8v4H8z"/></svg>`;
      default:
        return ``;
    }
  };

  const crowdBgColor = getCrowdBgColor(crowdLevel);
  const iconSVG = getIconSVG(facilityType.id);

  return `
    <div id="marker-${facilityId}" class="custom-marker" style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: ${crowdBgColor};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      z-index: 1000;
    "
    onmouseover="this.style.transform='scale(1.1)'; this.style.zIndex='1001';"
    onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1000';"
    >
      <div style="color: white; display: flex; align-items: center; justify-content: center;">
        ${iconSVG}
      </div>
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${crowdBgColor};
      "></div>
    </div>
  `;
};

export default function SeoulFitMapApp() {
  // 상태 관리
  const [mapStatus, setMapStatus] = useState<MapStatus>({
    loading: true,
    error: null,
    success: false
  });

  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
  const [mapLevel, setMapLevel] = useState<number>(3);
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>(INITIAL_FACILITY_TYPES);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [initialLocationSet, setInitialLocationSet] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [showCongestion, setShowCongestion] = useState<boolean>(false); // 혼잡도 표시 여부
  const [congestionData, setCongestionData] = useState<CongestionData | null>(null); // 혼잡도 데이터
  const [congestionLoading, setCongestionLoading] = useState<boolean>(false); // 혼잡도 로딩 상태
  const [congestionError, setCongestionError] = useState<string | null>(null); // 혼잡도 에러
  const [showWeather, setShowWeather] = useState<boolean>(false); // 날씨 표시 여부
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null); // 날씨 데이터
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false); // 날씨 로딩 상태
  const [weatherError, setWeatherError] = useState<string | null>(null); // 날씨 에러

  // useRef로 커스텀 오버레이 관리
  const customOverlaysRef = useRef<KakaoCustomOverlay[]>([]);

  // 지도 이벤트 리스너 중복 실행 방지
  const mapEventListenersSetRef = useRef<boolean>(false);

  // 혼잡도 조회
  const fetchCongestionData = useCallback(async (lat: number, lng: number) => {
    setCongestionLoading(true);
    setCongestionError(null);

    try {
      // 현재 위치 기준으로 가장 가까운 장소의 혼잡도 조회
      const data = await getNearestCongestionData(lat, lng);

      if (data) {
        setCongestionData(data);
        setCongestionError(null);
      } else {
        console.warn('혼잡도 데이터가 없습니다.');
        setCongestionError('현재 위치 주변의 혼잡도 정보를 찾을 수 없습니다.');
        setCongestionData(null);
      }
    } catch (error) {
      console.error('혼잡도 데이터 조회 실패:', error);
      setCongestionError('혼잡도 정보를 불러오는데 실패했습니다.');
      setCongestionData(null);
    } finally {
      setCongestionLoading(false);
    }
  }, []);

  // 날씨 조회
  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      // 현재 위치 기준으로 가장 가까운 장소의 날씨 조회
      const data = await getNearestWeatherData(lat, lng);

      if (data) {
        setWeatherData(data);
        setWeatherError(null);
      } else {
        console.warn('날씨 데이터가 없습니다.');
        setWeatherError('현재 위치 주변의 날씨 정보를 찾을 수 없습니다.');
        setWeatherData(null);
      }
    } catch (error) {
      console.error('날씨 데이터 조회 실패:', error);
      setWeatherError('날씨 정보를 불러오는데 실패했습니다.');
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // 지도 중앙 위치 업데이트
  const updateMapCenterLocation = useCallback(async (map: KakaoMap) => {
    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    try {
      // 현재 지도 중심 좌표 가져오기
      const center = map.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();

      // 현재 위치 정보 업데이트
      setCurrentLocation({
        address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`,
        coords: { lat, lng },
        type: 'current'
      });

      // 혼잡도 표시가 켜져 있으면 새로운 위치의 혼잡도 조회
      if (showCongestion) {
        await fetchCongestionData(lat, lng);
      }

      // 날씨 표시가 켜져 있으면 새로운 위치의 날씨 조회
      if (showWeather) {
        await fetchWeatherData(lat, lng);
      }
    } catch (error) {
      console.error('지도 중심 위치 업데이트 실패:', error);
    }
  }, [showCongestion, fetchCongestionData, showWeather, fetchWeatherData]);

  // 혼잡도 버튼
  const toggleCongestionDisplay = useCallback(async () => {
    const newShowState = !showCongestion;
    setShowCongestion(newShowState);

    if (newShowState && currentLocation && !congestionData) {
      // 혼잡도 데이터가 없으면 새로 조회
      await fetchCongestionData(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [showCongestion, congestionData, fetchCongestionData, currentLocation]);

  // 혼잡도 새로고침
  const refreshCongestionData = useCallback(async () => {
    if (currentLocation) {
      await fetchCongestionData(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [fetchCongestionData, currentLocation]);

  // 날씨 버튼
  const toggleWeatherDisplay = useCallback(async () => {
    const newShowState = !showWeather;
    setShowWeather(newShowState);

    if (newShowState && currentLocation && !weatherData) {
      // 날씨 데이터가 없으면 새로 조회
      await fetchWeatherData(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [showWeather, weatherData, fetchWeatherData, currentLocation]);

  // 날씨 새로고침
  const refreshWeatherData = useCallback(async () => {
    if (currentLocation) {
      await fetchWeatherData(currentLocation.coords.lat, currentLocation.coords.lng);
    }
  }, [fetchWeatherData, currentLocation]);

  // 활성화된 시설 필터링
  const enabledFacilityTypes = useMemo(() =>
          facilityTypes.filter(type => type.enabled),
      [facilityTypes]
  );

  const visibleFacilities = useMemo(() =>
          SAMPLE_FACILITIES.filter(facility =>
              enabledFacilityTypes.some(type => type.id === facility.type)
          ),
      [enabledFacilityTypes]
  );

  // 지도 초기화
  const initializeMap = useCallback(() => {
    const API_KEY = '8bb6267aba6b69af4605b7fd2dd75c96';

    setMapStatus({ loading: true, error: null, success: false });
    mapEventListenersSetRef.current = false; // 지도 이벤트 리스너 초기화

    // 기존 스크립트 정리
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&autoload=false&libraries=services`;

    script.onload = () => {
      const windowWithKakao = window as WindowWithKakao;
      if (windowWithKakao.kakao?.maps?.load) {
        windowWithKakao.kakao.maps.load(() => {
          try {
            const container = document.getElementById('kakaoMap');
            if (container && windowWithKakao.kakao?.maps) {
              const kakaoMaps = windowWithKakao.kakao.maps;

              // 현재 위치가 없으면 서울시청을 기본값으로 사용
              const initialLat = currentLocation?.coords.lat || 37.5666805;
              const initialLng = currentLocation?.coords.lng || 126.9784147;

              const options: KakaoMapOptions = {
                center: new kakaoMaps.LatLng(initialLat, initialLng),
                level: mapLevel
              };

              const map = new kakaoMaps.Map(container, options);
              setMapInstance(map);

              // 현재 위치 정보가 없을 때만 기본 위치 정보 설정
              if (!currentLocation) {
                setCurrentLocation({
                  address: '서울특별시 중구 세종대로 110',
                  coords: { lat: 37.5666805, lng: 126.9784147 },
                  type: 'current'
                });
              }

              // 지도 이벤트 리스너
              if (!mapEventListenersSetRef.current) {
                // 지도 로드 완료 이벤트
                kakaoMaps.event.addListener(map, 'tilesloaded', () => {
                  setMapStatus({ loading: false, error: null, success: true });
                });

                // 줌 레벨 변경 이벤트 - 지도 중심 위치도 함께 업데이트
                kakaoMaps.event.addListener(map, 'zoom_changed', () => {
                  const newLevel = map.getLevel();
                  setMapLevel(newLevel);
                  updateMapCenterLocation(map); // 줌 변경 시 중심 위치 업데이트
                });

                // 지도 이동 완료 이벤트 - 드래그로 이동했을 때
                kakaoMaps.event.addListener(map, 'dragend', () => {
                  updateMapCenterLocation(map); // 드래그 완료 시 중심 위치 업데이트
                });

                // 지도 중심 좌표 변경 이벤트 - 프로그래밍 방식으로 중심이 변경되었을 때
                kakaoMaps.event.addListener(map, 'center_changed', () => {
                  updateMapCenterLocation(map); // 중심 좌표 변경 시 위치 업데이트
                });

                mapEventListenersSetRef.current = true; // 중복 등록 방지 플래그 설정
              }
            }
          } catch (error) {
            setMapStatus({
              loading: false,
              error: `지도 생성 실패: ${error}`,
              success: false
            });
          }
        });
      }
    };

    script.onerror = () => {
      setMapStatus({
        loading: false,
        error: '카카오 지도 스크립트 로드 실패',
        success: false
      });
    };

    document.head.appendChild(script);
  }, [currentLocation, mapLevel, updateMapCenterLocation]);

  // 커스텀 마커 업데이트 (기존 마커 대신 CustomOverlay 사용)
  useEffect(() => {
    if (!mapInstance || !mapStatus.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    // 기존 커스텀 오버레이 제거
    customOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    customOverlaysRef.current = [];

    // 새 커스텀 오버레이 생성
    customOverlaysRef.current = visibleFacilities.map(facility => {
      const facilityType = facilityTypes.find(type => type.id === facility.type);
      if (!facilityType) return null;

      const overlayPosition = new kakaoMaps.LatLng(
          facility.coords.lat,
          facility.coords.lng
      );

      // 커스텀 마커 HTML 생성 - facility.id 전달
      const markerContent = createCustomMarkerContent(facilityType, facility.crowdLevel, facility.id);

      // CustomOverlay 생성
      const customOverlay = new kakaoMaps.CustomOverlay({
        position: overlayPosition,
        content: markerContent,
        xAnchor: 0.5,  // 중앙 정렬
        yAnchor: 1,    // 하단 정렬 (핀 포인트)
        zIndex: 1000
      });

      customOverlay.setMap(mapInstance);

      // 마커 클릭 이벤트를 위한 고유 ID로 이벤트 리스너 추가
      setTimeout(() => {
        const markerId = `marker-${facility.id}`;
        const markerElement = document.getElementById(markerId);
        if (markerElement) {
          // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
          markerElement.replaceWith(markerElement.cloneNode(true));
          const newMarkerElement = document.getElementById(markerId);
          if (newMarkerElement) {
            newMarkerElement.addEventListener('click', () => {
              setSelectedFacility(facility);
            });
          }
        }
      }, 100);

      return customOverlay;
    }).filter((overlay): overlay is KakaoCustomOverlay => overlay !== null);
  }, [mapInstance, mapStatus.success, visibleFacilities, facilityTypes]);

  // 선호도 토글
  const toggleFacilityType = (typeId: string) => {
    setFacilityTypes(prev =>
        prev.map(type =>
            type.id === typeId ? { ...type, enabled: !type.enabled } : type
        )
    );
  };

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (navigator.geolocation && mapInstance) {
      const windowWithKakao = window as WindowWithKakao;
      if (!windowWithKakao.kakao?.maps) return;

      const kakaoMaps = windowWithKakao.kakao.maps;

      navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const moveLatLng = new kakaoMaps.LatLng(lat, lng);

            // 지도 중심 이동
            mapInstance.setCenter(moveLatLng);
            mapInstance.setLevel(3);

            // 현재 위치 정보 업데이트
            setCurrentLocation({
              address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`,
              coords: { lat, lng },
              type: 'current'
            });

            // 혼잡도 표시가 켜져 있으면 새로운 위치의 혼잡도 조회
            if (showCongestion) {
              await fetchCongestionData(lat, lng);
            }

            // 날씨 표시가 켜져 있으면 새로운 위치의 날씨 조회
            if (showWeather) {
              await fetchWeatherData(lat, lng);
            }
          },
          (error) => {
            setMapStatus(prev => ({
              ...prev,
              error: `위치 정보를 가져올 수 없습니다: ${error.message}`
            }));
          }
      );
    }
  }, [mapInstance, showCongestion, fetchCongestionData, showWeather, fetchWeatherData]);

  // 초기 위치 현재 위치로 변경되도록
  useEffect(() => {
    // 지도 로드가 완료되고 아직 초기 위치가 설정되지 않았을 때
    if (mapStatus.success && mapInstance && !initialLocationSet) {
      setInitialLocationSet(true); // 중복 실행 방지
      moveToCurrentLocation();
    }
  }, [mapStatus.success, mapInstance, initialLocationSet, moveToCurrentLocation]);

  // 지도 새로고침
  const refreshMap = useCallback(() => {
    if (mapInstance) {
      mapInstance.relayout();
    } else {
      initializeMap();
    }
  }, [mapInstance, initializeMap]);

  // 혼잡도 색상
  const getCrowdColor = (level: string): string => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // 혼잡도 텍스트
  const getCrowdText = (level: string): string => {
    switch (level) {
      case 'low': return '여유';
      case 'medium': return '보통';
      case 'high': return '혼잡';
      default: return '정보없음';
    }
  };

  // 상태 표시 색상
  const getStatusColor = (status: MapStatus): 'default' | 'destructive' | 'secondary' => {
    if (status.loading) return 'secondary';
    if (status.error) return 'destructive';
    return 'default';
  };

  const getStatusText = (status: MapStatus): string => {
    if (status.loading) return '지도 로딩중...';
    if (status.error) return '오류 발생';
    if (status.success) return '지도 로드 완료';
    return '대기중';
  };

  useEffect(() => {
    initializeMap();

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 커스텀 오버레이 정리
      customOverlaysRef.current.forEach(overlay => overlay.setMap(null));
      customOverlaysRef.current = [];

      // 스크립트 정리
      const scriptToRemove = document.querySelector('script[src*="dapi.kakao.com"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [initializeMap]);

  return (
      <div className="container mx-auto p-4 space-y-4">
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Seoul Fit</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              AI 기반 공공시설 통합 네비게이터
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(mapStatus)} className="gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${
                  mapStatus.success ? 'bg-green-500' :
                      mapStatus.error ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              {getStatusText(mapStatus)}
            </Badge>

            <LoginButton />

            {/* 알림 버튼 */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 && (
                        <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center min-w-[1.25rem]">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-53">
                  <DropdownMenuItem>
                    알림 목록
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Menu className="mr-2 h-4 w-4" />
                    알림 1
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Menu className="mr-2 h-4 w-4" />
                    알림 2
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Menu className="mr-2 h-4 w-4" />
                    알림 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 선호도 설정 시트 */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>선호도 설정</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">표시할 시설 유형</Label>
                    {facilityTypes.map((type) => (
                        <div key={type.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-3">
                            <div style={{ color: type.color }}>
                              {type.icon}
                            </div>
                            <Label htmlFor={type.id} className="text-sm">
                              {type.name}
                            </Label>
                          </div>
                          <Switch
                              id={type.id}
                              checked={type.enabled}
                              onCheckedChange={() => toggleFacilityType(type.id)}
                          />
                        </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">현재 표시 중인 시설</Label>
                    <div className="text-sm text-muted-foreground">
                      총 {visibleFacilities.length}개 시설이 표시됩니다
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enabledFacilityTypes.map((type) => (
                          <Badge key={type.id} variant="secondary" className="text-xs">
                            {type.name}
                          </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={refreshMap}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  지도 새로고침
                </DropdownMenuItem>
                <DropdownMenuItem onClick={moveToCurrentLocation}>
                  <Navigation className="mr-2 h-4 w-4" />
                  현재 위치로 이동
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 혼잡도 에러 알림 */}
        {congestionError && showCongestion && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>{congestionError}</AlertDescription>
            </Alert>
        )}

        {/* 날씨 에러 알림 */}
        {weatherError && showWeather && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>{weatherError}</AlertDescription>
            </Alert>
        )}

        {/* 에러 알림 */}
        {mapStatus.error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>{mapStatus.error}</AlertDescription>
            </Alert>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 지도 영역 */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">실시간 지도</CardTitle>
                <div className="flex items-center gap-2">
                  {/* 혼잡도 상태 표시 배지 */}
                  {showCongestion && congestionData && (
                      <Badge
                          className={`${getCongestionClass(congestionData.AREA_CONGEST_LVL)} text-xs`}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        {congestionData.AREA_CONGEST_LVL}
                      </Badge>
                  )}

                  {/* 혼잡도 보기/숨기기 버튼 */}
                  <Button
                      variant={showCongestion ? "default" : "outline"}
                      size="sm"
                      onClick={toggleCongestionDisplay}
                      disabled={congestionLoading}
                      className="flex items-center gap-2"
                  >
                    {showCongestion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    혼잡도 {showCongestion ? '숨기기' : '보기'}
                    {congestionLoading && <div className="ml-1 h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />}
                  </Button>

                  {/* 날씨 보기/숨기기 버튼 */}
                  <Button
                      variant={showWeather ? "default" : "outline"}
                      size="sm"
                      onClick={toggleWeatherDisplay}
                      disabled={weatherLoading}
                      className="flex items-center gap-2"
                  >
                    {showWeather ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    날씨 {showWeather ? '숨기기' : '보기'}
                    {weatherLoading && <div className="ml-1 h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {mapStatus.loading && (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-md">
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                )}

                <div
                    id="kakaoMap"
                    className="w-full h-[400px] md:h-[500px] rounded-md border bg-muted"
                />

                {/* 혼잡도 정보 패널 */}
                {showCongestion && (
                    <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">근처 주요 장소 혼잡도</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshCongestionData}
                            disabled={congestionLoading}
                            className="h-6 w-6 p-0"
                        >
                          <RefreshCw className={`h-3 w-3 ${congestionLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>

                      {congestionLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="h-4 w-4 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                              조회중...
                            </div>
                          </div>
                      ) : congestionData ? (
                          <div className="space-y-2">
                            {/* 장소명 */}
                            <div className="text-xs text-gray-600 truncate">
                              📍 {congestionData.AREA_NM}
                            </div>

                            {/* 혼잡도 레벨 */}
                            <div className="flex items-center justify-between">
                              <Badge
                                  className={`${getCongestionClass(congestionData.AREA_CONGEST_LVL)} text-xs`}
                              >
                                {congestionData.AREA_CONGEST_LVL}
                              </Badge>
                            </div>

                            {/* 혼잡도 메시지 */}
                            {congestionData.AREA_CONGEST_MSG && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  💬 {congestionData.AREA_CONGEST_MSG}
                                </div>
                            )}
                          </div>
                      ) : congestionError ? (
                          <div className="text-xs text-red-500 text-center py-2">
                            정보를 불러올 수 없습니다
                          </div>
                      ) : (
                          <div className="text-xs text-gray-500 text-center py-2">
                            혼잡도 정보가 없습니다
                          </div>
                      )}

                      {/* 혼잡도 범례 */}
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">범례</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {[
                            { level: '여유', color: getCongestionColor('여유') },
                            { level: '보통', color: getCongestionColor('보통') },
                            { level: '약간 붐빔', color: getCongestionColor('약간 붐빔') },
                            { level: '붐빔', color: getCongestionColor('붐빔') },
                          ].map(({ level, color }) => (
                              <div key={level} className="flex items-center gap-1">
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-gray-600">{level}</span>
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                )}

                {/* 날씨 정보 패널 */}
                {showWeather && (
                    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">근처 날씨</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshWeatherData}
                            disabled={weatherLoading}
                            className="h-6 w-6 p-0"
                        >
                          <RefreshCw className={`h-3 w-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>

                      {weatherLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="h-4 w-4 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                              조회중...
                            </div>
                          </div>
                      ) : weatherData ? (
                          <div className="space-y-2">
                            {/* 장소명 */}
                            <div className="text-xs text-gray-600 truncate">
                              📍 {weatherData.AREA_NM}
                            </div>

                            {/* 기온 */}
                            {weatherData.TEMP && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  🌡️ 현재 기온 {weatherData.TEMP}도
                                  <br/>
                                  🌡️ 체감 기온 {weatherData.SENSIBLE_TEMP}도
                                  <br/>
                                  🔆 오늘 최고 기온 {weatherData.MAX_TEMP}도
                                  <br/>
                                  🌙 오늘 최저 기온 {weatherData.MIN_TEMP}도
                                </div>
                            )}

                            {/* 날씨 메시지 */}
                            {weatherData.PCP_MSG && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  {weatherData.PCP_MSG}
                                  <br/>
                                  {weatherData.UV_MSG}
                                </div>
                            )}

                            {/* 미세먼지 */}
                            {weatherData.PM25_INDEX && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  미세먼지 : {weatherData.PM10_INDEX}
                                  <br/>
                                  초미세먼지 : {weatherData.PM25_INDEX}
                                </div>
                            )}
                          </div>
                      ) : weatherError ? (
                          <div className="text-xs text-red-500 text-center py-2">
                            정보를 불러올 수 없습니다
                          </div>
                      ) : (
                          <div className="text-xs text-gray-500 text-center py-2">
                            날씨 정보가 없습니다
                          </div>
                      )}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 사이드바 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">시설 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 혼잡도 요약 */}
              {showCongestion && congestionData && (
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">주변 혼잡도</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">장소 : </span>
                        <span className="font-medium truncate ml-2">{congestionData.AREA_NM}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">상태 : </span>
                        <Badge
                            className={`${getCongestionClass(congestionData.AREA_CONGEST_LVL)} text-xs ml-2`}
                        >
                          {congestionData.AREA_CONGEST_LVL}
                        </Badge>
                      </div>
                    </div>
                  </div>
              )}

              {selectedFacility ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-base">{selectedFacility.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedFacility.address}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`${getCrowdColor(selectedFacility.crowdLevel)} text-white text-xs`}>
                        <Users className="w-3 h-3 mr-1" />
                        {getCrowdText(selectedFacility.crowdLevel)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedFacility.distance}km
                      </Badge>
                    </div>

                    {selectedFacility.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{selectedFacility.rating}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{selectedFacility.operatingHours}</span>
                      </div>
                    </div>

                    {selectedFacility.description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFacility.description}
                        </p>
                    )}

                    {selectedFacility.isReservable && (
                        <Button className="w-full" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          예약하기
                        </Button>
                    )}
                  </div>
              ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      지도의 마커를 클릭하여<br />
                      상세 정보를 확인하세요
                    </p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}