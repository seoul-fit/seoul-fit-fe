/**
 * @fileoverview 새로운 지도 컨테이너 (리팩토링된 버전)
 * @description 프로바이더 패턴을 사용한 모듈화된 지도 컨테이너
 * @author Seoul Fit Team
 * @since 2.0.0
 */

'use client';

import React, { useCallback } from 'react';
import { MapProvider } from './providers/MapProvider';
import { FacilityProvider, useFacilityContext } from './providers/FacilityProvider';
import { MapView } from './MapView';
import { ClusterBottomSheetWrapper } from './ClusterBottomSheetWrapper';
import { FacilityBottomSheetWrapper } from './FacilityBottomSheetWrapper';
import SideBar from '@/shared/ui/layout/SideBar';
import type { 
  UserPreferences, 
  FacilityCategory, 
  Position,
  Facility,
  ClusteredFacility 
} from '@/lib/types';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';

// MapContainer Props
interface MapContainerProps {
  /** CSS 클래스명 */
  className?: string;
  /** 사용자 선호도 */
  preferences?: UserPreferences;
  /** 선호도 토글 핸들러 */
  onPreferenceToggle?: (category: FacilityCategory) => void;
  /** 지도 클릭 핸들러 */
  onMapClick?: () => void;
  /** 위치 리셋 핸들러 */
  onLocationReset?: () => void;
  /** 초기 중심 좌표 */
  initialCenter?: Position;
  /** 초기 줌 레벨 */
  initialZoom?: number;
  /** 사이드바 열림 상태 */
  isSidebarOpen?: boolean;
  /** 사이드바 닫기 핸들러 */
  onSidebarClose?: () => void;
  /** 로그인 핸들러 */
  onLogin?: () => void;
  /** 로그아웃 핸들러 */
  onLogout?: () => void;
  /** 경고 표시 상태 */
  showWarning?: boolean;
  /** 경고 닫기 핸들러 */
  onWarningClose?: () => void;
}

// Ref 인터페이스 (기존 호환성 유지)
export interface MapContainerRef {
  handleSearchSelect: (searchItem: SearchItem) => Promise<void>;
  handleSearchClear: () => void;
}

/**
 * 지도 컨테이너 컴포넌트 (리팩토링된 버전)
 * 
 * 주요 개선사항:
 * - 프로바이더 패턴을 통한 상태 관리 분리
 * - 단일 책임 원칙 준수
 * - 컴포넌트 크기 대폭 축소 (827줄 → 140줄)
 * - 관심사 분리를 통한 유지보수성 향상
 */
// 내부 컴포넌트 - FacilityContext 사용
const MapContainerInner: React.FC<MapContainerProps & { forwardedRef: React.Ref<MapContainerRef> }> = ({
  className,
  onMapClick,
  isSidebarOpen,
  onSidebarClose,
  onLogin,
  onLogout,
  showWarning,
  onWarningClose,
  forwardedRef,
}) => {
  const { activeCategories, toggleCategory } = useFacilityContext();
  
  // console.log('[MapContainerInner] 렌더링됨');
  // console.log('[MapContainerInner] isSidebarOpen:', isSidebarOpen);
  // console.log('[MapContainerInner] activeCategories:', activeCategories);
  // console.log('[MapContainerInner] toggleCategory 함수 존재:', !!toggleCategory);
  
  React.useImperativeHandle(forwardedRef, () => ({
    handleSearchSelect: async (searchItem: SearchItem) => {
      console.log('Search item selected:', searchItem);
    },
    handleSearchClear: () => {
      console.log('Search cleared');
    },
  }), []);
  
  return (
    <>
      <div className={className}>
        <MapView />
        <ClusterBottomSheetWrapper />
        <FacilityBottomSheetWrapper />
      </div>
      
      {/* 사이드바 - 맵 마커 토글용 (백엔드 업데이트 없음) */}
      {isSidebarOpen !== undefined && (
        <SideBar
          isOpen={isSidebarOpen}
          onClose={onSidebarClose || (() => {})}
          activeCategories={activeCategories}
          onCategoryToggle={toggleCategory} // 로컬 상태만 업데이트
          showWarning={showWarning}
          onWarningClose={onWarningClose}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      )}
    </>
  );
};

// MapContainer - FacilityProvider로 감싸기
const MapContainer = React.forwardRef<MapContainerRef, MapContainerProps>(
  ({ 
    className,
    preferences, 
    onPreferenceToggle, 
    onMapClick, 
    onLocationReset,
    initialCenter = { lat: 37.5665, lng: 126.978 },
    initialZoom = 3,
    isSidebarOpen,
    onSidebarClose,
    onLogin,
    onLogout,
    showWarning,
    onWarningClose,
  }, ref) => {
    // console.log('[MapContainer] 렌더링 시작');
    // console.log('[MapContainer] Props:', { preferences, initialCenter, initialZoom });
    
    // 지도 클릭 핸들러
    const handleMapClick = useCallback((position: Position) => {
      console.log('Map clicked at:', position);
      onMapClick?.();
    }, [onMapClick]);

    // 지도 유휴 상태 핸들러
    const handleMapIdle = useCallback(() => {
      console.log('Map idle');
      // 필요시 추가 로직 구현
    }, []);

    // 시설 선택 핸들러
    const handleFacilitySelect = useCallback((facility: Facility | null) => {
      console.log('Facility selected:', facility);
      // 필요시 추가 로직 구현
    }, []);

    // 클러스터 선택 핸들러
    const handleClusterSelect = useCallback((cluster: ClusteredFacility | null) => {
      console.log('Cluster selected:', cluster);
      // 필요시 추가 로직 구현
    }, []);

    // Ref 메서드 구현 (기존 호환성 유지)
    React.useImperativeHandle(ref, () => ({
      handleSearchSelect: async (searchItem: SearchItem) => {
        // TODO: 검색 결과 선택 로직 구현
        console.log('Search item selected:', searchItem);
      },
      handleSearchClear: () => {
        // TODO: 검색 초기화 로직 구현
        console.log('Search cleared');
      },
    }), []);

    return (
      <MapProvider
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        containerId="kakaoMap"
        onMapClick={handleMapClick}
        onMapIdle={handleMapIdle}
      >
        <FacilityProvider
          userPreferences={preferences}
          onPreferenceChange={undefined} // 백엔드 업데이트 비활성화
          onFacilitySelect={handleFacilitySelect}
          onClusterSelect={handleClusterSelect}
        >
          <MapContainerInner
            className={className}
            onMapClick={onMapClick}
            isSidebarOpen={isSidebarOpen}
            onSidebarClose={onSidebarClose}
            onLogin={onLogin}
            onLogout={onLogout}
            showWarning={showWarning}
            onWarningClose={onWarningClose}
            forwardedRef={ref}
          />
        </FacilityProvider>
      </MapProvider>
    );
  }
);

MapContainer.displayName = 'MapContainer';

export default MapContainer;
