import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from './PublicTreeView';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const CustomDomainRedirect = () => {
  const { customDomain } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customDomain) {
      loadFamilyData();
    }
  }, [customDomain]);

  const loadFamilyData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('custom-domain-redirect', {
        body: { customDomain }
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
      toast({
        title: t('common.error') || 'Error',
        description: t('common.network_error') || 'Failed to load family tree',
        variant: 'destructive'
      });
      setIsLoading(false);
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