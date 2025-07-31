'use client'; // Client Component

import {Suspense, useCallback, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useAuthStore} from '@/store/authStore';

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {setAuth} = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'need_signup'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    // User 정보 (백엔드 응답)
    interface UserInfoResponse {
        user: {
            provider: string;
            oauthId: string;
            name: string; // kakao nickname deprecated
            email: string;
            profile: string; // kakao profile_image deprecated
        };
        isNewUser: boolean;
    }

    // User Token 정보 (백엔드 응답)
    interface AuthTokenResponse {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }

    // Login 정보 (백엔드 응답)
    interface LoginResponse {
        user: UserInfoResponse['user'];
        accessToken: string;
        refreshToken: string;
    }

    const [userInfo, setUserInfo] = useState<UserInfoResponse['user'] | null>(null);

    // Exception Hanlder
    const handleError = useCallback((errorMsg: string, shouldRedirect: boolean = true) => {
        console.error('Authentication error:', errorMsg);

        setStatus('error');
        setErrorMessage(errorMsg);

        // 3초 후 메인 페이지로 리다이렉트
        if (shouldRedirect) {
            setTimeout(() => router.push('/'), 3000);
        }

        return false;
    }, [router]);

    // 로그인 버튼 클릭 후 프로세스
    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Step 1 : 카카오 인가 코드 요청 결과 확인
                const code = searchParams.get('code'); // 토큰 요청에 필요한 인가 코드
                const error = searchParams.get('error'); // 인증 실패 시 에러 코드

                if (error) {
                    handleError(`카카오 로그인 오류: ${error}`);
                    return;
                }

                if (!code) {
                    handleError('인가 코드가 없습니다. 다시 로그인 해주세요.');
                    return;
                }

                // Step 2 : 인가 코드로 백엔드에 토큰 요청 (Next.js → Spring Boot → Kakao로 요청)
                const tokenResponse = await fetch(
                    `http://localhost:8080/api/auth/oauth/token?` +
                    `grant_type=authorization_code&` +
                    `client_id=349f89103b32e7135ad6f15e0a73509b&` +
                    `redirect_uri=${encodeURIComponent('http://localhost:3000/auth/callback')}&` +
                    `code=${code}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                if (!tokenResponse.ok) {
                    handleError('카카오 토큰 요청 실패');
                    return;
                }

                const tokenData = await tokenResponse.json();

                console.log('카카오 토큰 획득 성공');

                // Step 3 : 액세스 토큰으로 백엔드에 카카오 사용자 정보 조회 (Next.js → Spring Boot → Kakao로 요청)
                const userResponse = await fetch('https://localhost:8080/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!userResponse.ok) {
                    handleError('카카오 사용자 정보 조회 실패');
                    return;
                }

                const kakaoUser = await userResponse.json();

                console.log('카카오 사용자 정보:', kakaoUser);

                // Step 4 : 백엔드에 사용자 존재 여부 확인
                const checkResponse = await fetch(
                    `http://localhost:8080/api/auth/oauth/check?provider=KAKAO&oauthUserId=${kakaoUser.id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!checkResponse.ok) {
                    handleError('사용자 존재 여부 확인 실패');
                    return;
                }

                const checkResult = await checkResponse.json();

                if (checkResult.exists) {
                    // Step 5-1: 기존 사용자 → 로그인
                    const loginResponse = await fetch('http://localhost:8080/api/auth/oauth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            provider: 'KAKAO',
                            oauthUserId: kakaoUser.id.toString()
                        }),
                    });

                    if (!loginResponse.ok) {
                        handleError('로그인 실패');
                        return;
                    }

                    const loginData = await loginResponse.json();

                    setAuth(loginData.user, loginData.accessToken);
                    setStatus('success');
                    setTimeout(() => router.push('/'), 1500);
                } else {
                    // Step 5-2: 신규 사용자 → 회원가입
                    setUserInfo({
                        provider: 'KAKAO',
                        oauthId: kakaoUser.id.toString(),
                        name: kakaoUser.kakao_account?.profile?.name || '사용자',
                        email: kakaoUser.kakao_account?.email || '',
                        profile: kakaoUser.kakao_account?.profile?.profile_image_url || ''
                    });
                    setStatus('need_signup');
                }
            } catch (error) {
                console.error('Authentication failed:', error);

                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
                setTimeout(() => router.push('/'), 3000);
            }
        };

        handleCallback().then();
    }, [searchParams, setAuth, router, handleError]);

    // 회원가입
    const handleSignUp = useCallback(async () => {
        if (!userInfo) return;

        try {
            setStatus('loading');

            const signUpResponse = await fetch('http://localhost:8080/api/auth/oauth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInfo),
            });

            if (!signUpResponse.ok) {
                handleError('회원가입 실패');
                return;
            }

            const signUpResult = await signUpResponse.json();

            setAuth(signUpResult.user, signUpResult.accessToken);
            setStatus('success');
            setTimeout(() => router.push('/'), 1500);
        } catch (error) {
            console.error('Sign up failed:', error);
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
        }
    }, [userInfo, setAuth, handleError, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                {status === 'loading' && (
                    <>
                        <div
                            className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중</h2>
                        <p className="text-gray-600">잠시만 기다려주세요...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div
                            className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 성공!</h2>
                        <p className="text-gray-600">메인 페이지로 이동합니다...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div
                            className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 실패</h2>
                        <p className="text-gray-600 mb-2">{errorMessage}</p>
                        <p className="text-sm text-gray-500 mt-2">3초 후 메인 페이지로 이동합니다...</p>
                    </>
                )}

                {status === 'need_signup' && userInfo && (
                    <>
                        <div
                            className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">회원가입이 필요합니다</h2>

                        <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-sm text-gray-600 mb-2">카카오 계정 정보</p>
                            <p className="text-sm"><strong>이름 : </strong> {userInfo.name}</p>
                            <p className="text-sm"><strong>이메일 : </strong> {userInfo.email}</p>
                        </div>

                        <button
                            onClick={handleSignUp}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded-lg mb-2 transition-colors"
                        >
                            회원가입 완료하기
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            취소
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        // Suspense : Async component loading 처리
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AuthContent/>
        </Suspense>
    );
}