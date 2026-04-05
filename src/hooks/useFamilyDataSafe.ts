import { useContext } from 'react';
import { FamilyDataContext } from '@/contexts/FamilyDataContext';

/**
 * Safe version of useFamilyData that doesn't throw when used outside a FamilyDataProvider.
 * Returns the context value or null if no provider is found.
 */
export const useFamilyDataSafe = () => {
  return useContext(FamilyDataContext) ?? null;
};
