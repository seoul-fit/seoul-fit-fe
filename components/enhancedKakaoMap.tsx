'use client';

import React, { useState, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePreferences } from '@/hooks/usePreferences';
import { Info } from 'lucide-react';
import Header, { HeaderRef } from './layout/Header';
import SideBar from './layout/SideBar';
import MapContainer, { MapContainerRef } from './map/MapContainer';
import LogoutModal from './auth/LogoutModal';
import { useKakaoLogin } from '@/hooks/useKakaoLogin';
import type { SearchItem } from '@/hooks/useSearchCache';

// 기존 타입 정의들
interface MapStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}
export default function SeoulFitMapApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const { preferences, togglePreference, refreshPreferences, showWarning, setShowWarning } =
    usePreferences();
  const { login, logout } = useKakaoLogin();
  const [searchQuery, setSearchQuery] = useState('');
  const mapContainerRef = useRef<MapContainerRef>(null);
  const headerRef = useRef<HeaderRef>(null);

  // 상태 관리
  const [mapStatus] = useState<MapStatus>({
    loading: true,
    error: null,
    success: false,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 검색 결과 선택 핸들러
  const handleSearchSelect = async (searchItem: SearchItem) => {
    if (mapContainerRef.current) {
      await mapContainerRef.current.handleSearchSelect(searchItem);
    }
  };

  // 검색 초기화 핸들러
  const handleSearchClear = () => {
    setSearchQuery('');
    if (mapContainerRef.current) {
      mapContainerRef.current.handleSearchClear();
    }
  };

  // 메뉴 토글 함수로 변경
  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // 지도 클릭 핸들러 (검색 제안 닫기 및 검색창 포커스 해제)
  const handleMapClick = () => {
    if (headerRef.current) {
      headerRef.current.closeSearchSuggestions();
      headerRef.current.blurSearchInput();
    }
  };

  return (
    <>
      {/* 헤더 섹션 - 고정 */}
      <div className='sticky top-0 z-50 bg-white border-b border-gray-200'>
        <Header
          ref={headerRef}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onSearchSelect={handleSearchSelect}
          onSearchClear={handleSearchClear}
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
        showWarning={showWarning}
        onWarningClose={() => setShowWarning(false)}
        onLogin={login}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 에러 알림 */}
      {mapStatus.error && (
        <div className='p-4'>
          <Alert variant='destructive'>
            <Info className='h-4 w-4' />
            <AlertDescription>{mapStatus.error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* 지도 영역 - 전체 화면에서 헤더 제외한 나머지 */}
      <div className='h-[calc(100vh-80px)] relative'>
        <MapContainer
          ref={mapContainerRef}
          preferences={preferences}
          onPreferenceToggle={togglePreference}
          onMapClick={handleMapClick}
          onLocationReset={() => setSearchQuery('')}
        />
      </div>

      {/* 로그아웃 모달 */}
      <LogoutModal
        showLogoutModal={showLogoutModal}
        showLogoutSuccess={showLogoutSuccess}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          try {
            await logout();
            setShowLogoutModal(false);
            setShowLogoutSuccess(true);
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          } catch (error) {
            console.error('로그아웃 실패:', error);
            setShowLogoutModal(false);
            setShowLogoutSuccess(false);
          }
        }}
      />
    </>
  );
}
