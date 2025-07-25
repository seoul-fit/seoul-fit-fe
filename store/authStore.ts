import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
    id: number;
    kakaoId: string;
    nickname: string;
    profileImage: string;
    email: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user: User, token: string) => {
                Cookies.set('auth_token', token, { expires: 7, secure: false, sameSite: 'lax' });
                set({
                    user,
                    token,
                    isAuthenticated: true,
                });
            },

            clearAuth: () => {
                Cookies.remove('auth_token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            checkAuthStatus: async () => {
                const token = Cookies.get('auth_token');
                if (!token) {
                    get().clearAuth();
                    return false;
                }

                try {
                    const response = await fetch('http://localhost:8080/api/auth/me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const user = await response.json();
                        set({
                            user,
                            token,
                            isAuthenticated: true,
                        });
                        return true;
                    } else {
                        get().clearAuth();
                        return false;
                    }
                } catch (error) {
                    console.error('Auth status check failed:', error);
                    get().clearAuth();
                    return false;
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);