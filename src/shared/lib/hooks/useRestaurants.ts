/**
 * @deprecated 이 훅은 더 이상 사용되지 않습니다.
 * 대신 @/features/restaurant-search의 useRestaurants를 사용하세요.
 * 
 * 마이그레이션 가이드:
 * - useRestaurants() → useRestaurants({ lat, lng }) 또는 useAllRestaurants()
 * - React Query 기반으로 변경되어 더 나은 캐싱과 에러 처리 제공
 */

export { useRestaurants, useAllRestaurants, useNearbyRestaurants } from '@/features/restaurant-search';

// 기존 인터페이스 호환성을 위한 래퍼 (점진적 마이그레이션용)
import { useCallback } from 'react';
import { useNearbyRestaurants as useNearbyRestaurantsNew } from '@/features/restaurant-search';

export function useRestaurantsLegacy() {
  console.warn('useRestaurantsLegacy는 deprecated입니다. useRestaurants from @/features/restaurant-search를 사용하세요.');
  
  const fetchRestaurants = useCallback((lat: number, lng: number) => {
    // 새 훅으로 리다이렉트
    return useNearbyRestaurantsNew(lat, lng);
  }, []);

  return {
    fetchRestaurants,
    // 다른 메서드들은 새 React Query 훅으로 대체됨
  };
}
