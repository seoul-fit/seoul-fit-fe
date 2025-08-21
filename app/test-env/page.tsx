'use client';

import { useEffect } from 'react';
import { kakaoConfig } from '@/config/kakao';

export default function TestEnvPage() {
  useEffect(() => {
    // 개발 환경에서만 실행
    if (process.env.NODE_ENV === 'development') {
      console.log('환경 변수 테스트:');
      console.log('process.env:', {
        NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ? '✅ 설정됨' : '❌ 누락',
        NEXT_PUBLIC_KAKAO_LOGIN_API_KEY: process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY ? '✅ 설정됨' : '❌ 누락',
        NEXT_PUBLIC_KAKAO_REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ? '✅ 설정됨' : '❌ 누락',
      });
      console.log('kakaoConfig 설정 상태:', {
        map: kakaoConfig.map.apiKey ? '✅ 맵 API 키 설정됨' : '❌ 맵 API 키 누락',
        login: kakaoConfig.login.apiKey ? '✅ 로그인 API 키 설정됨' : '❌ 로그인 API 키 누락'
      });
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>환경 변수 테스트</h1>
      <h2>환경 변수 설정 상태:</h2>
      <pre>
        {JSON.stringify({
          NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ? '✅ 설정됨' : '❌ 누락',
          NEXT_PUBLIC_KAKAO_LOGIN_API_KEY: process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY ? '✅ 설정됨' : '❌ 누락',
          NEXT_PUBLIC_KAKAO_REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ? '✅ 설정됨' : '❌ 누락',
        }, null, 2)}
      </pre>
      <h2>카카오 설정 상태:</h2>
      <pre>{JSON.stringify({
        map: { apiKey: kakaoConfig.map.apiKey ? '✅ 설정됨' : '❌ 누락' },
        login: { apiKey: kakaoConfig.login.apiKey ? '✅ 설정됨' : '❌ 누락' }
      }, null, 2)}</pre>
      <h2>카카오맵 테스트:</h2>
      <div id="testMap" style={{ width: '100%', height: '400px', marginTop: '20px' }}></div>
      <script dangerouslySetInnerHTML={{
        __html: `
          setTimeout(() => {
            const script = document.createElement('script');
            script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoConfig.map.apiKey}';
            script.onload = () => {
              const container = document.getElementById('testMap');
              const options = {
                center: new kakao.maps.LatLng(37.5665, 126.978),
                level: 3
              };
              const map = new kakao.maps.Map(container, options);
              console.log('테스트 맵 생성 성공:', map);
            };
            document.head.appendChild(script);
          }, 1000);
        `
      }} />
    </div>
  );
}