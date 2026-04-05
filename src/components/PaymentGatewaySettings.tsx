import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, Settings, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PaymentGatewaySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [isActive, setIsActive] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState<'sandbox' | 'live'>('sandbox');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .eq('gateway_name', 'paypal')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default
          await createDefaultSettings();
        } else {
          throw error;
        }
      } else {
        setSettings(data);
        setEnvironment(data.environment as 'sandbox' | 'live');
        setIsActive(data.is_active);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب إعدادات بوابة الدفع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .insert([
          {
            gateway_name: 'paypal',
            is_active: true,
            environment: 'sandbox',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      setEnvironment('sandbox');
      setIsActive(true);
    } catch (error: any) {
      console.error('Error creating default settings:', error);
    }
  };

  const handleEnvironmentChange = (newEnvironment: 'sandbox' | 'live') => {
    if (newEnvironment === 'live') {
      setPendingEnvironment(newEnvironment);
      setShowConfirmDialog(true);
    } else {
      saveSettings(newEnvironment, isActive);
    }
  };

  const confirmEnvironmentChange = () => {
    saveSettings(pendingEnvironment, isActive);
    setShowConfirmDialog(false);
  };

  const saveSettings = async (newEnvironment: 'sandbox' | 'live', newIsActive: boolean) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('payment_gateway_settings')
        .update({
          environment: newEnvironment,
          is_active: newIsActive,
          updated_at: new Date().toISOString(),
        })
        .eq('gateway_name', 'paypal');

      if (error) throw error;

      setEnvironment(newEnvironment);
      setIsActive(newIsActive);

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات بوابة الدفع بنجاح',
      });

      // Refresh settings
      await fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات بوابة الدفع PayPal
              </CardTitle>
              <CardDescription>
                إدارة إعدادات PayPal والتبديل بين البيئة التجريبية والحقيقية
              </CardDescription>
            </div>
            <Badge
              variant={environment === 'live' ? 'destructive' : 'secondary'}
              className="text-sm"
            >
              {environment === 'live' ? '🔴 مباشر' : '🟡 تجريبي'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Environment Switcher */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="environment" className="text-base font-semibold">
                  البيئة
                </Label>
                <p className="text-sm text-muted-foreground">
                  اختر بين البيئة التجريبية (Sandbox) أو المباشرة (Live)
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={environment === 'sandbox' ? 'default' : 'outline'}
                  onClick={() => handleEnvironmentChange('sandbox')}
                  disabled={saving}
                  className="min-w-24"
                >
                  تجريبي
                </Button>
                <Button
                  variant={environment === 'live' ? 'default' : 'outline'}
                  onClick={() => handleEnvironmentChange('live')}
                  disabled={saving}
                  className="min-w-24 bg-red-600 hover:bg-red-700"
                >
                  مباشر
                </Button>
              </div>
            </div>

            {environment === 'live' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <strong>تحذير:</strong> أنت الآن في الوضع المباشر. سيتم معالجة المدفوعات الحقيقية.
                </div>
              </div>
            )}
          </div>

          {/* Gateway Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="is-active" className="text-base font-semibold">
                تفعيل بوابة الدفع
              </Label>
              <p className="text-sm text-muted-foreground">
                تمكين أو تعطيل PayPal كوسيلة دفع
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={(checked) => saveSettings(environment, checked)}
              disabled={saving}
            />
          </div>

          {/* Credentials Info */}
          <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold">بيانات الاعتماد</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              يتم تخزين بيانات اعتماد PayPal بشكل آمن في Supabase Secrets:
            </p>
            <ul className="text-sm space-y-1 mr-4 list-disc text-muted-foreground">
              <li>PAYPAL_CLIENT_ID_SANDBOX</li>
              <li>PAYPAL_CLIENT_SECRET_SANDBOX</li>
              <li>PAYPAL_CLIENT_ID_LIVE</li>
              <li>PAYPAL_CLIENT_SECRET_LIVE</li>
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/settings/functions`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              إدارة Secrets في Supabase
            </Button>
          </div>

          {/* Testing Info */}
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">معلومات الاختبار</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              في البيئة التجريبية، يمكنك استخدام حسابات PayPal التجريبية للاختبار.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://developer.paypal.com/dashboard/accounts', '_blank')}
            >
              <ExternalLink className="h-4 w-4 ml-2" />
              إنشاء حسابات تجريبية في PayPal
            </Button>
          </div>

          {/* Last Updated */}
          {settings?.updated_at && (
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              آخر تحديث: {new Date(settings.updated_at).toLocaleString('ar-SA')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد التبديل للوضع المباشر</AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك التبديل إلى الوضع المباشر. سيتم معالجة المدفوعات الحقيقية.
              تأكد من أن لديك بيانات اعتماد PayPal الصحيحة للوضع المباشر.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEnvironmentChange}
              className="bg-red-600 hover:bg-red-700"
            >
              تأكيد التبديل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
