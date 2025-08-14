'use client'; // Client Component

import {Suspense, useCallback, useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useAuthStore} from '@/store/authStore';
import {FACILITY_CONFIGS} from '@/lib/facilityIcons';
import {type FacilityCategory} from '@/lib/types';
import {Check} from 'lucide-react';

// User 정보
interface UserInfoResponse {
    user: {
        provider: string;
        oauthUserId: string;
        nickname: string;
        email: string;
        profileImageUrl: string;
    };
    isNewUser: boolean;
}

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {setAuth} = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'need_signup' | 'success_signup'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [userInfo, setUserInfo] = useState<UserInfoResponse['user'] | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // 관심사 목록
    const interestOptions = [
        { value: 'SPORTS', category: 'sports' as FacilityCategory },
        { value: 'CULTURE', category: 'culture' as FacilityCategory },
        { value: 'RESTAURANTS', category: 'restaurant' as FacilityCategory },
        { value: 'LIBRARY', category: 'library' as FacilityCategory },
        { value: 'PARK', category: 'park' as FacilityCategory },
        { value: 'BIKE', category: 'bike' as FacilityCategory },
        { value: 'COOLING_SHELTER', category: 'cooling_shelter' as FacilityCategory },
        { value: 'CULTURAL_EVENT', category: 'cultural_event' as FacilityCategory },
        { value: 'CULTURAL_RESERVATION', category: 'cultural_reservation' as FacilityCategory }
    ];

    // 관심사 변경
    const handleInterestChange = (value: string) => {
        setSelectedInterests(prev => 
            prev.includes(value) 
                ? prev.filter(item => item !== value)
                : [...prev, value]
        );
    };

    // 에러 발생 시
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

    // 기존 사용자 로그인 시도 → 카카오 재로그인을 위해 리다이렉트
    const redirectToKakaoLogin = useCallback(() => {
        const KAKAO_CLIENT_ID = '349f89103b32e7135ad6f15e0a73509b';
        const REDIRECT_URI = encodeURIComponent('http://localhost:3000/auth/callback');
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

        // 현재 상태를 로컬스토리지에 저장 (로그인 시도 중임)
        localStorage.setItem('kakao_login_attempt', 'true');
        localStorage.setItem('kakao_login_type', 'existing_user');

        // 카카오 인증 페이지로 리다이렉트
        window.location.href = kakaoAuthUrl;
    }, []);

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

                // 로컬스토리지에서 로그인 시도 상태 확인
                const isLoginAttempt = localStorage.getItem('kakao_login_attempt');
                const loginType = localStorage.getItem('kakao_login_type');

                // 기존 사용자 재로그인 시도인지 확인
                if (isLoginAttempt && loginType === 'existing_user') {
                    // 로컬스토리지 정리
                    localStorage.removeItem('kakao_login_attempt');
                    localStorage.removeItem('kakao_login_type');

                    // 바로 로그인 API 호출
                    const loginResponse = await fetch('http://localhost:8080/api/auth/oauth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            provider: 'KAKAO',
                            authorizationCode: code,
                            redirectUri: 'http://localhost:3000/auth/callback'
                        }),
                    });

                    if (!loginResponse.ok) {
                        const errorData = await loginResponse.text();
                        console.error('로그인 실패:', errorData);
                        handleError('로그인에 실패했습니다. 다시 시도해주세요.');
                        return;
                    }

                    const loginData = await loginResponse.json();

                    setAuth(loginData.user, loginData.accessToken);
                    localStorage.setItem('access_token', loginData.accessToken);
                    setStatus('success');
                    setTimeout(() => router.push('/'), 1500);
                    return;
                }

                // Step 2 : 인가 코드로 백엔드에 사용자 정보 요청
                const tokenResponse = await fetch('http://localhost:8080/api/auth/oauth/authorizecheck', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider: 'KAKAO',
                        authorizationCode: code,
                        redirectUri: 'http://localhost:3000/auth/callback'
                    }),
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.text();
                    console.error('토큰 요청 실패:', errorData);
                    handleError('카카오 토큰 요청 실패');
                    return;
                }

                const tokenData = await tokenResponse.json();

                // Step 3 : 백엔드에 사용자 존재 여부 확인
                const checkResponse = await fetch('http://localhost:8080/api/auth/oauth/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        provider: 'KAKAO',
                        authorizationCode: code,
                        redirectUri: 'http://localhost:3000/auth/callback',
                        oauthUserId: tokenData.oauthUserId
                    }),
                });

                if (!checkResponse.ok) {
                    const errorData = await checkResponse.text();
                    console.error('사용자 존재 여부 확인 실패:', errorData);
                    handleError('사용자 존재 여부 확인 실패');
                    return;
                }

                const checkResult = await checkResponse.json();

                if (checkResult.exists) {
                    // Step 4-1: 기존 사용자 → 카카오 재인증으로 리다이렉트
                    redirectToKakaoLogin();
                } else {
                    // Step 4-2: 신규 사용자 → 회원가입
                    setUserInfo({
                        provider: 'KAKAO',
                        oauthUserId: tokenData.oauthUserId,
                        nickname: tokenData.nickname,
                        email: tokenData.email,
                        profileImageUrl: tokenData.profileImageUrl
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
    }, [searchParams, setAuth, router, handleError, redirectToKakaoLogin]);

    // 회원가입
    const handleSignUp = useCallback(async () => {
        if (!userInfo) return;

        try {
            setStatus('loading');

            const signUpData = {
                provider: userInfo.provider,
                oauthUserId: userInfo.oauthUserId,
                nickname: userInfo.nickname || 'tester',
                email: userInfo.email || 'test@test.com',
                profileImageUrl: userInfo.profileImageUrl || 'https://example.com/profile.jpg',
                interests: selectedInterests
            };

            const signUpResponse = await fetch('http://localhost:8080/api/auth/oauth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signUpData),
            });

            if (!signUpResponse.ok) {
                const errorData = await signUpResponse.text();
                console.error('회원가입 실패:', errorData);
                handleError('회원가입 실패');
                return;
            }

            const signUpResult = await signUpResponse.json();

            setAuth(signUpResult.user, signUpResult.accessToken);
            setStatus('success_signup');
            setTimeout(() => router.push('/'), 1500);
        } catch (error) {
            console.error('Sign up failed:', error);
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.');
        }
    }, [userInfo, selectedInterests, setAuth, router, handleError]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">로그인 처리 중...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">로그인 성공!</h2>
                    <p className="text-gray-600">메인 페이지로 이동합니다...</p>
                </div>
            </div>
        );
    }

    if (status === 'success_signup') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">회원가입 완료!</h2>
                    <p className="text-gray-600">메인 페이지로 이동합니다...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-2">오류 발생</h2>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                    <p className="text-sm text-gray-500">잠시 후 메인 페이지로 이동합니다...</p>
                </div>
            </div>
        );
    }

    if (status === 'need_signup') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">관심사 선택</h2>
                        <p className="text-gray-600">관심사를 선택하여 맞춤 정보를 받아보세요</p>
                        <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {selectedInterests.length}개 선택
                        </div>
                    </div>

                    {/* 관심사 선택 */}
                    <div className="mb-8">
                        <div className="space-y-3">
                            {interestOptions.map((option, index) => {
                                const config = FACILITY_CONFIGS[option.category];
                                const isSelected = selectedInterests.includes(option.value);
                                
                                return (
                                    <div 
                                        key={option.value}
                                        className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                                            isSelected 
                                                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm' 
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                                        }`}
                                        onClick={() => handleInterestChange(option.value)}
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        {/* 시설 정보 */}
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 group-hover:text-gray-900 text-base transition-colors duration-200">
                                                    {config.label}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                                    {config.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* 체크박스 */}
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                            isSelected
                                                ? 'bg-blue-600 border-blue-600 text-white scale-110'
                                                : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105'
                                        }`}>
                                            <Check className={`w-4 h-4 transition-all duration-200 ${
                                                isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                                            }`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 회원가입 버튼 */}
                    <button
                        onClick={handleSignUp}
                        disabled={selectedInterests.length === 0}
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                        회원가입 완료
                    </button>

                    <p className="text-sm text-gray-500 text-center mt-4">
                        최소 1개 이상의 관심사를 선택해주세요
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        }>
            <AuthContent />
        </Suspense>
    );
}