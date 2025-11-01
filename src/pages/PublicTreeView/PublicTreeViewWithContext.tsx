import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from '../PublicTreeView';

// Wrapper component that provides FamilyDataContext to PublicTreeView
const PublicTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('familyId');

  return (
    <FamilyDataProvider familyId={familyId}>
      <PublicTreeView />
    </FamilyDataProvider>
  );
};

export default PublicTreeViewWithContext;
