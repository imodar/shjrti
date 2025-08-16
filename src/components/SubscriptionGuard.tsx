import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateDisplay } from '@/components/DateDisplay';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requireActiveSubscription?: boolean;
  fallbackContent?: React.ReactNode;
}

export function SubscriptionGuard({ 
  children, 
  requireActiveSubscription = true, 
  fallbackContent 
}: SubscriptionGuardProps) {
  const { subscription, loading, isExpired, daysUntilExpiry, showExpiryWarning } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-500 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse text-lg font-medium">جاري التحقق من الاشتراك...</p>
        </div>
      </div>
    );
  }

  // If subscription is required and user is expired, show renewal prompt
  if (requireActiveSubscription && isExpired) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
        </div>
        
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <Card className="w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-xl"></div>
                <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 relative z-10" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                انتهت صلاحية الاشتراك
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                يجب تجديد اشتراكك للمتابعة واستخدام جميع الميزات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription?.package_name && (
                <div className="flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">الباقة الحالية</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{subscription.package_name}</p>
                  </div>
                </div>
              )}
              
              {subscription?.expires_at && (
                <div className="flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/50">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">تاريخ الانتهاء</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      <DateDisplay date={subscription.expires_at} className="inline font-bold text-red-600" />
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/plan-selection')} 
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 rounded-xl shadow-lg transition-all duration-300 text-base font-medium"
                >
                  تجديد الاشتراك
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')} 
                  className="w-full border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-6 rounded-xl transition-all duration-300 text-base"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show expiry warning if needed
  const content = (
    <>
      {showExpiryWarning && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <div className="flex items-center justify-between">
              <span>
                ينتهي اشتراكك خلال {daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigate('/plan-selection')}
                className="ml-2"
              >
                جدد الآن
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );

  return content;
}