import {create} from 'zustand'; // React용 경량 상태 관리 라이브러리
import {persist} from 'zustand/middleware'; // Zustand 미들웨어 기능 (persist : 데이터 영속성 제공)
import Cookies from 'js-cookie'; // 브라우저 쿠키 조작 라이브러리

// User 정보
interface User {
    id: number;
    email: string;
    nickname: string;
    status: string;
    oauthProvider: string; // 카카오(kakao), 구글(google), 네이버(naver), 애플(apple)
    oauthUserId: string;
    profileImageUrl: string;
    interests: Array<{
        id: number;
        interestCategory: string; // 체육시설, 문화시설, 맛집, 도서관, 공원
    }>;
}

// User Token 정보
interface AuthToken {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
    clearAuth: () => void;
    checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthToken>()(
    persist(
        (set, get) => ({
            // User 초기 상태
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // User Token 상태 설정
            setAuth: (user: User, accessToken: string, refreshToken?: string) => {
                // 쿠키에 토큰 저장
                Cookies.set('access_token', accessToken, {
                    expires: 7, // 7일 후 만료
                    secure: false, // HTTPS만 허용 (개발 환경은 false)
                    sameSite: 'lax' // CSRF 공격 방지
                });

                if (refreshToken) {
                    Cookies.set('refresh_token', refreshToken, {
                        expires: 30, // 30일 후 만료
                        secure: false,
                        sameSite: 'lax'
                    });
                }

                // Zustand 상태 업데이트
                set({
                    user,
                    accessToken: accessToken,
                    refreshToken: refreshToken || null,
                    isAuthenticated: true,
                });
            },

            // User 상태 초기화
            clearAuth: () => {
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            // User 상태 확인
            checkAuthStatus: async () => {
                const accessToken = Cookies.get('access_token');

                if (!accessToken) {
                    // accessToken 없는 경우 User 상태 초기화
                    get().clearAuth();
                    return false;
                }

                try {
                    // accessToken으로 User 정보 확인
                    const response = await fetch('http://localhost:8080/api/auth/me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();

                        // 유효한 accessToken인 경우 User 상태 업데이트
                        set({
                            user: userData,
                            accessToken,
                            refreshToken: Cookies.get('refresh_token') || null,
                            isAuthenticated: true,
                        });

                        return true;
                    } else if (response.status === 401) {
                        // accessToken 만료 시 refreshToken으로 갱신
                        const refreshToken = Cookies.get('refresh_token');

                        if (refreshToken) {
                            const refreshResponse = await fetch('http://localhost:8080/api/auth/refresh', {
                                method: 'POST',
                                headers: {
                                    'Refresh-Token': refreshToken,
                                    'Content-Type': 'application/json',
                                },
                            });

                            if (refreshResponse.ok) {
                                const tokenData = await refreshResponse.json();
                                get().setAuth(tokenData.user, tokenData.accessToken, tokenData.refreshToken);
                                return true;
                            }
                        }

                        // 갱신 실패 시, User 상태 초기화
                        get().clearAuth();
                        return false;
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
            name: 'auth-storage', // 로컬 스토리지 키
            partialize: (state) => ({
                // 토큰은 쿠키에 저장하므로 로컬 스토리지에는 User 정보만 저장
                // 브라우저 새로고침 해도 User Token 상태 유지
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);