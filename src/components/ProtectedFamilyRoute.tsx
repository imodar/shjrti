import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorPage } from './ErrorPage';
import { Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProtectedFamilyRouteProps {
  children: React.ReactNode;
}

export function ProtectedFamilyRoute({ children }: ProtectedFamilyRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; title: string; message: string } | null>(null);

  const familyId = searchParams.get('family');

  useEffect(() => {
    const validateFamilyAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        setError({
          code: "401",
          title: t('error.unauthorized_title', 'غير مصرح'),
          message: t('error.unauthorized_message', 'يجب تسجيل الدخول للوصول لهذه الصفحة')
        });
        setLoading(false);
        return;
      }

      if (!familyId) {
        setError({
          code: "400",
          title: t('error.invalid_request_title', 'طلب غير صحيح'),
          message: t('error.missing_family_id', 'رقم العائلة مطلوب للوصول لهذه الصفحة')
        });
        setLoading(false);
        return;
      }

      // Validate family ID format (should be a valid UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(familyId)) {
        setError({
          code: "400",
          title: t('error.invalid_family_id_title', 'رقم عائلة غير صحيح'),
          message: t('error.invalid_family_id_message', 'رقم العائلة المطلوب غير صحيح')
        });
        setLoading(false);
        return;
      }

      try {
        // Check if family exists and user has access
        const { data: family, error: familyError } = await supabase
          .from('families')
          .select('id, name, creator_id')
          .eq('id', familyId)
          .single();

        if (familyError || !family) {
          setError({
            code: "404",
            title: t('error.family_not_found_title', 'العائلة غير موجودة'),
            message: t('error.family_not_found_message', 'العائلة المطلوبة غير موجودة أو لا تملك صلاحية للوصول إليها')
          });
          setLoading(false);
          return;
        }

        // Check if user is the creator or a member of the family
        const isCreator = family.creator_id === user.id;
        
        if (!isCreator) {
          // Check if user is a family member
          const { data: membership } = await supabase
            .from('family_members')
            .select('id')
            .eq('family_id', familyId)
            .eq('user_id', user.id)
            .single();

          if (!membership) {
            setError({
              code: "403",
              title: t('error.access_denied_title', 'الوصول مرفوض'),
              message: t('error.access_denied_message', 'ليس لديك صلاحية للوصول لهذه العائلة')
            });
            setLoading(false);
            return;
          }
        }

        // If we reach here, access is allowed
        setError(null);
      } catch (error) {
        console.error('Error validating family access:', error);
        setError({
          code: "500",
          title: t('error.server_error_title', 'خطأ في الخادم'),
          message: t('error.server_error_message', 'حدث خطأ أثناء التحقق من صلاحية الوصول')
        });
      } finally {
        setLoading(false);
      }
    };

    validateFamilyAccess();
  }, [user, authLoading, familyId, t]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('common.loading', 'جاري التحميل...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPage
        code={error.code}
        title={error.title}
        message={error.message}
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  return <>{children}</>;
}