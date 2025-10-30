import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ReactQuill from 'react-quill';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight,
  Settings, 
  Share2, 
  Link2, 
  Eye, 
  Copy, 
  Download, 
  Lock, 
  Users, 
  Trash2,
  FileText,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Pencil,
  Images
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Family } from "../../types/family.types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ShareLinkModal } from "./ShareLinkModal";
import { CustomDomainModal } from "./CustomDomainModal";
import TreeDeleteModal from "@/components/TreeDeleteModal";
import { SuggestedEditsPanel } from "./SuggestedEditsPanel";

interface TreeSettingsViewProps {
  familyData: Family;
  onBack: () => void;
}

export const TreeSettingsView: React.FC<TreeSettingsViewProps> = ({ 
  familyData, 
  onBack 
}) => {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(familyData?.description || '');
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [sharePassword, setSharePassword] = useState(familyData?.share_password || '');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Custom Domain state
  const [customDomain, setCustomDomain] = useState(familyData?.custom_domain || "");
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const [isValidatingDomain, setIsValidatingDomain] = useState(false);
  const [domainValidationError, setDomainValidationError] = useState("");
  const [hasCustomDomainFeature, setHasCustomDomainFeature] = useState(false);
  const [hasImageUploadFeature, setHasImageUploadFeature] = useState(false);
  const [checkingFeature, setCheckingFeature] = useState(true);
  
  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Custom Domain Modal state
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  
  // Upgrade Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Share Gallery state
  const [shareGallery, setShareGallery] = useState(familyData?.share_gallery || false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);
  
  const shareableLink = `${window.location.origin}/family-tree-view?family=${familyData?.id}`;
  const publicShareableLink = `${window.location.origin}/tree?familyId=${familyData?.id}`;
  
  // Check if user's package has custom domains and image upload enabled
  useEffect(() => {
    const checkPackageFeatures = async () => {
      setCheckingFeature(true);
      try {
        const { data: userSub, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages(
              custom_domains_enabled,
              image_upload_enabled,
              name
            )
          `)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active')
          .single();
          
        if (userSub && userSub.packages && !subError) {
          setHasCustomDomainFeature(userSub.packages.custom_domains_enabled);
          setHasImageUploadFeature(userSub.packages.image_upload_enabled);
        } else {
          setHasCustomDomainFeature(false);
          setHasImageUploadFeature(false);
        }
      } catch (error) {
        console.error('Error checking package features:', error);
        setHasCustomDomainFeature(false);
        setHasImageUploadFeature(false);
      } finally {
        setCheckingFeature(false);
      }
    };

    checkPackageFeatures();
  }, []);
  
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

  const handleCopyCustomDomain = () => {
    if (familyData?.custom_domain) {
      navigator.clipboard.writeText(`https://shjrti.com/${familyData.custom_domain}`);
      toast({
        title: "تم نسخ الرابط المخصص",
        description: "تم نسخ رابط النطاق المخصص بنجاح"
      });
    }
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

  const handleDeletePassword = async () => {
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ 
          share_password: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyData?.id);

      if (error) {
        console.error('Error deleting family password:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف كلمة مرور المشاركة",
          variant: "destructive"
        });
        return;
      }

      // Update the local family data
      if (familyData) {
        familyData.share_password = null;
      }
      
      setSharePassword('');
      toast({
        title: "تم الحذف",
        description: "تم حذف كلمة مرور المشاركة بنجاح"
      });
    } catch (error) {
      console.error('Error deleting family password:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Domain validation
  const validateDomain = async (domain: string) => {
    if (!domain) return true;
    
    setIsValidatingDomain(true);
    setDomainValidationError("");
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setDomainValidationError("تنسيق النطاق غير صحيح");
      setIsValidatingDomain(false);
      return false;
    }
    
    try {
      const { data: existingDomain } = await supabase
        .from('families')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', familyData.id)
        .single();
        
      if (existingDomain) {
        setDomainValidationError("هذا النطاق مستخدم بالفعل");
        setIsValidatingDomain(false);
        return false;
      }
    } catch (error) {
      // If no existing domain found, that's good
    }
    
    setIsValidatingDomain(false);
    return true;
  };

  const handleSaveCustomDomain = async () => {
    if (!(await validateDomain(customDomain))) return;
    
    setIsLoadingDomain(true);
    try {
      const { error } = await supabase
        .from('families')
        .update({ custom_domain: customDomain || null })
        .eq('id', familyData.id);
        
      if (error) throw error;
      
      toast({
        title: "تم حفظ النطاق المخصص",
        description: customDomain ? `تم تعيين النطاق: ${customDomain}` : "تم إزالة النطاق المخصص"
      });
      
      setIsEditingDomain(false);
    } catch (error) {
      console.error('Error saving custom domain:', error);
      toast({
        title: "خطأ في حفظ النطاق",
        description: "حدث خطأ أثناء حفظ النطاق المخصص",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDomain(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="flex items-center gap-2 text-primary hover:text-primary/80 hover:bg-primary/10 border border-primary/20"
        >
          <ArrowRight className="h-4 w-4" />
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
                <ReactQuill
                  value={description}
                  onChange={setDescription}
                  placeholder="أدخل وصف العائلة..."
                  style={{ height: '120px', marginBottom: '50px' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  formats={[
                    'header', 'bold', 'italic', 'underline',
                    'color', 'background', 'list', 'bullet', 'link'
                  ]}
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
                <div 
                  className="text-sm text-muted-foreground min-h-[60px] p-3 border rounded-lg bg-muted/50"
                  dangerouslySetInnerHTML={{ 
                    __html: description || "لم يتم إضافة وصف بعد..." 
                  }}
                />
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

        {/* Sharing & Domain Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              إعدادات المشاركة والنطاق
            </CardTitle>
            <CardDescription>
              تحكم في كيفية مشاركة شجرة العائلة ونطاقها المخصص
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 1. الرابط العام للشجرة - متاح دائماً */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="h-5 w-5 text-blue-600" />
                <Label className="font-semibold">الرابط العام للشجرة</Label>
              </div>
              <div className="flex gap-2 mb-2">
                <Input 
                  readOnly 
                  value={publicShareableLink}
                  className="flex-1 bg-white dark:bg-gray-800 text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleCopyPublicLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setIsShareModalOpen(true)}>
                  <Share2 className="h-4 w-4 ml-2" />
                  مشاركة
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                يمكن لأي شخص عرض الشجرة باستخدام هذا الرابط
              </p>
            </div>

            <Separator />

            {/* 2. الرابط المخصص - Premium Feature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <Label className="text-base font-semibold">الرابط المخصص</Label>
              </div>
              
              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasCustomDomainFeature ? (
                // حالة 1: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">الرابط المخصص</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          احصل على رابط مخصص سهل التذكر لشجرتك
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      ترقية الآن
                    </Button>
                  </div>
                </div>
              ) : !familyData?.custom_domain ? (
                // حالة 2: الميزة متاحة - بدون رابط مخصص
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">الرابط المخصص</span>
                    <Badge variant="outline" className="text-xs">متاح</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDomainModalOpen(true)}
                    className="w-full"
                  >
                    <Globe className="h-4 w-4 ml-2" />
                    إضافة رابط مخصص لشجرتك
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    اختر رابطاً سهلاً مثل: https://shjrti.com/my-family
                  </p>
                </div>
              ) : (
                // حالة 3: الميزة متاحة - مع رابط مخصص موجود
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">الرابط المخصص</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      readOnly 
                      value={`https://shjrti.com/${familyData.custom_domain}`}
                      className="flex-1 bg-white dark:bg-gray-800 font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyCustomDomain}>
                      <Copy className="h-4 w-4 ml-1" />
                      نسخ
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setIsShareModalOpen(true)}>
                      <Share2 className="h-4 w-4 ml-1" />
                      مشاركة
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsDomainModalOpen(true)}
                    >
                      <Pencil className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 3. مشاركة ألبوم صور العائلة */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                <Label className="text-base font-semibold">مشاركة ألبوم صور العائلة</Label>
              </div>
              
              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasImageUploadFeature ? (
                // حالة: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Images className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">مشاركة ألبوم الصور</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          اسمح للزوار بمشاهدة ألبوم صور العائلة
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      ترقية الآن
                    </Button>
                  </div>
                </div>
              ) : (
                // حالة: الميزة متاحة
                <div className={`p-4 rounded-lg border ${shareGallery ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Images className={`h-5 w-5 ${shareGallery ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-semibold text-sm">السماح للزوار بمشاهدة ألبوم الصور</p>
                      <p className="text-xs text-muted-foreground">
                        عند التفعيل، سيتمكن زوار الشجرة من رؤية جميع صور الألبوم
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={shareGallery}
                    onCheckedChange={async (checked) => {
                      setIsUpdatingGallery(true);
                      try {
                        const { error } = await supabase
                          .from('families')
                          .update({ 
                            share_gallery: checked,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', familyData?.id);

                        if (error) throw error;

                        setShareGallery(checked);
                        if (familyData) {
                          familyData.share_gallery = checked;
                        }

                        toast({
                          title: checked ? "تم تفعيل المشاركة" : "تم إلغاء المشاركة",
                          description: checked 
                            ? "أصبح ألبوم الصور متاحاً للزوار" 
                            : "لم يعد ألبوم الصور متاحاً للزوار"
                        });
                      } catch (error) {
                        console.error('Error updating gallery sharing:', error);
                        toast({
                          title: "خطأ",
                          description: "حدث خطأ أثناء تحديث إعدادات المشاركة",
                          variant: "destructive"
                        });
                      } finally {
                        setIsUpdatingGallery(false);
                      }
                    }}
                    disabled={isUpdatingGallery}
                  />
                </div>
                
                <Badge className={shareGallery ? "bg-green-600 text-white" : "bg-gray-400 text-white"}>
                  {shareGallery ? "مفعل" : "معطل"}
                </Badge>
                
                {shareGallery && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>تنبيه:</strong> جميع صور ألبوم العائلة ستكون مرئية لأي شخص يزور الشجرة. 
                        تأكد من أن الصور مناسبة للمشاركة العامة.
                      </p>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>

            <Separator />

            {/* 4. حماية بكلمة المرور */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <Label className="text-base font-semibold">حماية بكلمة المرور</Label>
              </div>

              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasCustomDomainFeature ? (
                // حالة: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">حماية بكلمة مرور</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          احمِ شجرتك بكلمة مرور لمنع الوصول غير المصرح
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      ترقية الآن
                    </Button>
                  </div>
                </div>
              ) : isEditingPassword ? (
                <div className="space-y-3">
                  <Input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="أدخل كلمة مرور قوية..."
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
              ) : !sharePassword ? (
                // حالة: بدون كلمة مرور - تحذير أمني
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setIsEditingPassword(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">حماية بكلمة مرور</span>
                          <Badge className="bg-red-500 text-white text-xs">
                            🔓 غير محمية
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          أضف كلمة مرور لحماية شجرتك من الوصول غير المصرح
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      إضافة كلمة مرور
                    </Button>
                  </div>
                </div>
              ) : (
                // حالة: مع كلمة مرور - محمية
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">حماية بكلمة المرور</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <Badge className="bg-green-600 text-white">🔒 محمية</Badge>
                  </div>
                  
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    شجرتك محمية بكلمة مرور. فقط من يملك كلمة المرور يمكنه الوصول.
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingPassword(true)}
                    >
                      تغيير كلمة المرور
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeletePassword}
                      disabled={isUpdatingPassword}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      {isUpdatingPassword ? "جاري الإزالة..." : "إزالة الحماية"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Suggested Edits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اقتراحات التعديل
            </CardTitle>
            <CardDescription>
              مراجعة اقتراحات التعديل من زوار الشجرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuggestedEditsPanel familyId={familyData?.id || ''} />
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
            </div>

            <Separator />

            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full justify-start text-xs"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-3 w-3 ml-2" />
              حذف الشجرة نهائياً
            </Button>
            <p className="text-xs text-muted-foreground">
              تحذير: هذا الإجراء لا يمكن التراجع عنه
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyName={familyData?.name || 'غير محدد'}
        shareLink={familyData?.custom_domain 
          ? `https://shjrti.com/${familyData.custom_domain}`
          : publicShareableLink
        }
        familyId={familyData?.id || ''}
        hasCustomDomain={hasCustomDomainFeature && !!familyData?.custom_domain}
      />
      
      {/* Custom Domain Modal */}
      <CustomDomainModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        familyId={familyData?.id || ''}
        currentDomain={familyData?.custom_domain || undefined}
        onDomainUpdated={(newDomain) => {
          if (familyData) {
            familyData.custom_domain = newDomain;
            setCustomDomain(newDomain || '');
          }
        }}
      />
      
      {/* Upgrade Package Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold">
              ترقية الباقة مطلوبة
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              للوصول إلى ميزة النطاق المخصص وميزات أخرى متطورة، تحتاج إلى ترقية باقتك الحالية.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                المميزات المتاحة بعد الترقية:
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• نطاق مخصص لشجرة العائلة</li>
                <li>• ميزات متقدمة للمشاركة</li>
                <li>• دعم أولوية</li>
                <li>• مساحة تخزين إضافية</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              إلغاء
            </Button>
            <Button onClick={() => {
            setShowUpgradeModal(false);
            navigate('/plan-selection');
          }} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              ترقية الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Tree Delete Modal */}
      <TreeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        treeId={familyData?.id || ''}
        treeName={familyData?.name || ''}
        onSuccess={(treeId) => {
          // Navigate back to dashboard after successful deletion
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
};