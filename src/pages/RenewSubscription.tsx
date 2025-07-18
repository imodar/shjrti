import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Package, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RenewSubscription() {
  const { subscription, loading, isExpired, daysUntilExpiry } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const isNearExpiry = !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>

          {/* Status Alert */}
          {isExpired && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                <strong>انتهت صلاحية اشتراكك!</strong> يجب تجديد الاشتراك للمتابعة واستخدام جميع الميزات.
              </AlertDescription>
            </Alert>
          )}

          {isNearExpiry && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                ينتهي اشتراكك خلال {daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}. 
                جدد اشتراكك الآن لتجنب انقطاع الخدمة.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Subscription Status */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <Package className="h-5 w-5" />
                    <span>الاشتراك الحالي</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription?.package_name ? (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground">الباقة</div>
                        <div className="font-medium">{subscription.package_name}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">الحالة</div>
                        <Badge variant={isExpired ? "destructive" : "default"}>
                          {isExpired ? "منتهية الصلاحية" : "نشطة"}
                        </Badge>
                      </div>
                      
                      {subscription.expires_at && (
                        <div>
                          <div className="text-sm text-muted-foreground">تاريخ الانتهاء</div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(subscription.expires_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {!isExpired && daysUntilExpiry !== null && (
                        <div>
                          <div className="text-sm text-muted-foreground">الأيام المتبقية</div>
                          <div className="text-lg font-bold text-primary">
                            {daysUntilExpiry} {daysUntilExpiry === 1 ? 'يوم' : 'أيام'}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">
                        لا يوجد اشتراك نشط
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Renewal Options */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>خيارات التجديد</CardTitle>
                  <CardDescription>
                    اختر الباقة المناسبة لك وجدد اشتراكك للاستمرار في استخدام جميع الميزات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={() => navigate('/plan-selection')}
                        className="w-full h-auto p-6 justify-start"
                      >
                        <div className="text-left">
                          <div className="font-semibold">عرض جميع الباقات</div>
                          <div className="text-sm opacity-90">اختر من بين الباقات المتاحة</div>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/payment')}
                        className="w-full h-auto p-6 justify-start"
                      >
                        <div className="text-left">
                          <div className="font-semibold">تجديد سريع</div>
                          <div className="text-sm opacity-90">جدد بنفس الباقة الحالية</div>
                        </div>
                      </Button>
                    </div>

                    {/* Benefits reminder */}
                    <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                      <div className="text-sm font-medium mb-2">مميزات الاشتراك:</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>إنشاء شجرة العائلة وإدارتها</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>إضافة أفراد العائلة بلا حدود</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>حفظ الصور والذكريات</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span>مشاركة شجرة العائلة مع الأقارب</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}