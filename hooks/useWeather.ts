// hooks/useWeather.ts
import { useState, useCallback } from 'react';
import { WeatherData } from '@/lib/types';
import { getNearestWeatherData } from '@/services/weather';

interface UseWeatherState {
  showWeather: boolean;
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
}

export const useWeather = () => {
  const [state, setState] = useState<UseWeatherState>({
    showWeather: false,
    weatherData: null,
    weatherLoading: false,
    weatherError: null
  });

  const fetchWeatherData = useCallback(async (lat: number, lng: number) => {
    setState(prev => ({ ...prev, weatherLoading: true, weatherError: null }));

    try {
      const data = await getNearestWeatherData(lat, lng);
      
      if (data) {
        setState(prev => ({ 
          ...prev, 
          weatherData: data, 
          weatherError: null,
          weatherLoading: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          weatherError: '현재 위치 주변의 날씨 정보를 찾을 수 없습니다.',
          weatherData: null,
          weatherLoading: false 
        }));
      }
    } catch (error) {
      console.error('날씨 데이터 조회 실패:', error);
      setState(prev => ({ 
        ...prev, 
        weatherError: '날씨 정보를 불러오는데 실패했습니다.',
        weatherData: null,
        weatherLoading: false 
      }));
    }
  }, []);

  const toggleWeatherDisplay = useCallback(async (currentLocation?: { lat: number; lng: number }) => {
    const newShowState = !state.showWeather;
    setState(prev => ({ ...prev, showWeather: newShowState }));

    if (newShowState && currentLocation && !state.weatherData) {
      await fetchWeatherData(currentLocation.lat, currentLocation.lng);
    }
  }, [state.showWeather, state.weatherData, fetchWeatherData]);

  const refreshWeatherData = useCallback(async (currentLocation?: { lat: number; lng: number }) => {
    if (currentLocation) {
      await fetchWeatherData(currentLocation.lat, currentLocation.lng);
    }
  }, [fetchWeatherData]);

  return {
    ...state,
    fetchWeatherData,
    toggleWeatherDisplay,
    refreshWeatherData
  };
};