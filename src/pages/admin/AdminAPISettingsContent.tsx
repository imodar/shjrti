import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Key, Save, Eye, EyeOff, Shield, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminAPISettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Public Settings
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [showSiteKey, setShowSiteKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load reCAPTCHA public settings
      const { data: recaptchaData } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'recaptcha_public_settings')
        .single();

      if (recaptchaData) {
        const settings = recaptchaData.setting_value as { siteKey?: string };
        setRecaptchaSiteKey(settings.siteKey || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePublicSettings = async () => {
    setSaving(true);
    try {
      const settingsValue = {
        siteKey: recaptchaSiteKey,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'recaptcha_public_settings',
          setting_value: settingsValue,
          description: 'Google reCAPTCHA v3 Public Settings',
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast.success('تم حفظ الإعدادات العامة بنجاح');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">إدارة API Keys والإعدادات</h2>
        <p className="text-muted-foreground">
          إدارة جميع مفاتيح API والإعدادات العامة للنظام
        </p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>ملاحظة أمنية:</strong> هذه الصفحة تحتوي على إعدادات حساسة. يجب حفظ المفاتيح السرية في Supabase Secrets فقط.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="public">
            <Globe className="w-4 h-4 me-2" />
            الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="private">
            <Key className="w-4 h-4 me-2" />
            المفاتيح السرية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Google reCAPTCHA v3 - الإعدادات العامة
              </CardTitle>
              <CardDescription>
                هذه الإعدادات ستكون متاحة للـ Frontend (React)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recaptcha-site-key">
                  reCAPTCHA Site Key (عام)
                </Label>
                <div className="relative">
                  <Input
                    id="recaptcha-site-key"
                    type={showSiteKey ? 'text' : 'password'}
                    value={recaptchaSiteKey}
                    onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                    placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    className="pe-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute start-0 top-0 h-full px-3"
                    onClick={() => setShowSiteKey(!showSiteKey)}
                  >
                    {showSiteKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  احصل على المفتاح من:{' '}
                  <a
                    href="https://www.google.com/recaptcha/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google reCAPTCHA Admin Console
                  </a>
                </p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={savePublicSettings}
                  disabled={saving || !recaptchaSiteKey}
                  className="w-full"
                >
                  <Save className="w-4 h-4 me-2" />
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                المفاتيح السرية (Supabase Secrets)
              </CardTitle>
              <CardDescription>
                هذه المفاتيح محفوظة بشكل آمن في Supabase Edge Functions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  المفاتيح السرية محفوظة في Supabase Secrets ولا يمكن عرضها هنا لأسباب أمنية.
                  <br />
                  يمكنك تحديثها من:{' '}
                  <a
                    href={`https://supabase.com/dashboard/project/xzakoccnfswabrdwvukp/settings/functions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium"
                  >
                    Supabase Dashboard - Functions Secrets
                  </a>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 pt-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">المفاتيح المطلوبة:</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• <code>RECAPTCHA_SECRET_KEY</code> - Google reCAPTCHA Secret Key</li>
                    <li>• <code>OPENAI_API_KEY</code> - OpenAI API Key (للميزات الذكية)</li>
                    <li>• <code>PAYPAL_CLIENT_ID_LIVE</code> - PayPal Live Client ID</li>
                    <li>• <code>PAYPAL_CLIENT_SECRET_LIVE</code> - PayPal Live Secret</li>
                    <li>• <code>SMTP_PASSWORD</code> - SMTP Password للإيميلات</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
