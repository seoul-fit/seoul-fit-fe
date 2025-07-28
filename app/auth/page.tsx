'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

function AuthContent() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const error = searchParams.get('error');

                // 에러 체크
                if (error) {
                    throw new Error(`카카오 로그인 오류: ${error}`);
                }

                if (!code) {
                    throw new Error('인증 코드가 없습니다.');
                }

                // 상태값 검증 (CSRF 방지)
                const storedState = localStorage.getItem('kakao_oauth_state');
                if (state !== storedState) {
                    throw new Error('상태값이 일치하지 않습니다.');
                }

                // 상태값 정리
                localStorage.removeItem('kakao_oauth_state');

                // 백엔드로 인증 코드 전송
                const response = await fetch('http://localhost:8080/api/auth/kakao/callback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        code: code,
                        redirectUri: 'http://localhost:3000/auth/callback'
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    const { user, token } = result;

                    setAuth(user, token);
                    setStatus('success');

                    // 1초 후 메인 페이지로 이동
                    setTimeout(() => router.push('/'), 1000);
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '서버 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('Authentication failed:', error);
                setStatus('error');
                setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
                setTimeout(() => router.push('/'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, setAuth, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
                {status === 'loading' && (
                    <>
                        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중</h2>
                        <p className="text-gray-600">잠시만 기다려주세요...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 성공!</h2>
                        <p className="text-gray-600">메인 페이지로 이동합니다...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 실패</h2>
                        <p className="text-gray-600 mb-2">{errorMessage}</p>
                        <p className="text-sm text-gray-500 mt-2">3초 후 메인 페이지로 이동합니다...</p>
                    </>
                )}
            </div>
        </div>
    );
  }

export default function AuthCallback() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
          <AuthContent />
        </Suspense>
    )
}
