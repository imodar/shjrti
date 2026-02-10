/**
 * Hook to determine user's role and permissions for a specific family
 * Uses REST API (api-family-invitations?action=my-role) - no direct queries
 */

import { useState, useEffect, useMemo } from 'react';
import { familyInvitationsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type FamilyRole = 'owner' | 'editor' | 'none';

export interface FamilyPermissions {
  role: FamilyRole;
  loading: boolean;
  canEditMembers: boolean;
  canEditSettings: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSubscription: boolean;
  canArchive: boolean;
  canChangeCustomDomain: boolean;
  canLeave: boolean;
  isOwner: boolean;
  isCollaborator: boolean;
}

export function useFamilyRole(familyId: string | null | undefined): FamilyPermissions {
  const { user } = useAuth();
  const [role, setRole] = useState<FamilyRole>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !user) {
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      setLoading(true);
      try {
        const data = await familyInvitationsApi.getMyRole(familyId);
        setRole(data.role);
      } catch (err) {
        console.error('Error checking family role:', err);
        setRole('none');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [familyId, user?.id]);

  const permissions = useMemo((): FamilyPermissions => {
    const isOwner = role === 'owner';
    const isCollaborator = role === 'editor';
    const hasAccess = isOwner || isCollaborator;

    return {
      role,
      loading,
      canEditMembers: hasAccess,
      canEditSettings: hasAccess,
      canDelete: isOwner,
      canInvite: isOwner,
      canManageSubscription: isOwner,
      canArchive: isOwner,
      canChangeCustomDomain: isOwner,
      canLeave: isCollaborator,
      isOwner,
      isCollaborator,
    };
  }, [role, loading]);

  return permissions;
}
