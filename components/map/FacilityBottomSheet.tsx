// components/map/FacilityBottomSheet.tsx - Improved version with better drag handling
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  Phone,
  Users,
  Cloud,
  Info,
  MessageCircleMore,
  Train,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Facility, CongestionData, WeatherData, SubwayArrivalData } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/lib/facilityIcons';
import { SubwayStationIcon } from './SubwayStationIcon';

interface FacilityBottomSheetProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  weatherData?: WeatherData | null;
  congestionData?: CongestionData | null;
}

// 드래그 상태 타입
interface DragState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  startTime: number;
}

export const FacilityBottomSheet: React.FC<FacilityBottomSheetProps> = ({
  facility,
  isOpen,
  onClose,
  weatherData: propWeatherData,
  congestionData: propCongestionData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
  });
  const [subwayArrival, setSubwayArrival] = useState<SubwayArrivalData | null>(null);
  const [isLoadingArrival, setIsLoadingArrival] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 시설이 변경되면 확장 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
      setDragState({
        isDragging: false,
        startY: 0,
        currentY: 0,
        startTime: 0,
      });
      setSubwayArrival(null);
    }
  }, [isOpen, facility]);

  // 지하철역인 경우 실시간 도착 정보 가져오기
  useEffect(() => {
    if (facility?.category === 'subway' && facility.name && isOpen) {
      const fetchSubwayArrival = async () => {
        setIsLoadingArrival(true);
        try {
          const response = await fetch(
            `/api/subway/arrival?stationName=${encodeURIComponent(facility.name)}`
          );
          const result = await response.json();

          if (result.success) {
            setSubwayArrival(result.data);
          }
        } catch (error) {
          console.error('지하철 도착 정보 조회 실패:', error);
        } finally {
          setIsLoadingArrival(false);
        }
      };

      fetchSubwayArrival();
    }
  }, [facility, isOpen]);

  // 드래그 시작 처리
  const handleDragStart = useCallback((clientY: number) => {
    setDragState({
      isDragging: true,
      startY: clientY,
      currentY: clientY,
      startTime: Date.now(),
    });
  }, []);

  // 드래그 중 처리
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!dragState.isDragging) return;

      setDragState(prev => ({
        ...prev,
        currentY: clientY,
      }));
    },
    [dragState.isDragging]
  );

  // 드래그 종료 처리 (개선된 로직)
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const deltaY = dragState.currentY - dragState.startY;
    const deltaTime = Date.now() - dragState.startTime;
    const velocity = Math.abs(deltaY) / deltaTime; // px/ms

    // 빠른 스와이프 감지 (속도 기반)
    const isQuickSwipe = velocity > 0.5;

    // 임계값 설정
    const threshold = isQuickSwipe ? 30 : 80;

    if (deltaY > threshold) {
      // 아래로 드래그
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // 위로 드래그
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }

    // 드래그 상태 초기화
    setDragState({
      isDragging: false,
      startY: 0,
      currentY: 0,
      startTime: 0,
    });
  }, [dragState, isExpanded, onClose]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        handleDragMove(e.touches[0].clientY);
      }
    },
    [dragState.isDragging, handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleDragEnd();
    },
    [handleDragEnd]
  );

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // 키보드 접근성
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' && !isExpanded) {
        setIsExpanded(true);
      } else if (e.key === 'ArrowDown' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExpanded, onClose]);

  // 포커스 관리
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.focus();
    }
  }, [isOpen]);

  if (!facility || !isOpen) return null;

  const config = FACILITY_CONFIGS[facility.category];

  // 드래그 중 변환 계산 (부드러운 애니메이션)
  const translateY = dragState.isDragging ? Math.max(0, dragState.currentY - dragState.startY) : 0;

  // 높이 계산
  const sheetHeight = isExpanded ? '80vh' : 'auto';
  const maxHeight = isExpanded ? '80vh' : '50vh';

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-all duration-300 ease-out focus:outline-none ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          transform: `translateY(${translateY}px)`,
          height: sheetHeight,
          maxHeight: maxHeight,
        }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='facility-title'
        tabIndex={-1}
      >
        {/* 드래그 핸들 */}
        <div
          className='flex justify-center py-3 cursor-grab active:cursor-grabbing select-none'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          role='button'
          aria-label='드래그하여 크기 조절'
        >
          <div className='w-12 h-1 bg-gray-300 rounded-full transition-colors hover:bg-gray-400' />
        </div>

        {/* 헤더 */}
        <div className='flex items-center justify-between px-6 pb-4'>
          <div className='flex items-center space-x-3 flex-1 min-w-0'>
            {facility.category === 'subway' ? (
              <SubwayStationIcon
                route={undefined} // 새 타입 시스템에서는 route 정보가 별도 처리 필요
                size='lg'
                className='flex-shrink-0'
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center text-white flex-shrink-0`}
              >
                {config.icon}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 id='facility-title' className='text-lg font-semibold text-gray-900 truncate'>
                {facility.name}
              </h3>
              <p className='text-sm text-gray-500 truncate'>
                {config.label}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2 flex-shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-2 hover:bg-gray-100 transition-colors'
              aria-label={isExpanded ? '축소' : '확대'}
            >
              {isExpanded ? <ChevronDown className='w-5 h-5' /> : <ChevronUp className='w-5 h-5' />}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='p-2 hover:bg-gray-100 transition-colors'
              aria-label='닫기'
            >
              <X className='w-5 h-5' />
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div
          ref={contentRef}
          className={`px-6 pb-6 overflow-y-auto overscroll-contain ${
            isExpanded ? 'max-h-[calc(80vh-120px)]' : 'max-h-[calc(50vh-120px)]'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {/* 따릉이 설명 (우선 표시) */}
          {facility.category === 'bike' && facility.description && (
            <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <p className='text-green-800 text-sm font-medium'>{facility.description}</p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className='space-y-3 mb-6'>
            {facility.address && (
              <div className='flex items-start space-x-3'>
                <MapPin className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                <p className='text-gray-700 text-sm leading-relaxed'>{facility.address}</p>
              </div>
            )}

            {facility.operatingHours && (
              <div className='flex items-start space-x-3'>
                <Clock className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                <p className='text-gray-700 text-sm leading-relaxed'>{facility.operatingHours}</p>
              </div>
            )}

            {facility.phone && (
              <div className='flex items-start space-x-3'>
                <Phone className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                <a
                  href={`tel:${facility.phone}`}
                  className='text-blue-600 hover:text-blue-800 text-sm transition-colors'
                >
                  {facility.phone}
                </a>
              </div>
            )}
          </div>

          {/* 지하철 실시간 도착 정보 */}
          {facility.category === 'subway' && (
            <div className='mb-6'>
              <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                <Train className='w-4 h-4 mr-2' />
                실시간 도착 정보
              </h4>
              {isLoadingArrival ? (
                <div className='flex items-center justify-center py-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600' />
                  <span className='ml-2 text-base text-gray-500'>도착 정보 조회 중...</span>
                </div>
              ) : subwayArrival ? (
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <div className='text-sm text-blue-800'>
                    지하철 도착 정보: {subwayArrival.stationName} - {subwayArrival.lineName}
                  </div>
                  {subwayArrival.arrivalTime && (
                    <div className='text-xs text-blue-600 mt-1'>
                      다음 열차: {subwayArrival.arrivalTime}분 후 도착
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-base text-gray-500 py-2'>도착 정보가 없습니다.</p>
              )}
            </div>
          )}

          {/* 확장된 내용 */}
          {isExpanded && (
            <div className='space-y-4 animate-in fade-in duration-200'>
              {/* 혼잡도 정보 */}
              <div className='border-t pt-4'>
                <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                  <Users className='w-4 h-4 mr-2' />
                  혼잡도 정보
                </h4>
                {propCongestionData ? (
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center'>
                      <span className='text-gray-500 min-w-0 flex-shrink-0'>혼잡도:</span>
                      <span
                        className={`ml-2 font-medium ${
                          propCongestionData.AREA_CONGEST_LVL === '여유'
                            ? 'text-green-600'
                            : propCongestionData.AREA_CONGEST_LVL === '보통'
                              ? 'text-yellow-600'
                              : propCongestionData.AREA_CONGEST_LVL === '약간 붐빔'
                                ? 'text-orange-600'
                                : 'text-red-600'
                        }`}
                      >
                        {propCongestionData.AREA_CONGEST_LVL}
                      </span>
                    </div>
                    <div className='text-xs text-gray-600 mt-2 leading-relaxed'>
                      {propCongestionData.AREA_CONGEST_MSG}
                    </div>
                  </div>
                ) : (
                  <p className='text-sm text-gray-500'>혼잡도 정보 없음</p>
                )}
              </div>

              {/* 날씨 정보 */}
              <div className='border-t pt-4'>
                <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                  <Cloud className='w-4 h-4 mr-2' />
                  날씨 정보
                </h4>
                {propWeatherData ? (
                  <div className='space-y-3 text-sm'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>기온:</span>
                        <span className='text-gray-900 font-medium'>{propWeatherData.TEMP}°C</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>체감:</span>
                        <span className='text-gray-900 font-medium'>
                          {propWeatherData.SENSIBLE_TEMP}°C
                        </span>
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>습도:</span>
                        <span className='text-gray-900 font-medium'>
                          {propWeatherData.HUMIDITY}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>미세먼지:</span>
                        <span className='text-gray-900 font-medium'>
                          {propWeatherData.PM10_INDEX}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className='text-sm text-gray-500'>날씨 정보 없음</p>
                )}
              </div>

              {/* 기본 시설 정보 */}
              <div className='border-t pt-4'>
                <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                  <Info className='w-4 h-4 mr-2' />
                  시설 정보
                </h4>
                <div className='grid grid-cols-1 gap-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>카테고리:</span>
                    <span className='text-gray-900 font-medium'>{config.label}</span>
                  </div>
                  {facility.distance && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>거리:</span>
                      <span className='text-gray-900 font-medium'>
                        {facility.distance.toFixed(1)}km
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>예약:</span>
                    <span className='text-gray-900 font-medium'>
                      {facility.isReservable ? '가능' : '불가'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 문화행사 전용 정보 */}
              {facility.category === 'cultural_event' && facility.culturalEvent && (
                <div className='border-t pt-4'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <MessageCircleMore className='w-4 h-4 mr-2' />
                    행사 정보
                  </h4>
                  <div className='space-y-3 text-sm'>
                    {facility.culturalEvent.codeName && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>장르:</span>
                        <span className='text-gray-900 font-medium'>
                          {facility.culturalEvent.codeName}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.useFee && (
                      <div className='flex flex-col space-y-1'>
                        <span className='text-gray-500'>요금:</span>
                        <span className='text-gray-900 text-xs leading-relaxed'>
                          {facility.culturalEvent.useFee}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.useTarget && (
                      <div className='flex flex-col space-y-1'>
                        <span className='text-gray-500'>이용대상:</span>
                        <span className='text-gray-900 text-xs'>
                          {facility.culturalEvent.useTarget}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.ticket && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>예매:</span>
                        <span className='text-gray-900 font-medium'>
                          {facility.culturalEvent.ticket}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.isFree && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>구분:</span>
                        <span
                          className={`font-medium ${
                            facility.culturalEvent.isFree === '무료'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {facility.culturalEvent.isFree}
                        </span>
                      </div>
                    )}
                  </div>
                  {facility.culturalEvent.mainImg && (
                    <div className='mt-4'>
                      <Image
                        src={facility.culturalEvent.mainImg}
                        alt={facility.name}
                        width={400}
                        height={128}
                        className='w-full h-32 object-cover rounded-lg'
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {facility.description && facility.category !== 'cultural_event' && (
                <div className='border-t pt-4'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <MessageCircleMore className='w-4 h-4 mr-2' />
                    설명
                  </h4>
                  <p className='text-gray-700 text-sm leading-relaxed'>{facility.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
