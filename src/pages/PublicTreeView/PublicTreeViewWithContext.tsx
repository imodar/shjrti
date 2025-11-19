import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from '../PublicTreeView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PasswordModal from '@/components/PasswordModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Wrapper component for Share Token based public viewing
const PublicTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const { toast } = useToast();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [familyData, setFamilyData] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (shareToken) {
      loadFamilyDataViaToken();
    } else {
      setTokenError('TOKEN_REQUIRED');
      setIsLoading(false);
    }
  }, [shareToken]);

  const loadFamilyDataViaToken = async (password?: string) => {
    if (!shareToken) return;

    try {
      setIsLoading(true);
      setPasswordError(false);

      const { data, error } = await supabase.functions.invoke('get-shared-family', {
        body: { 
          share_token: shareToken,
          password: password || undefined
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === 'PASSWORD_REQUIRED') {
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        } else if (data.error === 'INVALID_PASSWORD') {
          setPasswordError(true);
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        } else {
          setTokenError(data.error);
          setIsLoading(false);
          return;
        }
      }

      // Store family data for context
      setFamilyData(data.family);
      setInitialData({
        familyData: data.family,
        familyMembers: data.members || [],
        marriages: data.marriages || []
      });
      setIsLoading(false);
      setShowPasswordModal(false);
    } catch (err) {
      console.error('Error loading family data:', err);
      setTokenError('LOAD_ERROR');
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    loadFamilyDataViaToken(password);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t(`public_tree.errors.${tokenError.toLowerCase()}`)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <>
      <FamilyDataProvider familyId={familyData?.id || null} initialData={initialData}>
        <PublicTreeView shareToken={shareToken} />
      </FamilyDataProvider>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        familyName={familyData?.name || ''}
      />
    </>
  );
};

export default PublicTreeViewWithContext;
