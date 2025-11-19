import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from '../PublicTreeView';

// Wrapper component for Share Token based public viewing
const PublicTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');

  // No FamilyDataProvider needed - PublicTreeView will fetch via Edge Function
  return <PublicTreeView shareToken={shareToken} />;
};

export default PublicTreeViewWithContext;
