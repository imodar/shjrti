import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import StitchPublicTreeView from '../StitchPublicTreeView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const StitchPublicTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shareToken) {
      navigate('/404', { replace: true });
      return;
    }
    loadFamilyData();
  }, [shareToken, navigate]);

  const loadFamilyData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-shared-family', {
        body: { share_token: shareToken }
      });

      if (error) throw error;

      if (data?.error) {
        console.error('[StitchPublicTreeViewWithContext] Invalid token:', data.error);
        navigate('/404', { replace: true });
        return;
      }

      const { family, members, marriages } = data.data;
      setFamilyData({
        family,
        members: members || [],
        marriages: marriages || []
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading family data:', error);
      navigate('/404', { replace: true });
    }
  };

  if (isLoading || !familyData) {
    return (
      <div className="theme-stitch flex items-center justify-center min-h-screen bg-slate-50 dark:bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">{t('common.loading') || 'Loading...'}</p>
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
      <StitchPublicTreeView shareToken={shareToken} skipDataLoading={true} />
    </FamilyDataProvider>
  );
};

export default StitchPublicTreeViewWithContext;
