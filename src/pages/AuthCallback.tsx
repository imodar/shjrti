import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // الحصول على الجلسة الحالية
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Session error:', sessionError);
          navigate('/auth');
          return;
        }

        // التحقق من وجود اشتراك نشط
        const { data: subscriptionData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('id, status, package_id')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subError) {
          console.error('Subscription check error:', subError);
        }

        // إذا لم يكن لديه اشتراك نشط، وجّهه لاختيار الباقة
        if (!subscriptionData) {
          console.log('No active subscription found, redirecting to plan selection');
          navigate('/plan-selection');
        } else {
          console.log('Active subscription found, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-300">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}
