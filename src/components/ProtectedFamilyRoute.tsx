import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorPage } from './ErrorPage';
import { Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProtectedFamilyRouteProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function ProtectedFamilyRoute({ children, loadingFallback }: ProtectedFamilyRouteProps) {
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
  }, [user, authLoading, familyId]);

  if (loading || authLoading) {
    // If custom loading fallback is provided, use it
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    // Otherwise, use default loading spinner
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <Loader className="h-6 w-6 animate-spin text-white" />
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">{t('common.loading', 'جاري التحميل...')}</p>
          </div>
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