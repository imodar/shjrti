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

        // التحقق من وجود profile للمستخدم
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, created_at')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // فحص إذا كان المستخدم جديد (تم إنشاء profile منذ أقل من 30 ثانية)
        // لأن trigger قاعدة البيانات ينشئ profile تلقائياً فور إنشاء المستخدم
        const isNewUser = profile && 
                         (new Date().getTime() - new Date(profile.created_at).getTime()) < 30000;
        
        console.log('Profile check:', { 
          profileExists: !!profile, 
          createdAt: profile?.created_at,
          timeDiff: profile ? (new Date().getTime() - new Date(profile.created_at).getTime()) : 0,
          isNewUser 
        });

        if (isNewUser) {
          console.log('New Google user detected, sending welcome email');
          // إرسال رسالة الترحيب للمستخدمين الجدد من Google
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: {
                email: session.user.email,
                firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.full_name?.split(' ')[0] || '',
                lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.full_name?.split(' ')[1] || '',
                language: 'ar'
              }
            });
            console.log('Welcome email sent to new Google user');
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // لا نوقف العملية حتى لو فشل إرسال البريد
          }
        }

        // التحقق من وجود اشتراك نشط باستخدام RPC function
        const { data: subscriptionData, error: subError } = await supabase
          .rpc('get_user_subscription_details', { user_uuid: session.user.id });

        if (subError) {
          console.error('Subscription check error:', subError);
        }

        // التحقق إذا كان لديه اشتراك نشط
        const hasActiveSubscription = subscriptionData && 
                                      subscriptionData.length > 0 && 
                                      subscriptionData[0].subscription_id &&
                                      subscriptionData[0].status !== 'free';

        if (!hasActiveSubscription) {
          console.log('No active subscription found, redirecting to plan selection');
          // استخدام replace بدلاً من navigate لمنع الرجوع
          navigate('/plan-selection', { replace: true });
        } else {
          console.log('Active subscription found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
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
