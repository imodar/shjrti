import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import FamilyBuilderNew from '../FamilyBuilderNew';

// Wrapper component that provides FamilyDataContext to FamilyBuilderNew
const FamilyBuilderNewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilyBuilderNew />
    </FamilyDataProvider>
  );
};

export default FamilyBuilderNewWithContext;
