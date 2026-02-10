/**
 * Hook to determine user's role and permissions for a specific family
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

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
  const { user, loading: userLoading } = useCurrentUser();
  const [role, setRole] = useState<FamilyRole>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !user || userLoading) {
      setLoading(userLoading);
      return;
    }

    const checkRole = async () => {
      setLoading(true);
      try {
        // Check if owner
        const { data: family } = await supabase
          .from('families')
          .select('creator_id')
          .eq('id', familyId)
          .maybeSingle();

        if (family?.creator_id === user.id) {
          setRole('owner');
          setLoading(false);
          return;
        }

        // Check if collaborator via edge function (uses service role)
        const { data: collabData } = await supabase
          .from('family_collaborators' as any)
          .select('role')
          .eq('family_id', familyId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (collabData) {
          setRole((collabData as any).role || 'editor');
        } else {
          setRole('none');
        }
      } catch (err) {
        console.error('Error checking family role:', err);
        setRole('none');
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [familyId, user?.id, userLoading]);

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
