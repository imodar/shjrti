import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

const CustomDomainRedirect = () => {
  const { customDomain } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const lookupAndRedirect = async () => {
      if (!customDomain) {
        setError('لم يتم تحديد النطاق المخصص');
        setLoading(false);
        return;
      }

      try {
        console.log('Looking up custom domain:', customDomain);

        // Look up family by custom domain
        const { data: family, error: lookupError } = await supabase
          .from('families')
          .select('id, name, custom_domain')
          .eq('custom_domain', customDomain)
          .maybeSingle();

        if (lookupError) {
          console.error('Error looking up family:', lookupError);
          setError('خطأ في البحث عن العائلة');
          setLoading(false);
          return;
        }

        if (!family) {
          console.log('No family found for domain:', customDomain);
          setError('لم يتم العثور على عائلة بهذا النطاق المخصص');
          setLoading(false);
          return;
        }

        console.log('Found family, redirecting to:', family.id);
        
        // Redirect to the family tree view
        navigate(`/family-tree-view?family=${family.id}`, { replace: true });

      } catch (error) {
        console.error('Error in custom domain lookup:', error);
        setError('حدث خطأ غير متوقع');
        setLoading(false);
      }
    };

    lookupAndRedirect();
  }, [customDomain, navigate]);

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

  return null;
};

export default CustomDomainRedirect;