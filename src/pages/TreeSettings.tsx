import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings, 
  Share2, 
  Link2, 
  Eye, 
  Lock, 
  Users, 
  TreePine, 
  Globe, 
  Shield,
  Copy,
  Download,
  Trash2
} from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TreeSettings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const familyId = searchParams.get("family");
  
  const [familyData, setFamilyData] = useState<any>(null);
  const [shareableLink, setShareableLink] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (familyId) {
      fetchFamilyData();
    }
  }, [familyId]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (error) throw error;
      setFamilyData(data);
      setShareableLink(window.location.origin + `/family-tree-view?family=${familyId}`);
    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات العائلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToFamily = () => {
    navigate(`/family-builder-new?family=${familyId}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط الشجرة إلى الحافظة",
    });
  };

  const handleShareTree = () => {
    if (navigator.share) {
      navigator.share({
        title: `شجرة عائلة ${familyData?.name || 'غير محدد'}`,
        url: shareableLink,
      });
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToFamily}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للشجرة
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <TreePine className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                إعدادات شجرة عائلة {familyData?.name || 'غير محدد'}
              </h1>
              <p className="text-sm text-muted-foreground">
                إدارة إعدادات المشاركة والخيارات المتقدمة للشجرة
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* مشاركة الشجرة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                مشاركة الشجرة
              </CardTitle>
              <CardDescription>
                يمكنك مشاركة شجرة العائلة مع الآخرين باستخدام رابط مباشر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shareLink">رابط الشجرة</Label>
                <div className="flex gap-2">
                  <Input 
                    id="shareLink"
                    value={shareableLink} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    نسخ
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleShareTree}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة الرابط
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(shareableLink, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  معاينة الشجرة
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">تفاصيل الرابط</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• يمكن لأي شخص لديه هذا الرابط مشاهدة الشجرة</p>
                  <p>• الرابط صالح دائماً ما لم تحذف الشجرة</p>
                  <p>• لا يمكن لزوار الرابط تعديل المعلومات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الشجرة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5" />
                معلومات الشجرة
              </CardTitle>
              <CardDescription>
                معلومات أساسية عن شجرة العائلة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم العائلة</Label>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {familyData?.name || 'غير محدد'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الإنشاء</Label>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {familyData?.created_at ? new Date(familyData.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </div>
                </div>
              </div>
              
              {familyData?.description && (
                <div className="space-y-2">
                  <Label>وصف العائلة</Label>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {familyData.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* إعدادات متقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات متقدمة
              </CardTitle>
              <CardDescription>
                خيارات إضافية لإدارة الشجرة (قريباً)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto p-4 justify-start"
                  disabled
                >
                  <Download className="h-4 w-4" />
                  <div className="text-right">
                    <div className="font-medium">تصدير الشجرة</div>
                    <div className="text-xs text-muted-foreground">تصدير بيانات العائلة (قريباً)</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto p-4 justify-start"
                  disabled
                >
                  <Users className="h-4 w-4" />
                  <div className="text-right">
                    <div className="font-medium">إدارة الأذونات</div>
                    <div className="text-xs text-muted-foreground">تحديد من يمكنه التعديل (قريباً)</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto p-4 justify-start"
                  disabled
                >
                  <Lock className="h-4 w-4" />
                  <div className="text-right">
                    <div className="font-medium">إعدادات الخصوصية</div>
                    <div className="text-xs text-muted-foreground">التحكم في الوصول (قريباً)</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-auto p-4 justify-start"
                  disabled
                >
                  <Globe className="h-4 w-4" />
                  <div className="text-right">
                    <div className="font-medium">إعدادات العرض</div>
                    <div className="text-xs text-muted-foreground">تخصيص طريقة العرض (قريباً)</div>
                  </div>
                </Button>
              </div>

              <Separator />

              <div className="pt-2">
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  disabled
                >
                  <Trash2 className="h-4 w-4" />
                  حذف الشجرة نهائياً
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  تحذير: هذا الإجراء لا يمكن التراجع عنه (قريباً)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <GlobalFooterSimplified />
    </div>
  );
};

export default TreeSettings;