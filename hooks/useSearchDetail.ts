import { useState, useCallback } from 'react';
import type { Facility } from '@/lib/types';
import type { SearchItem } from '@/hooks/useSearchCache';
import { convertSearchResultToFacility } from '@/services/searchDetail';
import { useSearchCache } from './useSearchCache';

export function useSearchDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { searchCache } = useSearchCache();

  // 캐시된 지하철/따릉이 데이터에서 직접 조회
  const getFromCache = useCallback(async (searchItem: SearchItem): Promise<Facility | null> => {
    console.log('캐시에서 조회 시도:', searchItem.category, searchItem.id);

    if (searchItem.category === 'subway') {
      // 지하철 상세 정보 API 호출
      try {
        const response = await fetch(`/api/subway?lat=37.5665&lng=126.9780`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.stations) {
            interface SubwayStationDetail {
              code?: string;
              name: string;
              lat?: number;
              lng?: number;
            }

            const station = data.data.stations.find(
              (s: SubwayStationDetail) => s.code === searchItem.id || s.name === searchItem.name
            );
            if (station) {
              return {
                id: searchItem.id,
                name: searchItem.name,
                category: 'subway',
                position: { lat: station.lat || 37.5665, lng: station.lng || 126.978 },
                address: searchItem.address || '',
                description: searchItem.remark,
                congestionLevel: 'low',
                subwayStation: {
                  stationId: searchItem.id,
                  route: searchItem.remark,
                },
              };
            }
          }
        }
      } catch (error) {
        console.error('지하철 데이터 조회 실패:', error);
      }
    }

    if (searchItem.category === 'bike') {
      // 따릉이 상세 정보 API 호출
      try {
        const response = await fetch(`/api/bike-stations?lat=37.5665&lng=126.9780&radius=30`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.stations) {
            interface BikeStationDetail {
              code?: string;
              name: string;
              lat?: number;
              lng?: number;
              parkingBikeTotCnt?: string;
              rackTotCnt?: string;
              shared?: string;
            }

            const station = data.data.stations.find(
              (s: BikeStationDetail) => s.code === searchItem.id || s.name === searchItem.name
            );
            if (station) {
              return {
                id: searchItem.id,
                name: searchItem.name,
                category: 'bike',
                position: { lat: station.lat || 37.5665, lng: station.lng || 126.978 },
                address: searchItem.address || '',
                description: searchItem.remark,
                congestionLevel: 'low',
                bikeFacility: {
                  availableBikes: parseInt(station.parkingBikeTotCnt) || 0,
                  totalRacks: parseInt(station.rackTotCnt) || 0,
                  availableRacks:
                    parseInt(station.rackTotCnt) - parseInt(station.parkingBikeTotCnt) || 0,
                  shared: station.shared || '0%',
                },
              };
            }
          }
        }
      } catch (error) {
        console.error('따릉이 데이터 조회 실패:', error);
      }
    }

    return null;
  }, []);

  // 상세 데이터 조회
  const fetchSearchDetail = useCallback(
    async (searchItem: SearchItem): Promise<Facility | null> => {
      console.log('상세 데이터 조회 시작:', searchItem);
      setIsLoading(true);
      setError(null);

      try {
        // 1. 캐시에서 먼저 확인 (지하철/따릉이)
        if (searchItem.category === 'subway' || searchItem.category === 'bike') {
          const cachedFacility = await getFromCache(searchItem);
          if (cachedFacility) {
            console.log('캐시에서 조회 성공:', cachedFacility);
            return cachedFacility;
          }
        }

        // 2. API 호출 (기타 카테고리)
        const indexId = searchItem.id.replace('poi_', ''); // poi_ 접두사 제거
        console.log('API 호출 시도:', indexId);
        const response = await fetch(`/api/search/data/${indexId}`);

        if (!response.ok) {
          throw new Error(`상세 데이터 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log('API 응답 데이터:', data);

        // 3. 카테고리별 데이터 변환
        const facility = convertSearchResultToFacility(searchItem.category, data, searchItem);
        console.log('변환된 시설 데이터:', facility);

        if (!facility) {
          throw new Error('데이터 변환에 실패했습니다.');
        }

        return facility;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '상세 데이터를 불러오는데 실패했습니다.';
        setError(errorMessage);
        console.error('상세 검색 실패:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getFromCache]
  );

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    fetchSearchDetail,
    clearError,
  };
}
