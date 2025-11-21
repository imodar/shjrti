import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Globe, Loader2, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminCustomDomain() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: adminData, error } = await supabase.rpc("is_admin", {
        user_uuid: user.id,
      });

      if (error) throw error;

      if (!adminData) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadSettings();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "custom_domain_settings")
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        const settings = data.setting_value as { enabled?: boolean; api_key?: string };
        setEnabled(settings.enabled || false);
        setApiKey(settings.api_key || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settings = {
        enabled,
        api_key: apiKey,
      };

      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "custom_domain_settings",
          setting_value: settings,
        });

      if (error) throw error;

      // Save to localStorage for immediate use
      localStorage.setItem('custom_domain_settings', JSON.stringify(settings));

      toast({
        title: t("admin.custom_domain.save_success", "تم الحفظ"),
        description: t("admin.custom_domain.save_success_desc", "تم حفظ إعدادات الروابط المخصصة بنجاح"),
      });

      // Reload page to apply settings
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t("common.error", "خطأ"),
        description: t("admin.custom_domain.save_error", "فشل حفظ الإعدادات"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
      <GlobalHeader />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gray-900/50 backdrop-blur-xl border-emerald-400/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-400/20 rounded-lg">
                  <Globe className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    {t("admin.custom_domain.title", "إعدادات الروابط المخصصة")}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {t("admin.custom_domain.description", "إدارة إعدادات الدومين المخصص لـ Supabase")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="bg-amber-400/10 border-amber-400/30">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300">
                  {t("admin.custom_domain.warning", "تفعيل الروابط المخصصة يتطلب إعداد Custom Domain في Supabase Dashboard أولاً. بعد حفظ الإعدادات، سيتم إعادة تحميل الصفحة لتطبيق التغييرات.")}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="custom-domain-enabled" className="text-white">
                      {t("admin.custom_domain.enable", "تفعيل الروابط المخصصة")}
                    </Label>
                    <p className="text-sm text-gray-400">
                      {t("admin.custom_domain.enable_desc", "استخدام https://api.shjrti.com بدلاً من Supabase URL الافتراضي")}
                    </p>
                  </div>
                  <Switch
                    id="custom-domain-enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                  />
                </div>

                {enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-white">
                      {t("admin.custom_domain.api_key", "API Key")}
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t("admin.custom_domain.api_key_placeholder", "أدخل API Key للدومين المخصص")}
                      className="bg-gray-800/50 border-emerald-400/30 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      {t("admin.custom_domain.api_key_hint", "سيتم إضافة &apikey= إلى جميع طلبات API عند استخدام الدومين المخصص")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                  className="border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                >
                  {t("common.back", "رجوع")}
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={saving || (enabled && !apiKey)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ms-2" />
                      {t("common.saving", "جاري الحفظ...")}
                    </>
                  ) : (
                    t("common.save", "حفظ")
                  )}
                </Button>
              </div>

              <Alert className="bg-blue-400/10 border-blue-400/30">
                <AlertDescription className="text-blue-300 text-sm space-y-2">
                  <p className="font-semibold">{t("admin.custom_domain.setup_instructions", "خطوات الإعداد:")}</p>
                  <ol className="list-decimal list-inside space-y-1 ps-2">
                    <li>{t("admin.custom_domain.step1", "أضف Custom Domain في Supabase Dashboard → API Settings")}</li>
                    <li>{t("admin.custom_domain.step2", "احصل على API Key من Custom Domain Settings")}</li>
                    <li>{t("admin.custom_domain.step3", "الصق API Key هنا وفعّل الروابط المخصصة")}</li>
                    <li>{t("admin.custom_domain.step4", "سيتم إعادة تحميل الصفحة تلقائياً لتطبيق التغييرات")}</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
