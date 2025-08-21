import React from 'react';
import { useFacilityContext } from './providers/FacilityProvider';
import { FacilityBottomSheet } from './FacilityBottomSheet';

export const FacilityBottomSheetWrapper: React.FC = () => {
  const { selectedFacility, selectFacility } = useFacilityContext();
  
  console.log('[FacilityBottomSheetWrapper] selectedFacility:', selectedFacility ? {
    id: selectedFacility.id,
    name: selectedFacility.name,
    category: selectedFacility.category
  } : null);
  
  if (!selectedFacility) return null;
  
  return (
    <FacilityBottomSheet
      facility={selectedFacility}
      isOpen={!!selectedFacility}
      onClose={() => selectFacility(null)}
    />
  );
};