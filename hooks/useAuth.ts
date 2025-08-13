// hooks/useAuth.ts - Comprehensive authentication hook
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import * as authService from '@/services/auth';
import { OAuthProvider, UserInterests, AuthResponse } from '@/lib/types';

export interface UseAuthReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // OAuth Actions
  verifyOAuthCode: (provider: OAuthProvider, authorizationCode: string, redirectUri: string) => Promise<any>;
  checkOAuthUser: (provider: OAuthProvider, oauthUserId: string) => Promise<any>;
  oauthLogin: (provider: OAuthProvider, authorizationCode: string, redirectUri: string) => Promise<void>;
  oauthSignup: (
    provider: OAuthProvider,
    oauthUserId: string,
    nickname: string,
    email: string,
    interests: UserInterests[],
    profileImageUrl?: string
  ) => Promise<void>;
  oauthLogout: () => Promise<void>;
  unlinkOAuth: () => Promise<void>;
  
  // Utility Actions
  refreshToken: () => Promise<void>;
  checkEmailDuplicate: (email: string) => Promise<boolean>;
  getOAuthUrl: (provider: OAuthProvider, redirectUri: string, scope?: string, state?: string) => Promise<any>;
  
  // Clear error
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth, accessToken, refreshToken: storedRefreshToken } = useAuthStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const verifyOAuthCode = useCallback(async (
    provider: OAuthProvider,
    authorizationCode: string,
    redirectUri: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.verifyOAuthCode({
        provider,
        authorizationCode,
        redirectUri,
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth 인가코드 검증에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkOAuthUser = useCallback(async (
    provider: OAuthProvider,
    oauthUserId: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.checkOAuthUser(provider, oauthUserId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth 사용자 확인에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const oauthLogin = useCallback(async (
    provider: OAuthProvider,
    authorizationCode: string,
    redirectUri: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await authService.oauthLogin({
        provider,
        authorizationCode,
        redirectUri,
      });
      
      setAuth(response.user, response.accessToken, response.refreshToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth 로그인에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);

  const oauthSignup = useCallback(async (
    provider: OAuthProvider,
    oauthUserId: string,
    nickname: string,
    email: string,
    interests: UserInterests[],
    profileImageUrl?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await authService.oauthSignup({
        provider,
        oauthUserId,
        nickname,
        email,
        interests,
        profileImageUrl,
      });
      
      setAuth(response.user, response.accessToken, response.refreshToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth 회원가입에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setAuth]);

  const refreshTokenAction = useCallback(async () => {
    if (!storedRefreshToken) {
      throw new Error('리프레시 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response: AuthResponse = await authService.refreshToken(storedRefreshToken);
      setAuth(response.user, response.accessToken, response.refreshToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 갱신에 실패했습니다.';
      setError(errorMessage);
      clearAuth(); // 토큰 갱신 실패 시 로그아웃
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [storedRefreshToken, setAuth, clearAuth]);

  const oauthLogout = useCallback(async () => {
    if (!accessToken) {
      clearAuth();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await authService.oauthLogout(accessToken);
      clearAuth();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그아웃에 실패했습니다.';
      setError(errorMessage);
      // 로그아웃 실패해도 로컬 상태는 클리어
      clearAuth();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearAuth]);

  const unlinkOAuth = useCallback(async () => {
    if (!accessToken) {
      throw new Error('인증 토큰이 없습니다.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await authService.unlinkOAuth(accessToken);
      clearAuth();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth 연결 해제에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, clearAuth]);

  const checkEmailDuplicate = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isDuplicate = await authService.checkEmailDuplicate(email);
      return isDuplicate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이메일 중복 확인에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOAuthUrl = useCallback(async (
    provider: OAuthProvider,
    redirectUri: string,
    scope?: string,
    state?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authService.getOAuthUrl(provider, redirectUri, scope, state);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OAuth URL 생성에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    verifyOAuthCode,
    checkOAuthUser,
    oauthLogin,
    oauthSignup,
    oauthLogout,
    unlinkOAuth,
    refreshToken: refreshTokenAction,
    checkEmailDuplicate,
    getOAuthUrl,
    clearError,
  };
}
