import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      // Wait for auth to finish loading before making any decisions
      if (authLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin_secure', { user_uuid: user.id });

        if (!isMounted) return;

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          // Normalize various possible return shapes
          let isAdminResult = false;
          const rawData: any = data;
          
          if (rawData === true) {
            isAdminResult = true;
          } else if (typeof rawData === 'string') {
            isAdminResult = rawData.toLowerCase() === 'true' || rawData === 't';
          } else if (typeof rawData === 'number') {
            isAdminResult = rawData === 1;
          } else if (rawData && typeof rawData === 'object') {
            if ('is_admin_secure' in rawData) {
              const val: any = rawData.is_admin_secure;
              isAdminResult = val === true || val === 'true' || val === 't' || val === 1;
            }
          }
          
          setIsAdmin(isAdminResult);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  const value = {
    isAdmin,
    loading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
