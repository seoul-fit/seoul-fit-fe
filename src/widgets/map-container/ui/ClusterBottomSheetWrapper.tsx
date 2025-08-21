import React from 'react';
import { useFacilityContext } from './providers/FacilityProvider';
import { ClusterBottomSheet } from './ClusterBottomSheet';

export const ClusterBottomSheetWrapper: React.FC = () => {
  const { selectedCluster, selectCluster } = useFacilityContext();
  
  console.log('[ClusterBottomSheetWrapper] selectedCluster 전체:', selectedCluster);
  console.log('[ClusterBottomSheetWrapper] selectedCluster 요약:', selectedCluster ? {
    id: selectedCluster.id,
    count: selectedCluster.count,
    primaryCategory: selectedCluster.primaryCategory,
    facilities: selectedCluster.facilities?.length || 0
  } : null);
  
  if (!selectedCluster) {
    console.log('[ClusterBottomSheetWrapper] selectedCluster가 null이므로 렌더링하지 않음');
    return null;
  }
  
  console.log('[ClusterBottomSheetWrapper] ClusterBottomSheet 컴포넌트 렌더링 시작');
  
  return (
    <ClusterBottomSheet
      cluster={selectedCluster}
      isOpen={!!selectedCluster}
      onClose={() => selectCluster(null)}
    />
  );
};