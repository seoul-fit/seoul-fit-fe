import { useState, useCallback } from 'react';
import { getNearbyCulturalSpaces } from '@/services/culturalSpaces';

export const useCulturalSpaces = () => {
  const [culturalSpaces, setCulturalSpaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCulturalSpaces = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNearbyCulturalSpaces(lat, lng);
      setCulturalSpaces(data);
    } catch (err) {
      setError('문화공간 데이터를 불러오는데 실패했습니다.');
      console.error('문화공간 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    culturalSpaces,
    isLoading,
    error,
    fetchCulturalSpaces,
  };
};
