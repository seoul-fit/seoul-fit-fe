'use client';

import { useEffect } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function KakaoMap() {
  useEffect(() => {
    const API_KEY = '8bb6267aba6b69af4605b7fd2dd75c96';
    
    console.log('🔑 카카오 맵 로드 시작');

    // 기존 스크립트 제거
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      existingScript.remove();
      console.log('🗑️ 기존 스크립트 제거됨');
    }

    const script = document.createElement('script');
    // autoload=false 추가! 이게 핵심입니다
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEY}&autoload=false`;
    
    script.onload = () => {
      console.log('📜 스크립트 로드 완료');
      console.log('🔍 현재 kakao 상태:', {
        kakao: !!(window as any).kakao,
        maps: !!(window as any).kakao?.maps,
        load: !!(window as any).kakao?.maps?.load
      });
      
      if ((window as any).kakao?.maps?.load) {
        console.log('✅ kakao.maps.load 함수 발견! 초기화 시작...');
        
        (window as any).kakao.maps.load(() => {
          console.log('🎉 kakao.maps.load 콜백 실행됨!');
          console.log('🔍 LatLng 확인:', !!(window as any).kakao?.maps?.LatLng);
          
          if ((window as any).kakao?.maps?.LatLng) {
            console.log('✅ LatLng 준비 완료!');
            
            const container = document.getElementById('kakaoMap');
            if (container) {
              try {
                const options = {
                  center: new (window as any).kakao.maps.LatLng(37.5666805, 126.9784147),
                  level: 3
                };
                
                const map = new (window as any).kakao.maps.Map(container, options);
                console.log('🗺️ 지도 생성 성공!');
                
                const statusDiv = document.getElementById('status');
                if (statusDiv) {
                  statusDiv.innerHTML = '✅ 지도 로드 완료!';
                  statusDiv.style.color = 'green';
                }
                
                (window as any).kakao.maps.event.addListener(map, 'tilesloaded', () => {
                  console.log('🎯 지도 타일 로드 완료!');
                });
                
              } catch (error) {
                console.error('❌ 지도 생성 실패:', error);
                const container = document.getElementById('kakaoMap');
                if (container) {
                  container.innerHTML = `
                    <div style="padding:20px;text-align:center;color:red;">
                      지도 생성 실패: ${error}
                    </div>
                  `;
                }
              }
            }
          } else {
            console.error('❌ load 콜백에서도 LatLng가 없음');
          }
        });
      } else {
        console.error('❌ kakao.maps.load 함수가 없음');
      }
    };

    script.onerror = (error) => {
      console.error('❌ 스크립트 로드 실패:', error);
      const statusDiv = document.getElementById('status');
      if (statusDiv) {
        statusDiv.innerHTML = '❌ 스크립트 로드 실패';
        statusDiv.style.color = 'red';
      }
    };

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[src*="dapi.kakao.com"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>카카오 맵 🗺️</h2>
      
      <div 
        id="status"
        style={{ 
          marginBottom: '10px', 
          fontSize: '14px', 
          color: '#007bff',
          fontWeight: 'bold'
        }}
      >
        🔄 autoload=false 방식으로 로딩중...
      </div>
      
      <div 
        id="kakaoMap"
        style={{ 
          width: '500px', 
          height: '400px',
          backgroundColor: '#f8f9fa',
          border: '2px solid #28a745',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#495057'
        }}
      >
        ⏳ kakao.maps.load() 콜백 대기중...
      </div>
    </div>
  );
}