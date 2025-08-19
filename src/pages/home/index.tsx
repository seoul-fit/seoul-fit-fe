/**
 * @fileoverview Home Page
 * @description 홈 페이지 (지도 메인 화면)
 */

'use client';

import React from 'react';
import { MapContainer } from '@/widgets/map-container';
import { Header } from '@/widgets/header';
import { SideBar } from '@/widgets/sidebar';
import type { UserPreferences, FacilityCategory } from '@/lib/types';

interface HomePageProps {
  preferences?: UserPreferences;
  onPreferenceToggle?: (category: FacilityCategory) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  preferences,
  onPreferenceToggle
}) => {
  const [showSidebar, setShowSidebar] = React.useState(false);

  return (
    <div className="h-screen flex flex-col">
      <Header onMenuClick={() => setShowSidebar(!showSidebar)} />
      <div className="flex-1 relative">
        <MapContainer
          preferences={preferences}
          onPreferenceToggle={onPreferenceToggle}
          initialCenter={{ lat: 37.5665, lng: 126.978 }}
          initialZoom={3}
        />
        <SideBar 
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          preferences={preferences}
          onPreferenceToggle={onPreferenceToggle}
        />
      </div>
    </div>
  );
};