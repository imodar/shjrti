import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">جاري التحقق من الاشتراك...</p>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">انتهت صلاحية الاشتراك</CardTitle>
            <CardDescription>
              يجب تجديد اشتراكك للمتابعة واستخدام جميع الميزات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.package_name && (
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">الباقة الحالية: {subscription.package_name}</span>
              </div>
            )}
            
            {subscription?.expires_at && (
              <div className="flex items-center space-x-2 space-x-reverse bg-muted/50 rounded-lg p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  انتهت في: {new Date(subscription.expires_at).toLocaleDateString('ar-SA')}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => navigate('/plan-selection')} className="w-full">
                تجديد الاشتراك
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                العودة للرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
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