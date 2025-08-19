import { useState, useCallback } from 'react';
import { getNearbyCulturalEvents } from '@/services/culturalEvents';

export const useCulturalEvents = () => {
  const [culturalEvents, setCulturalEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCulturalEvents = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNearbyCulturalEvents(lat, lng);
      setCulturalEvents(data);
    } catch (err) {
      setError('문화행사 데이터를 불러오는데 실패했습니다.');
      console.error('문화행사 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    culturalEvents,
    isLoading,
    error,
    fetchCulturalEvents,
  };
};
