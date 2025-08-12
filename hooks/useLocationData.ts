// hooks/useLocationData.ts - Location-based data hook
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import * as locationService from '@/services/location';
import { LocationDataResponse } from '@/lib/types';

export interface LocationQuery {
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface UseLocationDataReturn {
  // State
  locationData: LocationDataResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getNearbyLocationData: (query: LocationQuery) => Promise<LocationDataResponse>;
  getPersonalizedLocationData: (query: LocationQuery) => Promise<LocationDataResponse>;
  getNearbyRestaurants: (query: LocationQuery) => Promise<any>;
  getNearbyLibraries: (query: LocationQuery) => Promise<any>;
  getNearbyParks: (query: LocationQuery) => Promise<any>;
  getNearbySportsFacilities: (query: LocationQuery) => Promise<any>;
  getNearbyCoolingCenters: (query: LocationQuery) => Promise<any>;
  
  // Clear functions
  clearLocationData: () => void;
  clearError: () => void;
}

export function useLocationData(): UseLocationDataReturn {
  const [locationData, setLocationData] = useState<LocationDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  const clearLocationData = useCallback(() => {
    setLocationData(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getNearbyLocationData = useCallback(async (query: LocationQuery): Promise<LocationDataResponse> => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbyLocationData(query, accessToken);
      setLocationData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 통합 데이터 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getPersonalizedLocationData = useCallback(async (query: LocationQuery): Promise<LocationDataResponse> => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getPersonalizedLocationData(query, accessToken);
      setLocationData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '개인화된 위치 기반 데이터 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getNearbyRestaurants = useCallback(async (query: LocationQuery) => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbyRestaurants(query, accessToken);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 맛집 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getNearbyLibraries = useCallback(async (query: LocationQuery) => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbyLibraries(query, accessToken);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 도서관 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getNearbyParks = useCallback(async (query: LocationQuery) => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbyParksFromBackend(query, accessToken);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 공원 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getNearbySportsFacilities = useCallback(async (query: LocationQuery) => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbySportsFacilities(query, accessToken);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 체육시설 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getNearbyCoolingCenters = useCallback(async (query: LocationQuery) => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getNearbyCoolingCentersFromBackend(query, accessToken);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '위치 기반 무더위쉼터 조회에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  return {
    locationData,
    isLoading,
    error,
    getNearbyLocationData,
    getPersonalizedLocationData,
    getNearbyRestaurants,
    getNearbyLibraries,
    getNearbyParks,
    getNearbySportsFacilities,
    getNearbyCoolingCenters,
    clearLocationData,
    clearError,
  };
}
