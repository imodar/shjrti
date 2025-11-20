import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from './PublicTreeView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// List of protected app routes that should never be treated as custom domains
const PROTECTED_ROUTES = [
  'dashboard', 'dashboard-backup', 'auth', 'profile', 'family-creator',
  'family-builder', 'family-builder-new', 'family-tree-view', 
  'family-statistics', 'family-gallery', 'payments', 'plan-selection',
  'payment-success', 'payment', 'change-password', 'store', 'admin',
  'admin-api-settings', 'renew-subscription', 'terms-conditions',
  'privacy-policy', 'contact', 'tree', 'share', 'terms', '404'
];

const CustomDomainRedirect = () => {
  const { customDomain } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!customDomain) {
      // No custom domain provided - redirect to 404
      navigate('/404', { replace: true });
      return;
    }

    // Check if customDomain matches a protected app route
    if (PROTECTED_ROUTES.includes(customDomain.toLowerCase())) {
      console.warn(`[CustomDomainRedirect] "${customDomain}" is a protected app route, redirecting...`);
      navigate(`/${customDomain}`, { replace: true });
      return;
    }

    loadFamilyData();
  }, [customDomain, navigate]);

  const loadFamilyData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('custom-domain-redirect', {
        body: { customDomain }
      });

      if (error) throw error;

      if (data?.error) {
        // Invalid custom domain - redirect to 404
        console.error('[CustomDomainRedirect] Invalid domain:', data.error);
        navigate('/404', { replace: true });
        return;
      }

      const { family, members, marriages } = data.data;
      console.log('[CustomDomainRedirect] Data loaded:', {
        familyId: family?.id,
        membersCount: members?.length || 0,
        marriagesCount: marriages?.length || 0
      });
      setFamilyData({
        family,
        members: members || [],
        marriages: marriages || []
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading family data:', error);
      // Network error or invalid response - redirect to 404
      navigate('/404', { replace: true });
    }
  };

  if (isLoading || !familyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <FamilyDataProvider 
      familyId={familyData.family?.id || null} 
      initialData={{
        family: familyData.family,
        members: familyData.members || [],
        marriages: familyData.marriages || []
      }}
    >
      <PublicTreeView skipDataLoading={true} />
    </FamilyDataProvider>
  );
};

export default CustomDomainRedirect;