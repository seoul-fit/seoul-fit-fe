import { useState, useCallback } from 'react';
import { getNearbyCulturalReservations } from '@/services/culturalReservations';

export const useCulturalReservations = () => {
  const [culturalReservations, setCulturalReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCulturalReservations = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getNearbyCulturalReservations(lat, lng);
      setCulturalReservations(data);
    } catch (err) {
      setError('문화예약 데이터를 불러오는데 실패했습니다.');
      console.error('문화예약 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    culturalReservations,
    isLoading,
    error,
    fetchCulturalReservations
  };
};