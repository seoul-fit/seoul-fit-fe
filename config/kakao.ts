/**
 * 카카오 API 설정
 */

// 카카오맵 API 키
export const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '8bb6267aba6b69af4605b7fd2dd75c96';

// 카카오 로그인 API 키
export const KAKAO_LOGIN_API_KEY = process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY || 'e088e86f98c03c2f1ce887c85aee1fa6';

// 카카오 API 설정
export const kakaoConfig = {
  map: {
    apiKey: KAKAO_MAP_API_KEY,
    defaultCenter: { lat: 37.5665, lng: 126.978 },
    defaultLevel: 3,
  },
  login: {
    apiKey: KAKAO_LOGIN_API_KEY,
    redirectUri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  },
};

// 디버깅용 로그
if (typeof window !== 'undefined') {
  console.log('[KakaoConfig] 환경 변수 상태:', {
    mapApiKey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
    loginApiKey: process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY,
    redirectUri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
  });
  console.log('[KakaoConfig] 최종 설정:', kakaoConfig);
}