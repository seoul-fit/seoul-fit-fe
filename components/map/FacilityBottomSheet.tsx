// components/map/FacilityBottomSheet.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, MapPin, Clock, Phone, Users, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Facility, CongestionData, WeatherData } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';
import { getNearestCongestionData } from '@/services/congestion';
import { getNearestWeatherData } from '@/services/weather';

interface FacilityBottomSheetProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FacilityBottomSheet: React.FC<FacilityBottomSheetProps> = ({
  facility,
  isOpen,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [congestionData, setCongestionData] = useState<CongestionData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
      // 시설 정보가 열릴 때 혼잡도와 날씨 데이터 로드
      if (facility) {
        loadAdditionalData(facility.position.lat, facility.position.lng);
      }
    }
  }, [isOpen, facility]);

  const loadAdditionalData = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const [congestion, weather] = await Promise.all([
        getNearestCongestionData(lat, lng),
        getNearestWeatherData(lat, lng)
      ]);
      setCongestionData(congestion);
      setWeatherData(weather);
    } catch (error) {
      console.error('추가 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    
    if (deltaY > 50) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -50) {
      setIsExpanded(true);
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    
    if (deltaY > 50) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -50) {
      setIsExpanded(true);
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  }, [isDragging, currentY, startY, isExpanded, onClose]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!facility || !isOpen) return null;

  const config = FACILITY_CONFIGS[facility.category];
  const translateY = isDragging ? Math.max(0, currentY - startY) : 0;

  return (
    <>
      {/* 오버레이 */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${isExpanded ? 'h-[80vh]' : 'h-auto max-h-[50vh]'}`}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center text-white`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
              <p className="text-sm text-gray-500">{config.label}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 pb-6 overflow-y-auto">
          {/* 기본 정보 */}
          <div className="space-y-3 mb-6">
            {facility.address && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{facility.address}</p>
              </div>
            )}
            
            {facility.operatingHours && (
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{facility.operatingHours}</p>
              </div>
            )}
            
            {facility.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <a 
                  href={`tel:${facility.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {facility.phone}
                </a>
              </div>
            )}
          </div>

          {/* 확장된 내용 */}
          {isExpanded && (
            <div className="space-y-4">
              {/* 혼잡도 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  혼잡도 정보
                </h4>
                {loading ? (
                  <p className="text-sm text-gray-500">로딩 중...</p>
                ) : congestionData ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">지역:</span>
                      <span className="text-gray-900">{congestionData.AREA_NM}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">혼잡도:</span>
                      <span className={`font-medium ${
                        congestionData.AREA_CONGEST_LVL === '여유' ? 'text-green-600' :
                        congestionData.AREA_CONGEST_LVL === '보통' ? 'text-yellow-600' :
                        congestionData.AREA_CONGEST_LVL === '약간 붐빔' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {congestionData.AREA_CONGEST_LVL}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {congestionData.AREA_CONGEST_MSG}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">혼잡도 정보 없음</p>
                )}
              </div>

              {/* 날씨 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Cloud className="w-4 h-4 mr-2" />
                  날씨 정보
                </h4>
                {loading ? (
                  <p className="text-sm text-gray-500">로딩 중...</p>
                ) : weatherData ? (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">날씨:</span>
                        <span className="ml-2 text-gray-900">{weatherData.WEATHER_STTS}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">기온:</span>
                        <span className="ml-2 text-gray-900">{weatherData.TEMP}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-500">체감:</span>
                        <span className="ml-2 text-gray-900">{weatherData.SENSIBLE_TEMP}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-500">습도:</span>
                        <span className="ml-2 text-gray-900">{weatherData.HUMIDITY}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-gray-500">미세먼지:</span>
                        <span className="ml-2 text-gray-900">{weatherData.PM10_INDEX}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">초미세:</span>
                        <span className="ml-2 text-gray-900">{weatherData.PM25_INDEX}</span>
                      </div>
                    </div>
                    {weatherData.UV_INDEX_LVL && (
                      <div className="mt-2">
                        <span className="text-gray-500">자외선:</span>
                        <span className="ml-2 text-gray-900">{weatherData.UV_INDEX_LVL}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">날씨 정보 없음</p>
                )}
              </div>

              {/* 기본 시설 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">시설 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">카테고리:</span>
                    <span className="ml-2 text-gray-900">{config.label}</span>
                  </div>
                  {facility.distance && (
                    <div>
                      <span className="text-gray-500">거리:</span>
                      <span className="ml-2 text-gray-900">{facility.distance.toFixed(1)}km</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">예약:</span>
                    <span className="ml-2 text-gray-900">{facility.isReservable ? '가능' : '불가'}</span>
                  </div>
                  {facility.position && (
                    <div>
                      <span className="text-gray-500">좌표:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">
                        {facility.position.lat.toFixed(4)}, {facility.position.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {facility.description && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">설명</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{facility.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};