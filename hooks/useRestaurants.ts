import { useState, useEffect, useCallback } from 'react';
import type { Restaurant } from '@/lib/types';
import { getNearbyRestaurants } from '@/services/restaurant';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNearbyRestaurants(lat, lng);
      setRestaurants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '맛집 데이터를 불러오는데 실패했습니다.');
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRestaurants = useCallback(() => {
    setRestaurants([]);
    setError(null);
  }, []);

  return {
    restaurants,
    isLoading,
    error,
    fetchRestaurants,
    clearRestaurants,
  };
}
