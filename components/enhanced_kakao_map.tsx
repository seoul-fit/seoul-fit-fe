'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MapPin, Settings, Layers, Search, RefreshCw, Info, Navigation } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export default function EnhancedKakaoMap() {
  const [mapStatus, setMapStatus] = useState<MapStatus>({
    loading: true,
    error: null,
    success: false
  });
  
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapLevel, setMapLevel] = useState(3);

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
      if ((window as any).kakao?.maps?.load) {
        (window as any).kakao.maps.load(() => {
          try {
            const container = document.getElementById('kakaoMap');
            if (container) {
              const options = {
                center: new (window as any).kakao.maps.LatLng(37.5666805, 126.9784147),
                level: mapLevel
              };
              
              const map = new (window as any).kakao.maps.Map(container, options);
              setMapInstance(map);
              
              // 초기 위치 정보 설정
              setCurrentLocation({
                address: '서울특별시 중구 세종대로 110',
                coords: { lat: 37.5666805, lng: 126.9784147 },
                type: 'current'
              });
              
              // 지도 이벤트 리스너
              (window as any).kakao.maps.event.addListener(map, 'tilesloaded', () => {
                setMapStatus({ loading: false, error: null, success: true });
              });

              // 줌 레벨 변경 이벤트
              (window as any).kakao.maps.event.addListener(map, 'zoom_changed', () => {
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

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (navigator.geolocation && mapInstance) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const moveLatLng = new (window as any).kakao.maps.LatLng(lat, lng);
          
          mapInstance.setCenter(moveLatLng);
          
          // 마커 추가
          const marker = new (window as any).kakao.maps.Marker({
            position: moveLatLng
          });
          marker.setMap(mapInstance);

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

  // 지도 새로고침
  const refreshMap = useCallback(() => {
    if (mapInstance) {
      mapInstance.relayout();
    } else {
      initializeMap();
    }
  }, [mapInstance, initializeMap]);

  useEffect(() => {
    initializeMap();

    return () => {
      const scriptToRemove = document.querySelector('script[src*="dapi.kakao.com"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [initializeMap]);

  const getStatusColor = (status: MapStatus): 'default' | 'destructive' | 'secondary' => {
    if (status.loading) return 'secondary';
    if (status.error) return 'destructive';
    return 'default';
  };

  const getStatusText = (status: MapStatus) => {
    if (status.loading) return '지도 로딩중...';
    if (status.error) return '오류 발생';
    if (status.success) return '지도 로드 완료';
    return '대기중';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Seoul Fit Map</h1>
          <p className="text-muted-foreground">
            AI 기반 공공시설 통합 네비게이터
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(mapStatus)} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${
              mapStatus.success ? 'bg-green-500' : 
              mapStatus.error ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            {getStatusText(mapStatus)}
          </Badge>
          
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                className="w-full h-[500px] rounded-md border bg-muted"
              />
              
              {/* 지도 컨트롤 */}
              <div className="absolute bottom-4 right-4 space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => mapInstance?.setLevel(mapLevel - 1)}
                  disabled={mapLevel <= 1}
                >
                  +
                </Button>
                <div className="text-center text-xs px-2 py-1 bg-background rounded border">
                  {mapLevel}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => mapInstance?.setLevel(mapLevel + 1)}
                  disabled={mapLevel >= 14}
                >
                  -
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 현재 위치 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                현재 위치
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentLocation ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {currentLocation.address}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {currentLocation.coords.lat.toFixed(4)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {currentLocation.coords.lng.toFixed(4)}
                    </Badge>
                  </div>
                </>
              ) : (
                <Skeleton className="h-16 w-full" />
              )}
            </CardContent>
          </Card>

          {/* 빠른 액션 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">빠른 액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                주변 체육시설 찾기
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                도서관 검색
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    <Info className="mr-2 h-4 w-4" />
                    시설 상세 정보
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>시설 상세 정보</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">이용 현황</h3>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary rounded-full" />
                      </div>
                      <p className="text-sm text-muted-foreground">현재 75% 이용중</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">운영 시간</h3>
                      <p className="text-sm">09:00 - 22:00</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">예상 대기시간</h3>
                      <Badge variant="secondary">약 15분</Badge>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}