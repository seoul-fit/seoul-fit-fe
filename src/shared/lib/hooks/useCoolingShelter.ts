import { useState, useCallback } from 'react';
import { CoolingCenter, Facility } from '@/lib/types';
import {
  getNearbyCoolingShelters,
  convertCoolingShelterToFacility,
} from '@/shared/api/coolingShelter';

export const useCoolingShelter = () => {
  const [coolingShelters, setCoolingShelters] = useState<CoolingCenter[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoolingShelters = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNearbyCoolingShelters(lat, lng);
      setCoolingShelters(data);

      // Facility 형태로 변환
      const facilityData = data
        .filter(shelter => shelter.latitude && shelter.longitude)
        .map(convertCoolingShelterToFacility);

      setFacilities(facilityData);
    } catch (err) {
      setError('무더위 쉼터 데이터를 불러오는데 실패했습니다.');
      console.error('무더위 쉼터 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    coolingShelters,
    facilities,
    isLoading,
    error,
    fetchCoolingShelters,
  };
};
