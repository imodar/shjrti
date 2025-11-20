import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { FamilyDataProvider } from '@/contexts/FamilyDataContext';
import PublicTreeView from './PublicTreeView';

const CustomDomainRedirect = () => {
  const { customDomain } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [familyId, setFamilyId] = useState<string | null>(null);

  useEffect(() => {
    const lookupAndRedirect = async () => {
      if (!customDomain) {
        setError('لم يتم تحديد النطاق المخصص');
        setLoading(false);
        return;
      }

      try {
        // Use edge function with service role access for custom domain lookup
        const { data, error: functionError } = await supabase.functions.invoke(
          'custom-domain-redirect',
          {
            body: { customDomain }
          }
        );

        if (functionError) {
          setError('خطأ في البحث عن العائلة');
          setLoading(false);
          return;
        }

        if (data?.error || !data?.family_id) {
          setError('لم يتم العثور على عائلة بهذا النطاق المخصص');
          setLoading(false);
          return;
        }
        
        // Set family ID to display the tree
        setFamilyId(data.family_id);
        setLoading(false);

      } catch (error) {
        setError('حدث خطأ غير متوقع');
        setLoading(false);
      }
    };

    lookupAndRedirect();
  }, [customDomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">عذراً، حدث خطأ</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              يرجى التحقق من الرابط والمحاولة مرة أخرى
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display PublicTreeView with the found familyId
  if (familyId) {
    return (
      <FamilyDataProvider familyId={familyId}>
        <PublicTreeView overrideFamilyId={familyId} />
      </FamilyDataProvider>
    );
  }

  return null;
};

export default CustomDomainRedirect;