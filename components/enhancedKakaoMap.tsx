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
  Users, Clock, ExternalLink, Star
} from "lucide-react";
import LoginButton from "@/components/LoginButton";

// 카카오 맵 API 타입 정의
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getLevel(): number;
  setLevel(level: number): void;
  relayout(): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

interface KakaoMarkerOptions {
  position: KakaoLatLng;
  title?: string;
}

interface KakaoMapsAPI {
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
  event: {
    addListener: (target: KakaoMap | KakaoMarker, type: string, handler: () => void) => void;
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
  { id: 'food', name: '맛집', icon: <UtensilsCrossed className="h-4 w-4" />, color: '#EF4444', enabled: false },
  { id: 'library', name: '도서관', icon: <BookOpen className="h-4 w-4" />, color: '#10B981', enabled: false },
  { id: 'park', name: '공원', icon: <TreePine className="h-4 w-4" />, color: '#059669', enabled: false }
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

  // useRef로 마커 관리 (상태 변경으로 인한 리렌더링 방지)
  const markersRef = useRef<KakaoMarker[]>([]);

  // 활성화된 시설 필터링 (메모화로 성능 최적화)
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
              const options: KakaoMapOptions = {
                center: new kakaoMaps.LatLng(37.5666805, 126.9784147),
                level: mapLevel
              };

              const map = new kakaoMaps.Map(container, options);
              setMapInstance(map);

              // 기본 위치 정보
              setCurrentLocation({
                address: '서울특별시 중구 세종대로 110',
                coords: { lat: 37.5666805, lng: 126.9784147 },
                type: 'current'
              });

              // 지도 이벤트 리스너
              kakaoMaps.event.addListener(map, 'tilesloaded', () => {
                setMapStatus({ loading: false, error: null, success: true });
              });

              // 줌 레벨 변경 이벤트
              kakaoMaps.event.addListener(map, 'zoom_changed', () => {
                setMapLevel(map.getLevel());
              });
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
  }, [mapLevel]);

  // 마커 업데이트 (useRef 사용으로 무한 루프 방지)
  useEffect(() => {
    if (!mapInstance || !mapStatus.success) return;

    const windowWithKakao = window as WindowWithKakao;
    if (!windowWithKakao.kakao?.maps) return;

    const kakaoMaps = windowWithKakao.kakao.maps;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 새 마커 생성
    const newMarkers = visibleFacilities.map(facility => {
      const facilityType = facilityTypes.find(type => type.id === facility.type);
      if (!facilityType) return null;

      const markerPosition = new kakaoMaps.LatLng(
          facility.coords.lat,
          facility.coords.lng
      );

      const marker = new kakaoMaps.Marker({
        position: markerPosition,
        title: facility.name
      });

      marker.setMap(mapInstance);

      // 마커 클릭 이벤트
      kakaoMaps.event.addListener(marker, 'click', () => {
        setSelectedFacility(facility);
      });

      return marker;
    }).filter((marker): marker is KakaoMarker => marker !== null);

    markersRef.current = newMarkers;
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
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const moveLatLng = new kakaoMaps.LatLng(lat, lng);

            mapInstance.setCenter(moveLatLng);
            mapInstance.setLevel(3);

            setCurrentLocation({
              address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`,
              coords: { lat, lng },
              type: 'current'
            });
          },
          (error) => {
            setMapStatus(prev => ({
              ...prev,
              error: `위치 정보를 가져올 수 없습니다: ${error.message}`
            }));
          }
      );
    }
  }, [mapInstance]);

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
      // 마커 정리
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

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
                  <Button variant="outline" size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    검색
                  </Button>
                  <Button variant="outline" size="sm">
                    <Layers className="mr-2 h-4 w-4" />
                    레이어
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
              </div>
            </CardContent>
          </Card>

          {/* 사이드바 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">시설 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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