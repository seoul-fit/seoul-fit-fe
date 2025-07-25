'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, LogOut, Settings, UserCircle } from 'lucide-react';

interface LoginButtonProps {
    variant?: 'default' | 'compact' | 'minimal'
    className?: string
}

export default function LoginButton({ variant = 'default', className = '' }: LoginButtonProps) {
    const { user, isAuthenticated, clearAuth, checkAuthStatus } = useAuthStore()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            await checkAuthStatus();
            setIsLoading(false);
        };
        checkAuth();
    }, [checkAuthStatus]);

    const handleLogin = () => {
        // 카카오 OAuth2 파라미터 설정
        const KAKAO_CLIENT_ID = '349f89103b32e7135ad6f15e0a73509b';
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
            <div className={`flex items-center ${className}`}>
                {variant === 'compact' ? (
                    <Skeleton className="h-6 w-16" />
                ) : (
                    <Skeleton className="h-8 w-20" />
                )}
            </div>
        )
    }

    // 로그인된 상태
    if (isAuthenticated && user) {
        if (variant === 'compact') {
            // 헤더용 컴팩트 버전
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className={`gap-2 h-8 ${className}`}>
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.nickname}
                                    className="w-4 h-4 rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/default-profile.png'
                                    }}
                                />
                            ) : (
                                <UserCircle className="w-4 h-4" />
                            )}
                            <span className="max-w-16 truncate text-xs">
                {user.nickname}
              </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <div className="flex items-center gap-2 p-2">
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.nickname}
                                    className="w-8 h-8 rounded-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/default-profile.png'
                                    }}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <UserCircle className="w-5 h-5" />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{user.nickname}</span>
                                {user.email && (
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                )}
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            프로필
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            설정
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            로그아웃
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }

        if (variant === 'minimal') {
            // 최소 버전 (모바일용)
            return (
                <Badge variant="outline" className={`gap-1 ${className}`}>
                    <UserCircle className="w-3 h-3" />
                    <span className="max-w-12 truncate text-xs">{user.nickname}</span>
                </Badge>
            )
        }

        // 기본 버전
        return (
            <div className={`flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border ${className}`}>
                <div className="flex items-center gap-2">
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={user.nickname}
                            className="w-6 h-6 rounded-full border"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/default-profile.png'
                            }}
                        />
                    ) : (
                        <UserCircle className="w-6 h-6" />
                    )}
                    <span className="text-sm font-medium max-w-20 truncate">
            {user.nickname}
          </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="h-6 px-2 text-xs"
                >
                    로그아웃
                </Button>
            </div>
        )
    }

    // 로그인 버튼
    if (variant === 'compact') {
        return (
            <Button
                onClick={handleLogin}
                size="sm"
                className={`h-8 bg-yellow-400 hover:bg-yellow-500 text-black ${className}`}
            >
                로그인
            </Button>
        )
    }

    if (variant === 'minimal') {
        return (
            <Button
                onClick={handleLogin}
                variant="outline"
                size="sm"
                className={`h-6 px-2 text-xs ${className}`}
            >
                로그인
            </Button>
        )
    }

    // 기본 로그인 버튼
    return (
        <Button
            onClick={handleLogin}
            className={`bg-yellow-400/90 hover:bg-yellow-500 text-black shadow-lg ${className}`}
        >
            로그인
        </Button>
    )
}