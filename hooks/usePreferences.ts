import { useState, useEffect } from 'react';
import type { UserPreferences, FacilityCategory } from '@/lib/types';

const PREFERENCES_STORAGE_KEY = 'seoulfit_preferences';

const defaultPreferences: UserPreferences = {
  sports: true,
  culture: true,
  restaurant: false,
  library: false,
  park: false
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // 로컬 스토리지에서 선호도 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      }
    } catch (error) {
      console.error('선호도 설정을 불러오는데 실패했습니다:', error);
    }
  }, []);

  // 선호도 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('선호도 설정 저장에 실패했습니다:', error);
    }
  }, [preferences]);

  const togglePreference = (type: FacilityCategory) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return {
    preferences,
    togglePreference,
    resetPreferences
  };
}