import { useState, useCallback } from 'react';
import { getNearbyLibraries } from '@/services/libraries';

export const useLibraries = () => {
  const [libraries, setLibraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLibraries = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getNearbyLibraries(lat, lng);
      setLibraries(data);
    } catch (err) {
      setError('도서관 데이터를 불러오는데 실패했습니다.');
      console.error('도서관 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    libraries,
    isLoading,
    error,
    fetchLibraries
  };
};