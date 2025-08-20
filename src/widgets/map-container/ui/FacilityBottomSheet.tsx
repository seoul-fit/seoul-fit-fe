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
import { Button } from '@/shared/ui/button';
import type { Facility, CongestionData, WeatherData, SubwayArrivalData } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
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
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-out focus:outline-none ${
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
          className='flex justify-center py-4 cursor-grab active:cursor-grabbing select-none'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          role='button'
          aria-label='드래그하여 크기 조절'
        >
          <div className='w-14 h-1.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full transition-all hover:scale-x-125' />
        </div>

        {/* 헤더 */}
        <div className='flex items-center justify-between px-6 pb-4'>
          <div className='flex items-center space-x-4 flex-1 min-w-0'>
            {facility.category === 'subway' ? (
              <SubwayStationIcon
                route={undefined} // 새 타입 시스템에서는 route 정보가 별도 처리 필요
                size='lg'
                className='flex-shrink-0'
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}
              >
                {config.icon}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 id='facility-title' className='text-xl font-bold text-gray-900 truncate'>
                {facility.name}
              </h3>
              <p className='text-sm text-gray-500 truncate flex items-center gap-1 mt-1'>
                <span className='inline-block w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                {config.label} • 운영중
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2 flex-shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-110'
              aria-label={isExpanded ? '축소' : '확대'}
            >
              {isExpanded ? <ChevronDown className='w-5 h-5 text-gray-600' /> : <ChevronUp className='w-5 h-5 text-gray-600' />}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='p-2.5 hover:bg-red-50 rounded-xl transition-all hover:scale-110 group'
              aria-label='닫기'
            >
              <X className='w-5 h-5 text-gray-600 group-hover:text-red-500' />
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
            <div className='mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl'>
              <p className='text-green-800 text-sm font-medium flex items-center'>
                <span className='mr-2'>🚲</span>
                {facility.description}
              </p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className='space-y-4 mb-6'>
            {facility.address && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <MapPin className='w-5 h-5 text-blue-500' />
                </div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-500 mb-1'>주소</p>
                  <p className='text-gray-900 text-sm font-medium leading-relaxed'>{facility.address}</p>
                </div>
              </div>
            )}

            {facility.operatingHours && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <Clock className='w-5 h-5 text-green-500' />
                </div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-500 mb-1'>운영시간</p>
                  <p className='text-gray-900 text-sm font-medium leading-relaxed'>{facility.operatingHours}</p>
                </div>
              </div>
            )}

            {facility.phone && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <Phone className='w-5 h-5 text-purple-500' />
                </div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-500 mb-1'>연락처</p>
                  <a
                    href={`tel:${facility.phone}`}
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors underline decoration-dotted'
                  >
                    {facility.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 지하철 실시간 도착 정보 */}
          {facility.category === 'subway' && (
            <div className='mb-6'>
              <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3'>
                  <Train className='w-4 h-4 text-indigo-600' />
                </div>
                실시간 도착 정보
              </h4>
              {isLoadingArrival ? (
                <div className='flex items-center justify-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl'>
                  <div className='flex flex-col items-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600' />
                    <span className='mt-3 text-sm text-gray-600'>도착 정보를 불러오는 중...</span>
                  </div>
                </div>
              ) : subwayArrival ? (
                <div className='bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>
                      {subwayArrival.lineName}
                    </span>
                    <span className='px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full'>
                      실시간
                    </span>
                  </div>
                  {subwayArrival.arrivalTime && (
                    <div className='flex items-center justify-between bg-white/70 rounded-xl p-3'>
                      <span className='text-sm text-gray-600'>다음 열차</span>
                      <span className='text-lg font-bold text-indigo-600'>
                        {subwayArrival.arrivalTime}분 후
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='bg-gray-50 rounded-2xl p-6 text-center'>
                  <p className='text-sm text-gray-500'>현재 도착 정보가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 확장된 내용 */}
          {isExpanded && (
            <div className='space-y-4 animate-in fade-in duration-200'>
              {/* 혼잡도 정보 */}
              <div className='border-t border-gray-100 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3'>
                    <Users className='w-4 h-4 text-orange-600' />
                  </div>
                  혼잡도 정보
                </h4>
                {propCongestionData ? (
                  <div className='bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-600'>현재 혼잡도</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          propCongestionData.AREA_CONGEST_LVL === '여유'
                            ? 'bg-green-100 text-green-700'
                            : propCongestionData.AREA_CONGEST_LVL === '보통'
                              ? 'bg-yellow-100 text-yellow-700'
                              : propCongestionData.AREA_CONGEST_LVL === '약간 붐빔'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {propCongestionData.AREA_CONGEST_LVL}
                      </span>
                    </div>
                    <div className='text-xs text-gray-700 leading-relaxed'>
                      {propCongestionData.AREA_CONGEST_MSG}
                    </div>
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-xl p-4'>
                    <p className='text-sm text-gray-500 text-center'>혼잡도 정보를 불러올 수 없습니다</p>
                  </div>
                )}
              </div>

              {/* 날씨 정보 */}
              <div className='border-t border-gray-100 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3'>
                    <Cloud className='w-4 h-4 text-blue-600' />
                  </div>
                  날씨 정보
                </h4>
                {propWeatherData ? (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs text-gray-600'>기온</span>
                        <span className='text-2xl font-bold text-blue-600'>{propWeatherData.TEMP}°</span>
                      </div>
                      <div className='text-xs text-gray-500'>체감 {propWeatherData.SENSIBLE_TEMP}°</div>
                    </div>
                    <div className='bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs text-gray-600'>습도</span>
                        <span className='text-2xl font-bold text-purple-600'>{propWeatherData.HUMIDITY}%</span>
                      </div>
                      <div className='text-xs text-gray-500'>미세먼지 {propWeatherData.PM10_INDEX}</div>
                    </div>
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-xl p-4'>
                    <p className='text-sm text-gray-500 text-center'>날씨 정보를 불러올 수 없습니다</p>
                  </div>
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
