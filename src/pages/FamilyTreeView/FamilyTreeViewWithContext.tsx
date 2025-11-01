import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import FamilyTreeView from '../FamilyTreeView';

// Wrapper component that provides FamilyDataContext to FamilyTreeView
const FamilyTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  return (
    <FamilyDataProvider familyId={familyId}>
      <FamilyTreeView />
    </FamilyDataProvider>
  );
};

export default FamilyTreeViewWithContext;
