import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from './PublicTreeView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { PROTECTED_ROUTES } from '@/constants/routes';
import PasswordModal from '@/components/PasswordModal';

const CustomDomainRedirect = () => {
  const { customDomain } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [familyData, setFamilyData] = useState<any>(null);
  const [familyName, setFamilyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

    // Reset state when domain changes
    setFamilyData(null);
    setFamilyName('');
    setShowPasswordModal(false);

    loadFamilyData();
  }, [customDomain, navigate]);

  const loadFamilyData = async (password?: string) => {
    try {
      setIsLoading(true);

      const response = await supabase.functions.invoke('custom-domain-redirect', {
        body: { customDomain, password },
      });

      // Handle both data and error responses - edge function returns 401 for password required
      const data = response.data || (response.error as any)?.context;
      
      // Parse error response body if needed
      let parsedData = data;
      if (!parsedData && response.error) {
        // Try to parse from error message
        const errorMessage = response.error.message || '';
        const match = errorMessage.match(/\{.*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Handle password required response (comes as 401)
      if (parsedData?.error === 'PASSWORD_REQUIRED') {
        setFamilyName(parsedData?.familyName || customDomain || '');
        setShowPasswordModal(true);
        setIsLoading(false);
        return;
      }

      if (parsedData?.error === 'PASSWORD_INCORRECT') {
        toast({
          title: 'خطأ',
          description: 'كلمة المرور غير صحيحة',
          variant: 'destructive',
        });
        setFamilyName(parsedData?.familyName || familyName || customDomain || '');
        setShowPasswordModal(true);
        setIsLoading(false);
        return;
      }

      // If no success and no password error, it's a real error
      if (!parsedData?.success) {
        console.error('[CustomDomainRedirect] Invalid domain:', parsedData?.error);
        navigate('/404', { replace: true });
        return;
      }

      const { family, members, marriages } = parsedData.data;
      console.log('[CustomDomainRedirect] Data loaded:', {
        familyId: family?.id,
        membersCount: members?.length || 0,
        marriagesCount: marriages?.length || 0,
      });

      // Extract a display name for the password modal (string or JSON)
      const name =
        typeof family?.name === 'string'
          ? family.name
          : family?.name?.ar || family?.name?.en || customDomain || '';

      setFamilyName(name);
      setFamilyData({
        family,
        members: members || [],
        marriages: marriages || [],
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading family data:', error);
      // Network error or invalid response - redirect to 404
      navigate('/404', { replace: true });
    }
  };

  if (showPasswordModal) {
    return (
      <PasswordModal
        isOpen={showPasswordModal}
        familyName={familyName || ''}
        onClose={() => {
          setShowPasswordModal(false);
          navigate('/404', { replace: true });
        }}
        onSubmit={async (password) => {
          await loadFamilyData(password);
        }}
      />
    );
  }

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
        marriages: familyData.marriages || [],
      }}
    >
      <PublicTreeView skipDataLoading={true} />
    </FamilyDataProvider>
  );
};

export default CustomDomainRedirect;
