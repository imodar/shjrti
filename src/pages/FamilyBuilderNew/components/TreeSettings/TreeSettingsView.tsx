import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Settings, 
  Share2, 
  Link2, 
  Eye, 
  Copy, 
  Download, 
  Lock, 
  Users, 
  Trash2,
  FileText 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Family } from "../../types/family.types";
import { CustomDomainCard } from "./CustomDomainCard";

interface TreeSettingsViewProps {
  familyData: Family;
  onBack: () => void;
}

export const TreeSettingsView: React.FC<TreeSettingsViewProps> = ({ 
  familyData, 
  onBack 
}) => {
  const { toast } = useToast();
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(familyData?.description || '');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [sharePassword, setSharePassword] = useState(familyData?.share_password || '');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const shareableLink = `${window.location.origin}/family-tree-view?family=${familyData?.id}`;
  const publicShareableLink = `${window.location.origin}/tree?familyId=${familyData?.id}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط الشجرة إلى الحافظة"
    });
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicShareableLink);
    toast({
      title: "تم نسخ الرابط العام",
      description: "تم نسخ رابط المشاركة العام إلى الحافظة"
    });
  };
  
  const handleShareTree = () => {
    if (navigator.share) {
      navigator.share({
        title: `شجرة عائلة ${familyData?.name || 'غير محدد'}`,
        url: shareableLink
      });
    } else {
      handleCopyLink();
    }
  };

  const handleSaveDescription = async () => {
    setIsUpdatingDescription(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ 
          description: description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyData?.id);

      if (error) {
        console.error('Error updating family description:', error);
        toast({
          title: "خطأ",
          description: "فشل في حفظ وصف العائلة",
          variant: "destructive"
        });
        return;
      }

      // Update the local family data
      if (familyData) {
        familyData.description = description.trim() || null;
      }
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ وصف العائلة بنجاح"
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating family description:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ وصف العائلة",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  const handleCancelEditDescription = () => {
    setDescription(familyData?.description || '');
    setIsEditingDescription(false);
  };

  const handleSavePassword = async () => {
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ 
          share_password: sharePassword.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyData?.id);

      if (error) {
        console.error('Error updating family password:', error);
        toast({
          title: "خطأ",
          description: "فشل في حفظ كلمة مرور المشاركة",
          variant: "destructive"
        });
        return;
      }

      // Update the local family data
      if (familyData) {
        familyData.share_password = sharePassword.trim() || null;
      }
      
      toast({
        title: "تم الحفظ",
        description: sharePassword.trim() ? "تم تعيين كلمة مرور للمشاركة العامة" : "تم إزالة كلمة مرور المشاركة"
      });
      setIsEditingPassword(false);
    } catch (error) {
      console.error('Error updating family password:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCancelEditPassword = () => {
    setSharePassword(familyData?.share_password || '');
    setIsEditingPassword(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-md">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">إعدادات الشجرة</h2>
            <p className="text-xs text-muted-foreground">عائلة {familyData?.name || 'غير محدد'}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Custom Domain Card */}
        <CustomDomainCard familyData={familyData} />

        {/* Family Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              وصف العائلة
            </CardTitle>
            <CardDescription>
              أضف وصفاً مختصراً عن تاريخ عائلتك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingDescription ? (
              <div className="space-y-3">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="أدخل وصف العائلة..."
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveDescription}
                    disabled={isUpdatingDescription}
                    size="sm"
                  >
                    {isUpdatingDescription ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEditDescription}
                    size="sm"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground min-h-[60px] p-3 border rounded-lg bg-muted/50">
                  {description || "لم يتم إضافة وصف بعد..."}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingDescription(true)}
                  size="sm"
                >
                  {description ? "تعديل الوصف" : "إضافة وصف"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sharing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              إعدادات المشاركة
            </CardTitle>
            <CardDescription>
              تحكم في كيفية مشاركة شجرة العائلة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">رابط الشجرة الخاص</p>
                    <p className="text-xs text-muted-foreground">للأعضاء المسجلين فقط</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">رابط العرض العام</p>
                    <p className="text-xs text-muted-foreground">يمكن لأي شخص الوصول إليه</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyPublicLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Password Protection */}
            <div className="space-y-3">
              <Label>حماية بكلمة مرور (المشاركة العامة)</Label>
              {isEditingPassword ? (
                <div className="space-y-3">
                  <Input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="أدخل كلمة مرور (اختياري)"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSavePassword}
                      disabled={isUpdatingPassword}
                      size="sm"
                    >
                      {isUpdatingPassword ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEditPassword}
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {sharePassword ? "🔒 الشجرة محمية بكلمة مرور" : "🔓 الشجرة متاحة بدون كلمة مرور"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingPassword(true)}
                    size="sm"
                  >
                    {sharePassword ? "تغيير كلمة المرور" : "إضافة كلمة مرور"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              إعدادات متقدمة
            </CardTitle>
            <CardDescription className="text-xs">
              خيارات إضافية (قريباً)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                <Download className="h-3 w-3 ml-2" />
                تصدير بيانات الشجرة
              </Button>
              
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                <Lock className="h-3 w-3 ml-2" />
                إعدادات الخصوصية
              </Button>
              
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                <Users className="h-3 w-3 ml-2" />
                إدارة الأذونات
              </Button>
            </div>

            <Separator />

            <Button variant="destructive" size="sm" className="w-full justify-start text-xs" disabled>
              <Trash2 className="h-3 w-3 ml-2" />
              حذف الشجرة نهائياً
            </Button>
            <p className="text-xs text-muted-foreground">
              تحذير: هذا الإجراء لا يمكن التراجع عنه
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};