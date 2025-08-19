'use client';

import { useEffect } from 'react';
import { kakaoConfig } from '@/config/kakao';

export default function TestEnvPage() {
  useEffect(() => {
    console.log('환경 변수 테스트:');
    console.log('process.env:', {
      NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
      NEXT_PUBLIC_KAKAO_LOGIN_API_KEY: process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY,
      NEXT_PUBLIC_KAKAO_REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
    });
    console.log('kakaoConfig:', kakaoConfig);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>환경 변수 테스트</h1>
      <h2>process.env 직접 접근:</h2>
      <pre>
        {JSON.stringify({
          NEXT_PUBLIC_KAKAO_MAP_API_KEY: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY,
          NEXT_PUBLIC_KAKAO_LOGIN_API_KEY: process.env.NEXT_PUBLIC_KAKAO_LOGIN_API_KEY,
          NEXT_PUBLIC_KAKAO_REDIRECT_URI: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI,
        }, null, 2)}
      </pre>
      <h2>kakaoConfig 사용:</h2>
      <pre>{JSON.stringify(kakaoConfig, null, 2)}</pre>
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