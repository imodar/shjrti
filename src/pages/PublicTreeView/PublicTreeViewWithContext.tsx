import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from '../PublicTreeView';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Wrapper component for Share Token based public viewing
const PublicTreeViewWithContext: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  const { toast } = useToast();
  const { t } = useLanguage();
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (shareToken) {
      loadFamilyData();
    }
  }, [shareToken]);

  const loadFamilyData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-shared-family', {
        body: { share_token: shareToken }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: t('common.error') || 'Error',
          description: t(`tree_settings.${data.error.toLowerCase()}`) || data.error,
          variant: 'destructive'
        });
        setIsLoading(false);
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
      toast({
        title: t('common.error') || 'Error',
        description: t('common.network_error') || 'Failed to load family tree',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  if (isLoading || !familyData) {
    return <PublicTreeView shareToken={shareToken} />;
  }

  return (
    <FamilyDataProvider familyId={familyData.family?.id} initialData={familyData}>
      <PublicTreeView shareToken={shareToken} />
    </FamilyDataProvider>
  );
};

export default PublicTreeViewWithContext;
