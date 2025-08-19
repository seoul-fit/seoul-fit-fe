/**
 * @fileoverview Auth Callback UI Component
 * @description OAuth 콜백 처리 UI 컴포넌트
 */

'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOAuthCallback } from '../model/oauth-flow';
import { SignupForm } from './SignupForm';
import { LoadingStates } from './LoadingStates';

function AuthContent() {
  const searchParams = useSearchParams();
  const { status, errorMessage, userInfo, handleCallback, handleSignUp } = useOAuthCallback();

  useEffect(() => {
    const code = searchParams?.get('code');
    const error = searchParams?.get('error');
    
    handleCallback({ code: code || undefined, error: error || undefined });
  }, [searchParams, handleCallback]);

  if (status === 'loading') {
    return <LoadingStates.Loading />;
  }

  if (status === 'success') {
    return <LoadingStates.Success message="로그인 성공!" />;
  }

  if (status === 'success_signup') {
    return <LoadingStates.Success message="회원가입 완료!" />;
  }

  if (status === 'error') {
    return <LoadingStates.Error message={errorMessage} />;
  }

  if (status === 'need_signup' && userInfo) {
    return <SignupForm userInfo={userInfo} onSignUp={handleSignUp} />;
  }

  return null;
}

export const AuthCallback = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
};