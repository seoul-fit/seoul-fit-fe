// hooks/useCongestion.ts
import { useState, useCallback } from 'react';
import { CongestionData } from '@/lib/types';
import { getNearestCongestionData } from '@/services/congestion';

interface UseCongestionState {
  showCongestion: boolean;
  congestionData: CongestionData | null;
  congestionLoading: boolean;
  congestionError: string | null;
}

export const useCongestion = () => {
  const [state, setState] = useState<UseCongestionState>({
    showCongestion: false,
    congestionData: null,
    congestionLoading: false,
    congestionError: null,
  });

  const fetchCongestionData = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({ ...prev, congestionLoading: true, congestionError: null }));

    try {
      const data = await getNearestCongestionData(lat, lng);

      if (data) {
        setState(prev => ({
          ...prev,
          congestionData: data,
          congestionError: null,
          congestionLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          congestionError: '현재 위치 주변의 혼잡도 정보를 찾을 수 없습니다.',
          congestionData: null,
          congestionLoading: false,
        }));
      }
    } catch (error) {
      console.error('혼잡도 데이터 조회 실패:', error);
      setState(prev => ({
        ...prev,
        congestionError: '혼잡도 정보를 불러오는데 실패했습니다.',
        congestionData: null,
        congestionLoading: false,
      }));
    }
  }, []);

  const toggleCongestionDisplay = useCallback(
    async (currentLocation?: { lat: number; lng: number }) => {
      setState(prev => {
        const newShowState = !prev.showCongestion;

        // 비동기로 데이터 로드
        if (newShowState && currentLocation && !prev.congestionData) {
          fetchCongestionData(currentLocation.lat, currentLocation.lng);
        }

        return { ...prev, showCongestion: newShowState };
      });
    },
    [fetchCongestionData]
  );

  const refreshCongestionData = useCallback(
    async (currentLocation?: { lat: number; lng: number }) => {
      if (currentLocation) {
        await fetchCongestionData(currentLocation.lat, currentLocation.lng);
      }
    },
    [fetchCongestionData]
  );

  return {
    ...state,
    fetchCongestionData,
    toggleCongestionDisplay,
    refreshCongestionData,
  };
};
