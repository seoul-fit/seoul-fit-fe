'use client';

import React, {useState} from 'react';
import {Alert, AlertDescription} from "@/components/ui/alert";
import {usePreferences} from '@/hooks/usePreferences';
import {Info} from "lucide-react";
import Header from './layout/Header';
import SideBar from './layout/SideBar';
import MapContainer from './map/MapContainer';

// 기존 타입 정의들
interface MapStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}
export default function SeoulFitMapApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { preferences, togglePreference } = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');

  // 상태 관리
  const [mapStatus, setMapStatus] = useState<MapStatus>({
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
        isLoggedIn={false} // TODO: 실제 로그인 상태로 교체
        userProfile={undefined} // TODO: 실제 사용자 정보로 교체
        onLogin={() => {
          // TODO: 카카오 로그인 로직 구현
          console.log('카카오 로그인 시도');
        }}
        onLogout={() => {
          // TODO: 로그아웃 로직 구현
          console.log('로그아웃 시도');
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