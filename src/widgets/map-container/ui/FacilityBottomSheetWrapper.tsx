import React from 'react';
import { useFacilityContext } from './providers/FacilityProvider';
import { FacilityBottomSheet } from './FacilityBottomSheet';

export const FacilityBottomSheetWrapper: React.FC = () => {
  const { selectedFacility, selectFacility } = useFacilityContext();
  
  if (!selectedFacility) return null;
  
  return (
    <FacilityBottomSheet
      facility={selectedFacility}
      isOpen={!!selectedFacility}
      onClose={() => selectFacility(null)}
    />
  );
};