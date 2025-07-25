'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

const LoginButton = () => {
    const { user, isAuthenticated, clearAuth, checkAuthStatus } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            await checkAuthStatus();
            setIsLoading(false);
        };
        checkAuth();
    }, [checkAuthStatus]);

    const handleLogin = () => {
        // 카카오 OAuth2 파라미터 설정
        const KAKAO_CLIENT_ID = 'your_kakao_client_id'; // 실제 카카오 앱 키로 변경
        const REDIRECT_URI = 'http://localhost:3000/auth/callback';
        const STATE = Math.random().toString(36).substring(2, 15); // CSRF 방지용 랜덤 상태값

        // 카카오 OAuth2 URL 구성
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?` +
            `client_id=${KAKAO_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `response_type=code&` +
            `state=${STATE}&` +
            `scope=profile_nickname,profile_image,account_email`;

        // 상태값을 로컬스토리지에 저장 (보안 검증용)
        localStorage.setItem('kakao_oauth_state', STATE);

        // 카카오 로그인 페이지로 리다이렉트
        window.location.href = kakaoAuthUrl;
    };

    const handleLogout = async () => {
        try {
            const token = useAuthStore.getState().token;
            if (token) {
                await fetch('http://localhost:8080/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            clearAuth();
        }
    };

    // 로딩 중일 때
    if (isLoading) {
        return (
            <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // 로그인된 상태
    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200">
                {/* 데스크톱에서만 프로필 이미지 표시 */}
                <div className="hidden sm:flex items-center gap-2">
                    <img
                        src={user.profileImage || '/default-profile.png'}
                        alt={user.nickname}
                        className="w-6 h-6 rounded-full border"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-profile.png';
                        }}
                    />
                    <span className="text-sm font-medium text-gray-800 max-w-20 truncate">
            {user.nickname}
          </span>
                </div>

                {/* 모바일에서는 닉네임만 표시 */}
                <div className="sm:hidden">
          <span className="text-sm font-medium text-gray-800 max-w-16 truncate">
            {user.nickname}
          </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    // 로그인 버튼
    return (
        <button
            onClick={handleLogin}
            className="px-4 py-2 bg-yellow-400/90 backdrop-blur-sm text-black font-medium rounded-lg hover:bg-yellow-500 transition-colors shadow-lg border border-yellow-500 text-sm"
        >
            로그인
        </button>
    );
};

export default LoginButton;