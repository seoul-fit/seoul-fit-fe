import { kakaoLogin, kakaoLogout } from '@/shared/api/login';
import { useCallback } from 'react';
import { useAuthStore } from '@/shared/model/authStore';

export function useKakaoLogin() {
  const { clearAuth } = useAuthStore();

  const login = useCallback(() => {
    kakaoLogin();
  }, []);

  const logout = useCallback(async () => {
    try {
      await kakaoLogout();
      clearAuth();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  }, [clearAuth]);

  return { login, logout };
}
