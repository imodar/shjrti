import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ArrowRight, Share2, Upload, X } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

interface SocialMediaSettings {
  id: string;
  site_name: {
    ar: string;
    en: string;
  };
  default_description: {
    ar: string;
    en: string;
  };
  og_image_url: string | null;
  twitter_handle: string | null;
}

export default function AdminSocialMedia() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SocialMediaSettings | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAdminAndLoadSettings();
  }, [user]);

  const checkAdminAndLoadSettings = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data: isAdminData } = await supabase
        .rpc("is_admin", { user_uuid: user.id });

      if (!isAdminData) {
        toast.error(t("common.access_denied"));
        navigate("/dashboard");
        return;
      }

      await loadSettings();
    } catch (error: any) {
      console.error("Error checking admin:", error);
      toast.error(t("common.error_loading_data"));
      navigate("/dashboard");
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("social_media_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          ...data,
          site_name: data.site_name as { ar: string; en: string },
          default_description: data.default_description as { ar: string; en: string }
        });
      } else {
        // Default values if not found
        setSettings({
          id: "",
          site_name: { ar: "منصة شجرتي", en: "Shejrati Platform" },
          default_description: {
            ar: "منصة عربية متخصصة في بناء وحفظ شجرة العائلة",
            en: "Arabic platform specialized in building and preserving family trees"
          },
          og_image_url: null,
          twitter_handle: null
        });
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error(t("common.error_loading_data"));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("common.invalid_file_type"));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("family-tree-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("family-tree-images")
        .getPublicUrl(filePath);

      setSettings(prev => prev ? { ...prev, og_image_url: publicUrl } : null);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSettings(prev => prev ? { ...prev, og_image_url: null } : null);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const dataToSave = {
        site_name: settings.site_name,
        default_description: settings.default_description,
        og_image_url: settings.og_image_url,
        twitter_handle: settings.twitter_handle,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from("social_media_settings")
          .update(dataToSave)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("social_media_settings")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings({ ...settings, id: data.id });
      }

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">إعدادات المشاركة على السوشل ميديا</h1>
            <p className="text-muted-foreground">
              إدارة معاينة الروابط عند المشاركة (Open Graph Tags)
            </p>
          </div>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="grid gap-6">
          {/* اسم الموقع */}
          <Card>
            <CardHeader>
              <CardTitle>اسم الموقع</CardTitle>
              <CardDescription>
                سيظهر هذا الاسم عند مشاركة أي رابط من الموقع
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>اسم الموقع بالعربية</Label>
                <Input
                  value={settings.site_name.ar}
                  onChange={(e) => setSettings({
                    ...settings,
                    site_name: { ...settings.site_name, ar: e.target.value }
                  })}
                  placeholder="منصة شجرتي"
                />
              </div>
              <div>
                <Label>اسم الموقع بالإنجليزية</Label>
                <Input
                  value={settings.site_name.en}
                  onChange={(e) => setSettings({
                    ...settings,
                    site_name: { ...settings.site_name, en: e.target.value }
                  })}
                  placeholder="Shejrati Platform"
                />
              </div>
            </CardContent>
          </Card>

          {/* الوصف الافتراضي */}
          <Card>
            <CardHeader>
              <CardTitle>الوصف الافتراضي</CardTitle>
              <CardDescription>
                يُستخدم هذا الوصف للعوائل التي ليس لديها وصف خاص
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>الوصف بالعربية</Label>
                <Textarea
                  value={settings.default_description.ar}
                  onChange={(e) => setSettings({
                    ...settings,
                    default_description: { ...settings.default_description, ar: e.target.value }
                  })}
                  placeholder="منصة عربية متخصصة في بناء وحفظ شجرة العائلة"
                  rows={3}
                />
              </div>
              <div>
                <Label>الوصف بالإنجليزية</Label>
                <Textarea
                  value={settings.default_description.en}
                  onChange={(e) => setSettings({
                    ...settings,
                    default_description: { ...settings.default_description, en: e.target.value }
                  })}
                  placeholder="Arabic platform specialized in building and preserving family trees"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* صورة المعاينة */}
          <Card>
            <CardHeader>
              <CardTitle>صورة المعاينة</CardTitle>
              <CardDescription>
                الصورة التي ستظهر عند مشاركة روابط الموقع (يُنصح بحجم 1200x630 بكسل)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.og_image_url ? (
                <div className="relative">
                  <img
                    src={settings.og_image_url}
                    alt="Open Graph preview"
                    className="w-full max-w-2xl rounded-lg border"
                  />
                  <Button
                    onClick={handleRemoveImage}
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    اسحب صورة هنا أو اضغط لاختيار ملف
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* حساب تويتر */}
          <Card>
            <CardHeader>
              <CardTitle>حساب تويتر</CardTitle>
              <CardDescription>
                اسم حساب تويتر الخاص بالموقع (اختياري)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span>@</span>
                <Input
                  value={settings.twitter_handle || ""}
                  onChange={(e) => setSettings({
                    ...settings,
                    twitter_handle: e.target.value || null
                  })}
                  placeholder="shjrti"
                />
              </div>
            </CardContent>
          </Card>

          {/* معاينة */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                معاينة المشاركة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-background">
                {settings.og_image_url && (
                  <img
                    src={settings.og_image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">shjrti.com</p>
                  <h3 className="font-bold mb-1">
                    {settings.site_name[currentLanguage as 'ar' | 'en']} - عائلة الشيخ سعيد
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.default_description[currentLanguage as 'ar' | 'en']}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* زر الحفظ */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-5 w-5 ms-2" />
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
