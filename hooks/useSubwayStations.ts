// hooks/useSubwayStations.ts
import { useState, useEffect, useCallback } from 'react';
import { FACILITY_CATEGORIES, type Facility } from '@/lib/types';

interface SubwayStationData {
  code: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  stationId: string;
  route: string;
}

interface SubwayApiResponse {
  success: boolean;
  data: {
    center: { lat: number; lng: number };
    radius: number;
    count: number;
    stations: SubwayStationData[];
    cached: boolean;
    fetchTime: string;
  };
}

export const useSubwayStations = () => {
  const [subwayStations, setSubwayStations] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToFacility = useCallback((station: SubwayStationData): Facility => {
    return {
      id: station.code,
      name: station.name,
      category: FACILITY_CATEGORIES.SUBWAY,
      position: {
        lat: station.lat,
        lng: station.lng
      },
      address: '',
      congestionLevel: 'medium' as const,
      subwayStation: {
        stationId: station.stationId,
        route: station.route
      }
    };
  }, []);

  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSubwayStations = useCallback(async () => {
    if (hasLoaded) return; // 이미 로드되었으면 스킵
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subway?lat=37.5665&lng=126.9780');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SubwayApiResponse = await response.json();

      if (data.success) {
        const facilities = data.data.stations.map(convertToFacility);
        setSubwayStations(facilities);
        setHasLoaded(true); // 로드 완료 표시
      } else {
        throw new Error('지하철 데이터를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('지하철 데이터 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [hasLoaded, convertToFacility]);

  useEffect(() => {
    fetchSubwayStations();
  }, []);

  return {
    subwayStations,
    loading,
    error,
    refetch: fetchSubwayStations
  };
};