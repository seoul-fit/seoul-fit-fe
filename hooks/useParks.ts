import { useState, useCallback } from 'react';
import type { Park } from '@/lib/types';
import { fetchNearbyParks, fetchAllParks } from '@/services/parks';

export function useParks() {
  const [parks, setParks] = useState<Park[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParks = useCallback(async (lat: number, lng: number, radius: number = 2) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchNearbyParks(lat, lng, radius);
      setParks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '공원 데이터를 불러오는데 실패했습니다.');
      setParks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllParksData = useCallback(async (page: number = 0, size: number = 100) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchAllParks(page, size);
      setParks(response.parks);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : '공원 데이터를 불러오는데 실패했습니다.');
      setParks([]);
      throw err;
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
    fetchAllParksData,
    clearParks
  };
}