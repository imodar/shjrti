import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Images,
  RefreshCw,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/family.types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ShareLinkModal } from "./ShareLinkModal";
import { CustomDomainModal } from "./CustomDomainModal";
import TreeDeleteModal from "@/components/TreeDeleteModal";


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
  
  // Female Privacy Settings state
  const [femaleNamePrivacy, setFemaleNamePrivacy] = useState<'full' | 'family_only' | 'hidden'>(
    (familyData?.female_name_privacy as 'full' | 'family_only' | 'hidden') || 'full'
  );
  const [femalePhotoHidden, setFemalePhotoHidden] = useState(familyData?.female_photo_hidden || false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  
  // Share Token state
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  
  const shareableLink = `${window.location.origin}/family-tree-view?family=${familyData?.id}`;
  const publicShareableLink = shareToken 
    ? `${window.location.origin}/share?token=${shareToken}`
    : '';
  
  // Generate share token function
  const generateShareToken = async () => {
    setIsGeneratingToken(true);
    try {
      console.log('[TreeSettings] Generating share token for family:', familyData?.id);
      
      const { data, error } = await supabase.rpc('regenerate_share_token', {
        p_family_id: familyData?.id,
        p_expires_in_hours: 2
      });

      if (error) {
        console.error('[TreeSettings] Error generating token:', error);
        toast({
          title: "خطأ",
          description: "فشل توليد رابط المشاركة",
          variant: "destructive"
        });
        return;
      }

      console.log('[TreeSettings] Token generated:', data);

      if (data && data.length > 0) {
        const newToken = data[0].share_token;
        const expiresAt = data[0].expires_at;
        console.log('[TreeSettings] Setting token:', newToken);
        setShareToken(newToken);
        setTokenExpiresAt(expiresAt);
        toast({
          title: "تم بنجاح",
          description: "تم توليد رابط مشاركة جديد"
        });
      }
    } catch (error) {
      console.error('[TreeSettings] Unexpected error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };
  
  // Check for existing valid token on mount
  useEffect(() => {
    if (familyData?.id) {
      // Check if there's an existing valid token
      if (familyData.share_token && familyData.share_token_expires_at) {
        const expiresAt = new Date(familyData.share_token_expires_at);
        const now = new Date();
        
        // If token hasn't expired, use it
        if (expiresAt > now) {
          console.log('[TreeSettings] Using existing valid token');
          setShareToken(familyData.share_token);
          setTokenExpiresAt(familyData.share_token_expires_at);
          return; // Don't generate a new token
        }
      }
      // If no token or expired, user can manually generate one
      console.log('[TreeSettings] No valid token found, user can generate new one');
    }
  }, [familyData?.id, familyData?.share_token, familyData?.share_token_expires_at]);
  
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
      title: t('tree_settings.toast.public_link_copied'),
      description: t('tree_settings.toast.public_link_copied_desc')
    });
  };

  const handleCopyCustomDomain = () => {
    if (familyData?.custom_domain) {
      navigator.clipboard.writeText(`https://shjrti.com/${familyData.custom_domain}`);
      toast({
        title: t('tree_settings.toast.custom_domain_copied'),
        description: t('tree_settings.toast.custom_domain_copied_desc')
      });
    }
  };
  
  const handleShareTree = () => {
    if (navigator.share) {
      navigator.share({
        title: t('tree_settings.toast.share_title').replace('{name}', familyData?.name || t('tree_settings.unknown')),
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
          title: t('tree_settings.toast.error'),
          description: t('tree_settings.toast.description_save_failed'),
          variant: "destructive"
        });
        return;
      }

      // Update the local family data
      if (familyData) {
        familyData.description = description.trim() || null;
      }
      
      toast({
        title: t('tree_settings.toast.saved'),
        description: t('tree_settings.toast.description_saved')
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating family description:', error);
      toast({
        title: t('tree_settings.toast.error'),
        description: t('tree_settings.toast.description_save_error'),
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
      let passwordToSave = null;
      
      // If setting a password, hash it first using the database function
      if (sharePassword.trim()) {
        const { data: hashedPassword, error: hashError } = await supabase
          .rpc('hash_share_password', { plain_password: sharePassword.trim() });
        
        if (hashError) {
          console.error('Error hashing password:', hashError);
          toast({
            title: t('tree_settings.toast.error'),
            description: t('tree_settings.toast.password_save_failed'),
            variant: "destructive"
          });
          return;
        }
        passwordToSave = hashedPassword;
      }
      
      const { error } = await supabase
        .from('families')
        .update({ 
          share_password: passwordToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyData?.id);

      if (error) {
        console.error('Error updating family password:', error);
        toast({
          title: t('tree_settings.toast.error'),
          description: t('tree_settings.toast.password_save_failed'),
          variant: "destructive"
        });
        return;
      }

      // Update the local family data
      if (familyData) {
        familyData.share_password = passwordToSave;
      }
      
      toast({
        title: t('tree_settings.toast.saved'),
        description: sharePassword.trim() ? t('tree_settings.toast.password_saved') : t('tree_settings.toast.password_removed')
      });
      setIsEditingPassword(false);
    } catch (error) {
      console.error('Error updating family password:', error);
      toast({
        title: t('tree_settings.toast.error'),
        description: t('tree_settings.toast.password_save_error'),
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
        title: t('tree_settings.toast.domain_saved'),
        description: customDomain ? t('tree_settings.toast.domain_set').replace('{domain}', customDomain) : t('tree_settings.toast.domain_removed')
      });
      
      setIsEditingDomain(false);
    } catch (error) {
      console.error('Error saving custom domain:', error);
      toast({
        title: t('tree_settings.toast.domain_save_error'),
        description: t('tree_settings.toast.domain_save_error_desc'),
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
          {t('tree_settings.back_button')}
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-md">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{t('tree_settings.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('tree_settings.family_prefix')} {familyData?.name || t('tree_settings.unknown')}</p>
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
              {t('tree_settings.family_description')}
            </CardTitle>
            <CardDescription>
              {t('tree_settings.family_description_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingDescription ? (
              <div className="space-y-3">
                <ReactQuill
                  value={description}
                  onChange={setDescription}
                  placeholder={t('tree_settings.description_placeholder')}
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
                    {isUpdatingDescription ? t('tree_settings.saving') : t('tree_settings.save')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEditDescription}
                    size="sm"
                  >
                    {t('tree_settings.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div 
                  className="text-sm text-muted-foreground min-h-[60px] p-3 border rounded-lg bg-muted/50"
                  dangerouslySetInnerHTML={{ 
                    __html: description || t('tree_settings.description_placeholder')
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingDescription(true)}
                  size="sm"
                >
                  {description ? t('tree_settings.edit_description') : t('tree_settings.family_description_desc')}
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
              {t('tree_settings.sharing_domain_title')}
            </CardTitle>
            <CardDescription>
              {t('tree_settings.sharing_domain_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 1. الرابط العام للشجرة - متاح دائماً */}
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <Label className="font-semibold text-sm sm:text-base">{t('tree_settings.public_link_title')}</Label>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateShareToken}
                  disabled={isGeneratingToken}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                  {t('tree_settings.generate_new_link')}
                </Button>
              </div>
              {isGeneratingToken ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <Input 
                      readOnly 
                      value={publicShareableLink}
                      className="flex-1 bg-white dark:bg-gray-800 text-xs sm:text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyPublicLink} disabled={!shareToken} className="flex-1 sm:flex-none">
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button size="sm" onClick={() => setIsShareModalOpen(true)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                        {t('tree_settings.share_button')}
                      </Button>
                    </div>
                  </div>
                  {tokenExpiresAt && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>
                        {t('tree_settings.expires_at')} {new Date(tokenExpiresAt).toLocaleString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('tree_settings.public_link_desc')}
                  </p>
                </>
              )}
            </div>

            <Separator />

            {/* 2. الرابط المخصص - Premium Feature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.custom_link_title')}</Label>
              </div>
              
              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasCustomDomainFeature ? (
                // حالة 1: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base">{t('tree_settings.custom_link_title')}</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('tree_settings.custom_link_premium_desc')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0">
                      {t('tree_settings.upgrade_now')}
                    </Button>
                  </div>
                </div>
              ) : !familyData?.custom_domain ? (
                // حالة 2: الميزة متاحة - بدون رابط مخصص
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">{t('tree_settings.custom_link_title')}</span>
                    <Badge variant="outline" className="text-xs">{t('tree_settings.available_badge')}</Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDomainModalOpen(true)}
                    className="w-full"
                  >
                    <Globe className="h-4 w-4 ml-2" />
                    {t('tree_settings.add_custom_link')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('tree_settings.custom_link_example')}
                  </p>
                </div>
              ) : (
                // حالة 3: الميزة متاحة - مع رابط مخصص موجود
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">{t('tree_settings.custom_link_title')}</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex flex-col gap-2 mb-2">
                    <Input 
                      readOnly 
                      value={`https://shjrti.com/${familyData.custom_domain}`}
                      className="w-full bg-white dark:bg-gray-800 font-mono text-xs sm:text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyCustomDomain} className="flex-1 sm:flex-none text-xs sm:text-sm">
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        {t('tree_settings.copy_button')}
                      </Button>
                      <Button variant="default" size="sm" onClick={() => setIsShareModalOpen(true)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                        <Share2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        {t('tree_settings.share_button')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsDomainModalOpen(true)}
                        className="flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        {t('tree_settings.edit_button')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 3. مشاركة ألبوم صور العائلة */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.gallery_sharing_title')}</Label>
              </div>
              
              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasImageUploadFeature ? (
                // حالة: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Images className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base">{t('tree_settings.gallery_sharing_premium')}</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('tree_settings.gallery_sharing_premium_desc')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0">
                      {t('tree_settings.upgrade_now')}
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
                      <p className="font-semibold text-sm">{t('tree_settings.allow_visitors_view_album')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('tree_settings.gallery_sharing_desc')}
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
                          title: checked ? t('tree_settings.gallery_sharing_enabled') : t('tree_settings.gallery_sharing_disabled'),
                          description: checked 
                            ? t('tree_settings.gallery_now_available')
                            : t('tree_settings.gallery_no_longer_available')
                        });
                      } catch (error) {
                        console.error('Error updating gallery sharing:', error);
                        toast({
                          title: t('common.error'),
                          description: t('tree_settings.gallery_update_error'),
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
                  {shareGallery ? t('tree_settings.gallery_enabled_badge') : t('tree_settings.gallery_disabled_badge')}
                </Badge>
                
                {shareGallery && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>{t('tree_settings.gallery_warning_title')}</strong> {t('tree_settings.gallery_warning_desc')}
                      </p>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>

            <Separator />

            {/* 4. إعدادات خصوصية الإناث */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.female_privacy_title', 'خصوصية الإناث')}</Label>
              </div>
              
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                  {t('tree_settings.female_privacy_notice', 'هذه الإعدادات تؤثر على الزوار فقط. أنت كمالك الشجرة ستتمكن دائماً من رؤية جميع البيانات.')}
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                {/* Name Privacy Setting */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('tree_settings.female_name_display', 'عرض أسماء الإناث')}
                  </Label>
                  <Select
                    value={femaleNamePrivacy}
                    onValueChange={async (value: 'full' | 'family_only' | 'hidden') => {
                      setIsUpdatingPrivacy(true);
                      try {
                        const { error } = await supabase
                          .from('families')
                          .update({ 
                            female_name_privacy: value,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', familyData?.id);

                        if (error) throw error;

                        setFemaleNamePrivacy(value);
                        if (familyData) {
                          (familyData as any).female_name_privacy = value;
                        }

                        toast({
                          title: t('tree_settings.toast.saved', 'تم الحفظ'),
                          description: t('tree_settings.female_privacy_updated', 'تم تحديث إعدادات الخصوصية')
                        });
                      } catch (error) {
                        console.error('Error updating female name privacy:', error);
                        toast({
                          title: t('common.error', 'خطأ'),
                          description: t('tree_settings.privacy_update_error', 'فشل تحديث إعدادات الخصوصية'),
                          variant: "destructive"
                        });
                      } finally {
                        setIsUpdatingPrivacy(false);
                      }
                    }}
                    disabled={isUpdatingPrivacy}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-green-600" />
                          <span>{t('tree_settings.name_full', 'الاسم الكامل')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="family_only">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <span>{t('tree_settings.name_family_only', 'إخفاء الاسم الأول (إظهار النسب فقط)')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hidden">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-red-600" />
                          <span>{t('tree_settings.name_hidden', 'إخفاء الاسم بالكامل')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {femaleNamePrivacy === 'full' && t('tree_settings.name_full_desc', 'سيتم عرض الاسم الكامل للإناث (مثل: فاطمة محمد الشيخ سعيد)')}
                    {femaleNamePrivacy === 'family_only' && t('tree_settings.name_family_only_desc', 'سيتم إخفاء الاسم الأول وعرض النسب فقط (مثل: 🔒 ابنة محمد الشيخ سعيد)')}
                    {femaleNamePrivacy === 'hidden' && t('tree_settings.name_hidden_desc', 'سيتم إخفاء الاسم بالكامل (مثل: 🔒)')}
                  </p>
                </div>

                {/* Photo Privacy Setting */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      {t('tree_settings.female_photo_hidden', 'إخفاء صور الإناث')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('tree_settings.female_photo_hidden_desc', 'إخفاء صور الإناث في الروابط العامة')}
                    </p>
                  </div>
                  <Switch
                    checked={femalePhotoHidden}
                    onCheckedChange={async (checked) => {
                      setIsUpdatingPrivacy(true);
                      try {
                        const { error } = await supabase
                          .from('families')
                          .update({ 
                            female_photo_hidden: checked,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', familyData?.id);

                        if (error) throw error;

                        setFemalePhotoHidden(checked);
                        if (familyData) {
                          (familyData as any).female_photo_hidden = checked;
                        }

                        toast({
                          title: t('tree_settings.toast.saved', 'تم الحفظ'),
                          description: checked 
                            ? t('tree_settings.photo_now_hidden', 'سيتم إخفاء صور الإناث في الروابط العامة')
                            : t('tree_settings.photo_now_visible', 'سيتم عرض صور الإناث في الروابط العامة')
                        });
                      } catch (error) {
                        console.error('Error updating female photo privacy:', error);
                        toast({
                          title: t('common.error', 'خطأ'),
                          description: t('tree_settings.privacy_update_error', 'فشل تحديث إعدادات الخصوصية'),
                          variant: "destructive"
                        });
                      } finally {
                        setIsUpdatingPrivacy(false);
                      }
                    }}
                    disabled={isUpdatingPrivacy}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 5. حماية بكلمة المرور */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <Label className="text-base font-semibold">{t('tree_settings.password_protection_title')}</Label>
              </div>

              {checkingFeature ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : !hasCustomDomainFeature ? (
                // حالة: الميزة غير متاحة (باقة مجانية)
                <div 
                  className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base">{t('tree_settings.password_protection_title')}</span>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                            👑 Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('tree_settings.password_protection_premium_desc')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0">
                      {t('tree_settings.upgrade_now')}
                    </Button>
                  </div>
                </div>
              ) : isEditingPassword ? (
                <div className="space-y-3">
                  <Input
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder={t('tree_settings.password_placeholder')}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSavePassword}
                      disabled={isUpdatingPassword}
                      size="sm"
                    >
                      {isUpdatingPassword ? t('tree_settings.saving') : t('tree_settings.save')}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEditPassword}
                      size="sm"
                    >
                      {t('tree_settings.cancel')}
                    </Button>
                  </div>
                </div>
              ) : !sharePassword ? (
                // حالة: بدون كلمة مرور - تحذير أمني
                <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-dashed border-amber-300 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => setIsEditingPassword(true)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-sm sm:text-base">{t('tree_settings.password_protection_title')}</span>
                          <Badge className="bg-red-500 text-white text-xs">
                            {t('tree_settings.password_unprotected_badge')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('tree_settings.password_add_desc')}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0">
                      {t('tree_settings.add_password')}
                    </Button>
                  </div>
                </div>
              ) : (
                // حالة: مع كلمة مرور - محمية
                <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base">{t('tree_settings.password_protection_title')}</span>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    </div>
                    <Badge className="bg-green-600 text-white text-xs w-fit">{t('tree_settings.password_protected_badge')}</Badge>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-3">
                    {t('tree_settings.password_protected_desc')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingPassword(true)}
                      className="text-xs sm:text-sm"
                    >
                      {t('tree_settings.change_password')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeletePassword}
                      disabled={isUpdatingPassword}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      {isUpdatingPassword ? t('tree_settings.removing_protection') : t('tree_settings.remove_protection')}
                    </Button>
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
              {t('tree_settings.upgrade_required')}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {t('tree_settings.upgrade_modal_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                {t('tree_settings.upgrade_features_title')}
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('tree_settings.upgrade_feature_domain')}</li>
                <li>• {t('tree_settings.upgrade_feature_sharing')}</li>
                <li>• {t('tree_settings.upgrade_feature_support')}</li>
                <li>• {t('tree_settings.upgrade_feature_storage')}</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              {t('tree_settings.cancel')}
            </Button>
            <Button onClick={() => {
            setShowUpgradeModal(false);
            navigate('/plan-selection');
          }} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              {t('tree_settings.upgrade_now')}
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