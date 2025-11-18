import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Save, Loader2, Image, FileText } from "lucide-react";

export default function AdminSocialMediaSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [settings, setSettings] = useState({
    og_site_name: "منصة شجرتي",
    og_default_description: "",
    og_image_url: "",
    twitter_site: "@shjrti",
  });

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, []);

  const checkAdminAndLoadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: adminData } = await supabase.rpc('is_admin', {
        user_uuid: user.id
      });

      if (!adminData) {
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: "Access denied: Admin only",
        });
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadSettings();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['og_site_name', 'og_default_description', 'og_image_url', 'twitter_site']);

      if (error) throw error;

      if (data) {
        const loadedSettings: any = { ...settings };
        data.forEach(item => {
          loadedSettings[item.setting_key] = item.setting_value;
        });
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'og_site_name', value: settings.og_site_name, description: 'اسم الموقع في Open Graph' },
        { key: 'og_default_description', value: settings.og_default_description, description: 'الوصف الافتراضي للعوائل' },
        { key: 'og_image_url', value: settings.og_image_url, description: 'رابط صورة المعاينة' },
        { key: 'twitter_site', value: settings.twitter_site, description: 'حساب تويتر للموقع' },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            setting_key: setting.key,
            setting_value: setting.value,
            description: setting.description,
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      toast({
        title: t('common.success'),
        description: "تم حفظ إعدادات المشاركة بنجاح",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "فشل حفظ الإعدادات",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalHeader />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              إعدادات المشاركة على السوشل ميديا
            </h1>
            <p className="text-muted-foreground">
              تحكم في كيفية ظهور روابط الموقع عند مشاركتها على الواتساب وتويتر وفيسبوك
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                معلومات الموقع العامة
              </CardTitle>
              <CardDescription>
                هذه المعلومات تظهر عند مشاركة أي رابط من الموقع
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og_site_name">اسم الموقع</Label>
                <Input
                  id="og_site_name"
                  value={settings.og_site_name}
                  onChange={(e) => setSettings({ ...settings, og_site_name: e.target.value })}
                  placeholder="منصة شجرتي"
                />
                <p className="text-sm text-muted-foreground">
                  يظهر في عنوان المعاينة: "{settings.og_site_name} - عائلة الشيخ سعيد"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_default_description">الوصف الافتراضي للعوائل</Label>
                <Textarea
                  id="og_default_description"
                  value={settings.og_default_description}
                  onChange={(e) => setSettings({ ...settings, og_default_description: e.target.value })}
                  placeholder="اكتشف تاريخ العائلة وشجرة الأنساب الكاملة"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  يُستخدم عندما لا تحتوي العائلة على وصف خاص
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                صورة المعاينة
              </CardTitle>
              <CardDescription>
                صورة واحدة تُستخدم لجميع العوائل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og_image_url">رابط الصورة</Label>
                <Input
                  id="og_image_url"
                  value={settings.og_image_url}
                  onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                  placeholder="https://example.com/og-image.jpg"
                  dir="ltr"
                />
                <p className="text-sm text-muted-foreground">
                  الحجم الموصى به: 1200x630 بكسل (نسبة 1.91:1)
                </p>
              </div>

              {settings.og_image_url && (
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={settings.og_image_url} 
                    alt="معاينة الصورة" 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات تويتر</CardTitle>
              <CardDescription>
                معلومات إضافية لمعاينة تويتر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter_site">حساب تويتر (@)</Label>
                <Input
                  id="twitter_site"
                  value={settings.twitter_site}
                  onChange={(e) => setSettings({ ...settings, twitter_site: e.target.value })}
                  placeholder="@shjrti"
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ms-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
            >
              رجوع
            </Button>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
