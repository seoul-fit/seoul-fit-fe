'use client';

import React, {useState} from 'react';
import {Alert, AlertDescription} from "@/components/ui/alert";
import {usePreferences} from '@/hooks/usePreferences';
import {Info} from "lucide-react";
import Header from './layout/Header';
import SideBar from './layout/SideBar';
import MapContainer from './map/MapContainer';
import {useAuthStore} from "../store/authStore";

// 기존 타입 정의들
interface MapStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}
export default function SeoulFitMapApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { preferences, togglePreference, refreshPreferences } = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  // 사용자 ID 확인
  React.useEffect(() => {
    if (isAuthenticated && user) {
      console.log('현재 로그인된 사용자 ID:', user.id);
      console.log('사용자 정보:', user);
    }
  }, [isAuthenticated, user]);

  // 상태 관리
  const [mapStatus] = useState<MapStatus>({
    loading: true,
    error: null,
    success: false
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 메뉴 토글 함수로 변경
  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <>
      {/* 헤더 섹션 - 고정 */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <Header
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onMenuClick={handleMenuToggle}
        />
      </div>

      {/* 사이드바 */}
      <SideBar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        preferences={preferences}
        onPreferenceToggle={togglePreference}
        onPreferencesRefresh={refreshPreferences}
        onLogin={() => {
          const KAKAO_CLIENT_ID = '349f89103b32e7135ad6f15e0a73509b';
          const REDIRECT_URI = 'http://localhost:3000/auth/callback';
          window.location.href = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
        }}
        onLogout={async () => {
          console.log("로그아웃 시도...");
          if (!confirm("로그아웃 하시겠습니까?")) return;
          const accessToken = localStorage.getItem('access_token');
          console.log("ACCESS_TOKEN ::::: " + accessToken);
          localStorage.removeItem('access_token');
          clearAuth();
        }}
      />

      {/* 에러 알림 */}
      {mapStatus.error && (
        <div className="p-4">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>{mapStatus.error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 지도 영역 - 전체 화면에서 헤더 제외한 나머지 */}
      <div className="h-[calc(100vh-80px)] relative">
        <MapContainer />
      </div>
    </>
  );
}