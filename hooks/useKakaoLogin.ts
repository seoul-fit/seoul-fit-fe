import { kakaoLogin, kakaoLogout } from '@/services/login'
import { useCallback } from "react";
import { useAuthStore } from '@/store/authStore';

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