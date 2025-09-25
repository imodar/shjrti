import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Family } from "../../types/family.types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShareLinkModal } from "./ShareLinkModal";
import { CustomDomainModal } from "./CustomDomainModal";

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
  const [checkingFeature, setCheckingFeature] = useState(true);
  
  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Custom Domain Modal state
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  
  const shareableLink = `${window.location.origin}/family-tree-view?family=${familyData?.id}`;
  const publicShareableLink = `${window.location.origin}/tree?familyId=${familyData?.id}`;
  
  // Check if user's package has custom domains enabled
  useEffect(() => {
    const checkCustomDomainFeature = async () => {
      setCheckingFeature(true);
      try {
        const { data: userSub, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            packages(
              custom_domains_enabled,
              name
            )
          `)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active')
          .single();
          
        if (userSub && userSub.packages && !subError) {
          setHasCustomDomainFeature(userSub.packages.custom_domains_enabled);
        } else {
          setHasCustomDomainFeature(false);
        }
      } catch (error) {
        console.error('Error checking custom domain feature:', error);
        setHasCustomDomainFeature(false);
      } finally {
        setCheckingFeature(false);
      }
    };

    checkCustomDomainFeature();
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
            {/* Custom Domain Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.custom_domain', 'النطاق المخصص')}</Label>
              </div>
              
              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasCustomDomainFeature ? (
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {t('tree_settings.custom_domain_not_available', 'ميزة النطاق المخصص غير متاحة')}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t('tree_settings.custom_domain_upgrade_message', 'قم بترقية باقتك للحصول على إمكانية استخدام نطاق مخصص لشجرة عائلتك')}
                    </p>
                  </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="example.com"
                      disabled={!isEditingDomain || isLoadingDomain}
                      readOnly
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDomainModalOpen(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {customDomain ? "تعديل" : "إضافة"}
                    </Button>
                  </div>
                  
                  {domainValidationError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {domainValidationError}
                    </div>
                  )}
                  
                  {isValidatingDomain && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      جاري التحقق من النطاق...
                    </div>
                  )}
                  
                  {familyData?.custom_domain && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            الرابط المخصص نشط: https://shjrti.com/{familyData.custom_domain}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(`https://shjrti.com/${familyData.custom_domain}`);
                              toast({
                                title: "تم نسخ الرابط",
                                description: "تم نسخ رابط النطاق المخصص بنجاح",
                              });
                            }}
                            className="flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <Copy className="h-3 w-3" />
                            نسخ
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <Share2 className="h-3 w-3" />
                            مشاركة
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Public Link Sharing Section */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Link2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          الرابط العام: {window.location.origin}/tree/{familyData.id}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCopyPublicLink}
                          className="flex items-center gap-1 text-xs px-2 py-1"
                        >
                          <Copy className="h-3 w-3" />
                          نسخ
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsShareModalOpen(true)}
                          className="flex items-center gap-1 text-xs px-2 py-1"
                        >
                          <Share2 className="h-3 w-3" />
                          مشاركة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Sharing Links Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.sharing_links', 'روابط المشاركة')}</Label>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">رابط العرض العام</p>
                      <p className="text-xs text-muted-foreground">يمكن لأي شخص الوصول إليه</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyPublicLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Password Protection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.password_protection', 'حماية بكلمة مرور')}</Label>
              </div>
              
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingPassword(true)}
                      size="sm"
                    >
                      {sharePassword ? "تغيير كلمة المرور" : "إضافة كلمة مرور"}
                    </Button>
                    {sharePassword && (
                      <Button 
                        variant="destructive" 
                        onClick={handleDeletePassword}
                        disabled={isUpdatingPassword}
                        size="sm"
                      >
                        {isUpdatingPassword ? "جاري الحذف..." : "حذف كلمة المرور"}
                      </Button>
                    )}
                  </div>
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
      
      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyName={familyData?.name || 'غير محدد'}
        shareLink={publicShareableLink}
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
      
      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyName={familyData?.name || 'غير محدد'}
        shareLink={publicShareableLink}
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
    </div>
  );
};