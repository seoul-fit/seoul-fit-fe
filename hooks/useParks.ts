import { useState, useEffect, useCallback } from 'react';
import type { Park } from '@/lib/types';
import { getNearbyParks } from '@/services/park';

export function useParks() {
  const [parks, setParks] = useState<Park[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParks = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getNearbyParks(lat, lng);
      setParks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '공원 데이터를 불러오는데 실패했습니다.');
      setParks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearParks = useCallback(() => {
    setParks([]);
    setError(null);
  }, []);

  return {
    parks,
    isLoading,
    error,
    fetchParks,
    clearParks
  };
}