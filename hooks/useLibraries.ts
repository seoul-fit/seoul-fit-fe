import { useState, useCallback } from 'react';
import type { Library } from '@/lib/types';
import { fetchNearbyLibraries, fetchAllLibraries } from '@/services/libraries';

export function useLibraries() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLibraries = useCallback(async (lat: number, lng: number, radius: number = 2) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchNearbyLibraries(lat, lng, radius);
      setLibraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '도서관 데이터를 불러오는데 실패했습니다.');
      setLibraries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllLibrariesData = useCallback(async (page: number = 0, size: number = 100) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchAllLibraries(page, size);
      setLibraries(response.libraries);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : '도서관 데이터를 불러오는데 실패했습니다.');
      setLibraries([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLibraries = useCallback(() => {
    setLibraries([]);
    setError(null);
  }, []);

  return {
    libraries,
    isLoading,
    error,
    fetchLibraries,
    fetchAllLibrariesData,
    clearLibraries
  };
}