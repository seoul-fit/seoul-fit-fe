import { useState, useEffect } from 'react';
import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { INTEREST_CATEGORY_MAP } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { getUserInfo } from '@/services/user';

const PREFERENCES_STORAGE_KEY = 'seoulfit_preferences';

const defaultPreferences: UserPreferences = {
  sports: true,
  culture: true,
  restaurant: false,
  library: false,
  park: false,
  bike: false
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  // 사용자 선호도 조회
  const loadUserPreferences = async () => {
    if (!isAuthenticated || !user?.id || isLoaded) return;
    
    try {
      const userInfo = await getUserInfo(user.id);
      // 모든 선호도를 false로 초기화
      const userPreferences: UserPreferences = {
        sports: false,
        culture: false,
        restaurant: false,
        library: false,
        park: false,
        bike: false
      };

      // 사용자 선호도 저장
      userInfo.interests.forEach(interest => {
        const interestCategory = typeof interest === 'string' ? interest : interest.interestCategory;
        const facilityCategory = INTEREST_CATEGORY_MAP[interestCategory];
        if (facilityCategory) {
          userPreferences[facilityCategory] = true;
        }
      });
      
      setPreferences(userPreferences);
      setIsLoaded(true);
    } catch (error) {
      console.error('사용자 선호도를 불러오는데 실패했습니다:', error);
      loadLocalPreferences();
      setIsLoaded(true);
    }
  };

  // 로컬 스토리지에서 선호도 로드
  const loadLocalPreferences = () => {
    if (isLoaded) return;
    
    try {
      const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('선호도 설정을 불러오는데 실패했습니다:', error);
      setIsLoaded(true);
    }
  };

  // 인증 상태에 따른 선호도 로드
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserPreferences().then();
    } else {
      loadLocalPreferences();
    }
  }, [isAuthenticated, user?.id]);

  // 선호도 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('선호도 설정 저장에 실패했습니다:', error);
    }
  }, [preferences]);

  const togglePreference = (type: FacilityCategory) => {
    if (!isAuthenticated) {
      setPreferences(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
    }
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const refreshPreferences = () => {
    if (isAuthenticated && user?.id) {
      loadUserPreferences().then();
    } else {
      loadLocalPreferences();
    }
  };

  return {
    preferences,
    togglePreference,
    resetPreferences,
    refreshPreferences
  };
}