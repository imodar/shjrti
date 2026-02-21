import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { familiesApi, subscriptionsApi, familyInvitationsApi } from '@/lib/api';
import type { Collaborator, Invitation } from '@/lib/api/endpoints/familyInvitations';
import { Family } from '@/lib/api/types';
import TreeDeleteModal from '@/components/TreeDeleteModal';
import { ShareLinkModal } from '@/pages/FamilyBuilderNew/components/TreeSettings/ShareLinkModal';
import { CustomDomainModal } from '@/pages/FamilyBuilderNew/components/TreeSettings/CustomDomainModal';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CollaboratorsTab from './CollaboratorsTab';

interface StitchSettingsViewProps {
  familyId: string;
  familyData: Family | null;
  onFamilyUpdated?: () => void;
  isOwner?: boolean;
}

export const StitchSettingsView: React.FC<StitchSettingsViewProps> = ({
  familyId,
  familyData,
  onFamilyUpdated,
  isOwner = true,
}) => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const { subscription } = useSubscription();
  const { toast } = useToast();

  // State
  const [description, setDescription] = useState(familyData?.description || '');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);

  const [femaleNamePrivacy, setFemaleNamePrivacy] = useState<string>(
    familyData?.female_name_privacy || 'full'
  );
  const [femalePhotoHidden, setFemalePhotoHidden] = useState(familyData?.female_photo_hidden || false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Feature flags
  const [hasCustomDomainFeature, setHasCustomDomainFeature] = useState(false);
  const [hasImageUploadFeature, setHasImageUploadFeature] = useState(false);
  const [checkingFeatures, setCheckingFeatures] = useState(true);

  // Share token
  const [shareToken, setShareToken] = useState<string | null>(familyData?.share_token || null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(familyData?.share_token_expires_at || null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  // Password protection
  const [sharePassword, setSharePassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const hasExistingPassword = !!familyData?.share_password;

  // Gallery sharing
  const [shareGallery, setShareGallery] = useState(familyData?.share_gallery || false);
  const [isUpdatingGallery, setIsUpdatingGallery] = useState(false);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const shareableLink = `${window.location.origin}/family-tree-view?family=${familyId}`;
  const publicShareableLink = shareToken
    ? `${window.location.origin}/share?token=${shareToken}`
    : '';

  // Sync familyData props to local state when data loads
  useEffect(() => {
    if (familyData) {
      setDescription(familyData.description || '');
      setFemaleNamePrivacy(familyData.female_name_privacy || 'full');
      setFemalePhotoHidden(familyData.female_photo_hidden || false);
      setShareToken(familyData.share_token || null);
      setTokenExpiresAt(familyData.share_token_expires_at || null);
      setShareGallery(familyData.share_gallery || false);
    }
  }, [familyData]);

  // Check package features via REST API
  useEffect(() => {
    const checkFeatures = async () => {
      setCheckingFeatures(true);
      try {
        const sub = await subscriptionsApi.get();
        const pkg = sub?.packages;
        if (pkg) {
          setHasCustomDomainFeature(!!pkg.custom_domains_enabled);
          setHasImageUploadFeature(!!pkg.image_upload_enabled);
        }
      } catch (e) {
        console.error('Error checking features:', e);
      } finally {
        setCheckingFeatures(false);
      }
    };
    checkFeatures();
  }, []);

  // Check existing token
  useEffect(() => {
    if (familyData?.share_token && familyData?.share_token_expires_at) {
      const expires = new Date(familyData.share_token_expires_at);
      if (expires > new Date()) {
        setShareToken(familyData.share_token);
        setTokenExpiresAt(familyData.share_token_expires_at);
      }
    }
  }, [familyData?.share_token, familyData?.share_token_expires_at]);

  // Generate share token via REST API
  const generateShareToken = async () => {
    setIsGeneratingToken(true);
    try {
      const result = await familiesApi.regenerateShareToken(familyId, 2);
      if (result?.share_token) {
        setShareToken(result.share_token);
        setTokenExpiresAt(result.expires_at);
        toast({ title: t('tree_settings.toast.saved', 'تم بنجاح'), description: t('tree_settings.toast.public_link_copied_desc', 'تم توليد رابط مشاركة جديد') });
      }
    } catch (e) {
      console.error('Error generating token:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.toast.error', 'حدث خطأ'), variant: 'destructive' });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Save description via REST API
  const handleSaveDescription = async () => {
    setIsUpdatingDescription(true);
    try {
      await familiesApi.update(familyId, { description: description.trim() || undefined });
      toast({ title: t('tree_settings.toast.saved', 'تم الحفظ'), description: t('tree_settings.toast.description_saved', 'تم حفظ الوصف بنجاح') });
      setIsEditingDescription(false);
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error saving description:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.toast.description_save_failed', 'فشل حفظ الوصف'), variant: 'destructive' });
    } finally {
      setIsUpdatingDescription(false);
    }
  };

  // Update female name privacy via REST API
  const handleFemaleNamePrivacyChange = async (value: string) => {
    setIsUpdatingPrivacy(true);
    try {
      await familiesApi.update(familyId, { female_name_privacy: value });
      setFemaleNamePrivacy(value);
      toast({ title: t('tree_settings.toast.saved', 'تم الحفظ'), description: t('tree_settings.female_privacy_updated', 'تم تحديث إعدادات الخصوصية') });
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error updating privacy:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.privacy_update_error', 'فشل تحديث الخصوصية'), variant: 'destructive' });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  // Update female photo hidden via REST API
  const handleFemalePhotoToggle = async () => {
    const newValue = !femalePhotoHidden;
    setIsUpdatingPrivacy(true);
    try {
      await familiesApi.update(familyId, { female_photo_hidden: newValue });
      setFemalePhotoHidden(newValue);
      toast({
        title: t('tree_settings.toast.saved', 'تم الحفظ'),
        description: newValue
          ? t('tree_settings.photo_now_hidden', 'سيتم إخفاء صور الإناث')
          : t('tree_settings.photo_now_visible', 'سيتم عرض صور الإناث'),
      });
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error updating photo privacy:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.privacy_update_error', 'فشل تحديث الخصوصية'), variant: 'destructive' });
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: t('tree_settings.toast.public_link_copied', 'تم نسخ الرابط'), description: t('tree_settings.toast.public_link_copied_desc', 'تم نسخ الرابط إلى الحافظة') });
  };

  const handleDeleteSuccess = (treeId: string) => {
    navigate('/stitch-dashboard');
  };

  // Password protection handlers
  const handleSavePassword = async () => {
    if (!sharePassword.trim()) return;
    setIsUpdatingPassword(true);
    try {
      // API edge function handles hashing server-side
      await familiesApi.update(familyId, { share_password: sharePassword.trim() });
      toast({ title: t('tree_settings.toast.saved', 'تم الحفظ'), description: t('tree_settings.toast.password_saved', 'تم حفظ كلمة المرور بنجاح') });
      setIsEditingPassword(false);
      setSharePassword('');
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error saving password:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.toast.password_save_failed', 'فشل حفظ كلمة المرور'), variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeletePassword = async () => {
    setIsUpdatingPassword(true);
    try {
      await familiesApi.update(familyId, { share_password: null });
      toast({ title: t('tree_settings.toast.saved', 'تم الحفظ'), description: t('tree_settings.toast.password_removed', 'تم إزالة كلمة المرور') });
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error removing password:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.toast.error', 'حدث خطأ'), variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Gallery sharing handler
  const handleGalleryToggle = async (checked: boolean) => {
    setIsUpdatingGallery(true);
    try {
      await familiesApi.update(familyId, { share_gallery: checked });
      setShareGallery(checked);
      toast({
        title: checked ? t('tree_settings.gallery_sharing_enabled', 'تم تفعيل معرض الصور') : t('tree_settings.gallery_sharing_disabled', 'تم إيقاف معرض الصور'),
        description: checked
          ? t('tree_settings.gallery_now_available', 'يمكن للزوار الآن مشاهدة ألبوم الصور')
          : t('tree_settings.gallery_no_longer_available', 'لن يتمكن الزوار من مشاهدة ألبوم الصور'),
      });
      onFamilyUpdated?.();
    } catch (e) {
      console.error('Error updating gallery sharing:', e);
      toast({ title: t('common.error', 'خطأ'), description: t('tree_settings.gallery_update_error', 'فشل تحديث إعدادات المعرض'), variant: 'destructive' });
    } finally {
      setIsUpdatingGallery(false);
    }
  };

  // Privacy option labels
  const privacyOptions = [
    { value: 'full', label: t('tree_settings.name_full', 'الاسم الكامل'), locked: false, example: 'سارة الأمير' },
    { value: 'family_only', label: t('tree_settings.name_first_hidden', 'إخفاء الاسم الأول (إظهار النسب فقط)'), locked: true, example: '███ الأمير' },
    { value: 'hidden', label: t('tree_settings.name_hidden_full', 'إخفاء الاسم بالكامل'), locked: true, example: '███ ████' },
  ];

  const currentPrivacyLabel = privacyOptions.find(o => o.value === femaleNamePrivacy)?.label || '';

  const getPreviewText = () => {
    if (femaleNamePrivacy === 'full') return t('settings.preview_full', 'سيظهر للزوار "فاطمة محمد"');
    if (femaleNamePrivacy === 'family_only') return t('settings.preview_family_only', 'سيظهر للزوار "فاطمة"');
    return t('settings.preview_hidden', 'سيظهر للزوار "أنثى"');
  };

  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'admins' | 'advanced'>('general');

  const settingsTabs = [
    { id: 'general' as const, label: t('settings.tab_general', 'اعدادات عامة'), icon: 'tune' },
    { id: 'admins' as const, label: t('settings.tab_admins', 'المشرفون والصلاحيات'), icon: 'admin_panel_settings' },
    { id: 'advanced' as const, label: t('settings.tab_advanced', 'اعدادات متقدمة'), icon: 'settings' },
  ];

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Settings Tabs */}
        <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeSettingsTab === tab.id
                  ? 'bg-background text-primary shadow-md shadow-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: General Settings */}
        {activeSettingsTab === 'general' && (
          <>
            {/* Family Description */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t('tree_settings.family_description', 'وصف العائلة')}</h3>
                  <p className="text-sm text-muted-foreground">{t('tree_settings.family_description_desc', 'أضف وصفاً مختصراً عن تاريخ عائلتك')}</p>
                </div>
              </div>

              <div className="bg-muted rounded-xl p-6 border border-border mb-6">
                {isEditingDescription ? (
                  <ReactQuill
                    value={description}
                    onChange={(value) => setDescription(value)}
                    placeholder={t('tree_settings.description_placeholder', 'اكتب وصفاً عن عائلتك...')}
                    theme="snow"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'align': [] }],
                        ['clean']
                      ]
                    }}
                  />
                ) : (
                  <p
                    className="text-muted-foreground leading-relaxed text-sm text-start"
                    dir="rtl"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(description || t('tree_settings.description_placeholder', 'لم يتم إضافة وصف بعد...'))
                    }}
                  />
                )}
              </div>

              {isEditingDescription ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveDescription}
                    disabled={isUpdatingDescription}
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUpdatingDescription ? t('tree_settings.saving', 'جاري الحفظ...') : t('tree_settings.save', 'حفظ')}
                  </button>
                  <button
                    onClick={() => { setDescription(familyData?.description || ''); setIsEditingDescription(false); }}
                    className="px-5 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {t('tree_settings.cancel', 'إلغاء')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="px-5 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  {t('tree_settings.edit_description', 'تعديل الوصف')}
                </button>
              )}
            </div>

            {/* Tree Accessibility */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">visibility</span>
                <h3 className="font-bold text-lg text-foreground">{t('tree_settings.sharing_domain_title', 'إمكانية الوصول للشجرة')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-8">{t('tree_settings.sharing_domain_desc', 'إدارة كيفية عرض ومشاركة بيانات شجرة عائلتك')}</p>

              <div className="space-y-4">
                {/* Public Tree Link */}
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">link</span>
                      <span className="font-bold text-foreground text-sm">{t('tree_settings.public_link_title', 'رابط الشجرة العام')}</span>
                      {shareToken && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                    </div>
                    <button
                      onClick={generateShareToken}
                      disabled={isGeneratingToken}
                      className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg shadow-sm border border-border hover:bg-muted transition-colors"
                    >
                      <span className={`material-symbols-outlined text-sm ${isGeneratingToken ? 'animate-spin' : ''}`}>refresh</span>
                      {t('tree_settings.generate_new_link', 'توليد جديد')}
                    </button>
                  </div>

                  <div className="bg-card border border-border px-4 py-3 rounded-xl text-xs text-muted-foreground mb-4 font-mono break-all">
                    {publicShareableLink || t('settings.no_link_yet', 'لم يتم إنشاء رابط بعد - اضغط "توليد جديد"')}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(publicShareableLink)}
                      disabled={!shareToken}
                      className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground flex items-center gap-2 shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                      {t('tree_settings.copy_button', 'نسخ')}
                    </button>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">share</span>
                      {t('tree_settings.share_button', 'مشاركة')}
                    </button>
                  </div>
                </div>

                {/* Custom Link - Premium */}
                <PremiumFeatureRow
                  icon="language"
                  title={t('tree_settings.custom_link_title', 'رابط مخصص')}
                  description={t('tree_settings.custom_link_premium_desc', 'عيّن رابط URL مخصص مثل shjrti.com/alsaeed')}
                  isAvailable={hasCustomDomainFeature}
                  isLoading={checkingFeatures}
                  currentValue={familyData?.custom_domain}
                  onUpgrade={() => navigate('/plan-selection')}
                  onConfigure={() => setIsDomainModalOpen(true)}
                />

                {/* Password Protection */}
                {checkingFeatures ? (
                  <div className="p-5 border border-dashed border-border rounded-2xl flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : hasCustomDomainFeature ? (
                  <div className={`p-5 rounded-2xl border ${hasExistingPassword ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-primary/5 border-primary/20'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasExistingPassword ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'}`}>
                          <span className={`material-symbols-outlined ${hasExistingPassword ? 'text-green-600' : 'text-primary'}`}>lock_person</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{t('tree_settings.password_protection', 'حماية بكلمة مرور')}</span>
                            {hasExistingPassword && <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {hasExistingPassword
                              ? t('tree_settings.password_protected_desc', 'الشجرة محمية بكلمة مرور')
                              : t('tree_settings.password_protection_desc', 'احمِ شجرتك بكلمة مرور لمنع الوصول غير المصرح')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isEditingPassword ? (
                      <div className="space-y-3 mt-4">
                        <input
                          type="password"
                          value={sharePassword}
                          onChange={(e) => setSharePassword(e.target.value)}
                          placeholder={t('tree_settings.enter_password', 'أدخل كلمة المرور الجديدة')}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSavePassword}
                            disabled={isUpdatingPassword || !sharePassword.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {isUpdatingPassword ? t('tree_settings.saving', 'جاري الحفظ...') : t('tree_settings.save', 'حفظ')}
                          </button>
                          <button
                            onClick={() => { setIsEditingPassword(false); setSharePassword(''); }}
                            className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
                          >
                            {t('tree_settings.cancel', 'إلغاء')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setIsEditingPassword(true)}
                          className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
                        >
                          {hasExistingPassword ? t('tree_settings.change_password', 'تغيير كلمة المرور') : t('tree_settings.set_password', 'تعيين كلمة مرور')}
                        </button>
                        {hasExistingPassword && (
                          <button
                            onClick={handleDeletePassword}
                            disabled={isUpdatingPassword}
                            className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm align-middle ml-1">delete</span>
                            {isUpdatingPassword ? t('tree_settings.removing_protection', 'جاري الإزالة...') : t('tree_settings.remove_protection', 'إزالة الحماية')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <PremiumFeatureRow
                    icon="lock_person"
                    title={t('tree_settings.password_protection', 'حماية بكلمة مرور')}
                    description={t('tree_settings.password_protection_desc', 'احمِ شجرتك بكلمة مرور لمنع الوصول غير المصرح')}
                    isAvailable={false}
                    isLoading={false}
                    onUpgrade={() => navigate('/plan-selection')}
                  />
                )}

                {/* Public Photo Gallery */}
                {checkingFeatures ? (
                  <div className="p-5 border border-dashed border-border rounded-2xl flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : hasImageUploadFeature ? (
                  <div className={`p-5 rounded-2xl border ${shareGallery ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-primary/5 border-primary/20'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shareGallery ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10'}`}>
                          <span className={`material-symbols-outlined ${shareGallery ? 'text-green-600' : 'text-primary'}`}>collections</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{t('tree_settings.gallery_sharing_title', 'مشاركة ألبوم صور العائلة')}</span>
                            {shareGallery && <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('tree_settings.gallery_sharing_desc', 'اسمح للزوار بمشاهدة ألبوم صور العائلة')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={shareGallery}
                          onChange={(e) => handleGalleryToggle(e.target.checked)}
                          disabled={isUpdatingGallery}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                      </label>
                    </div>
                    {shareGallery && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">warning</span>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {t('tree_settings.gallery_warning_desc', 'سيتمكن أي شخص لديه رابط المشاركة من مشاهدة صور العائلة')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <PremiumFeatureRow
                    icon="collections"
                    title={t('tree_settings.gallery_sharing_title', 'مشاركة ألبوم صور العائلة')}
                    description={t('tree_settings.gallery_sharing_premium_desc', 'السماح للزوار بتصفح ألبومات صور العائلة')}
                    isAvailable={false}
                    isLoading={false}
                    onUpgrade={() => navigate('/plan-selection')}
                  />
                )}

                {/* Premium Upgrade CTA */}
                {(!hasCustomDomainFeature || !hasImageUploadFeature) && !checkingFeatures && (
                  <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--accent-gold))] opacity-10 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary opacity-10 blur-2xl -ml-12 -mb-12 rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-[hsl(37,60%,60%)]/20 text-[hsl(37,60%,60%)] text-[10px] font-bold rounded uppercase tracking-widest border border-[hsl(37,60%,60%)]/30">
                            {t('settings.pro_advantage', 'Pro Advantage')}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold mb-2">{t('settings.unlock_premium', 'افتح الأمان والعلامة التجارية المميزة')}</h4>
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined text-[hsl(37,60%,60%)] text-sm">verified</span>
                            {t('settings.premium_feature_1', 'روابط مخصصة ووصول محمي بكلمة مرور')}
                          </li>
                          <li className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="material-symbols-outlined text-[hsl(37,60%,60%)] text-sm">verified</span>
                            {t('settings.premium_feature_2', 'ألبومات صور عامة لمشاركة الذكريات')}
                          </li>
                        </ul>
                      </div>
                      <div className="flex-shrink-0 w-full md:w-auto">
                        <button
                          onClick={() => navigate('/plan-selection')}
                          className="w-full md:w-auto px-8 py-4 font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap text-slate-900"
                          style={{ background: 'hsl(37 60% 60%)', boxShadow: '0 0 15px hsla(37, 60%, 60%, 0.3)' }}
                        >
                          <span className="material-symbols-outlined">workspace_premium</span>
                          {t('settings.upgrade_to_premium', 'ترقية إلى المميزة')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy & Cultural Sensitivity */}
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">security</span>
                <h3 className="font-bold text-lg text-foreground">{t('tree_settings.female_privacy_title', 'الخصوصية والحساسية الثقافية')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{t('settings.privacy_subtitle', 'إدارة خصوصية البيانات بما يتماشى مع التقاليد العائلية')}</p>

              {/* Info notice */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 mb-8 border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500 text-xl">info</span>
                <p className="text-sm text-muted-foreground">
                  {t('tree_settings.female_privacy_notice', 'تؤثر هذه الإعدادات على الزوار فقط. كمالك للشجرة، ستتمكن دائماً من رؤية جميع البيانات.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Female Name Visibility */}
                <div className="p-6 bg-muted rounded-2xl border border-border">
                  <label className="text-sm font-bold text-foreground mb-3 block">{t('tree_settings.female_name_display', 'عرض أسماء الإناث')}</label>
                  <div className="space-y-2">
                    {privacyOptions.map(opt => {
                      const isSelected = femaleNamePrivacy === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleFemaleNamePrivacyChange(opt.value)}
                          disabled={isUpdatingPrivacy}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-start disabled:opacity-50 ${
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary font-semibold'
                              : 'border-border bg-card text-foreground hover:border-primary/30'
                          }`}
                        >
                          {isSelected ? (
                            <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                          ) : opt.locked ? (
                            <span className="material-symbols-outlined text-destructive text-lg">lock</span>
                          ) : (
                            <span className="material-symbols-outlined text-primary text-lg">radio_button_unchecked</span>
                          )}
                          <div className="flex flex-col gap-1 flex-1">
                            <span>{opt.label}</span>
                            <div className="flex items-center gap-1.5 text-xs" dir="rtl">
                              <span className="text-muted-foreground">مثال:</span>
                              {opt.value === 'full' ? (
                                <div className="flex gap-1.5">
                                  <span className="bg-muted rounded px-2 py-0.5 text-foreground">سارة</span>
                                  <span className="bg-muted rounded px-2 py-0.5 text-foreground">الأمير</span>
                                </div>
                              ) : opt.value === 'family_only' ? (
                                <div className="flex gap-1.5">
                                  <span className="bg-destructive/10 text-destructive/60 rounded px-2 py-0.5 text-[10px] select-none">الاسم الأول مخفي</span>
                                  <span className="bg-muted rounded px-2 py-0.5 text-foreground">الأمير</span>
                                </div>
                              ) : (
                                <span className="bg-destructive/10 text-destructive/60 rounded px-2 py-0.5 text-[10px] select-none">الاسم الأول واسم العائلة مخفي</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Female Photo Hidden Toggle */}
                <div className="flex flex-col items-center justify-center text-center p-6 bg-muted rounded-2xl border border-border group hover:border-primary/20 transition-colors">
                  <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center border border-border shadow-sm group-hover:bg-primary/5 transition-colors mb-3">
                    <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">no_photography</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{t('tree_settings.female_photo_hidden', 'إخفاء صور الإناث')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">{t('tree_settings.female_photo_hidden_desc', 'سيتم استبدال صور الإناث بأيقونة افتراضية للزوار')}</p>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={femalePhotoHidden}
                      onChange={handleFemalePhotoToggle}
                      disabled={isUpdatingPrivacy}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Admins & Permissions */}
        {activeSettingsTab === 'admins' && (
          <CollaboratorsTab familyId={familyId} isOwner={isOwner} />
        )}

        {/* Tab 3: Advanced Settings */}
        {activeSettingsTab === 'advanced' && (
          <>
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">settings</span>
                <h3 className="font-bold text-lg text-foreground">{t('settings.advanced_settings', 'الإعدادات المتقدمة')}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-8">{t('settings.advanced_desc', 'تصدير البيانات والإجراءات الدائمة')}</p>

              <div className={`grid grid-cols-1 ${isOwner ? 'md:grid-cols-2' : ''} gap-6`}>
                {/* Download Tree Data */}
                <div className="p-6 bg-muted rounded-2xl border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-muted-foreground text-lg">download</span>
                      <h4 className="font-bold text-foreground text-sm">{t('settings.download_tree_data', 'تحميل بيانات الشجرة')}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">{t('settings.export_gedcom_desc', 'تصدير جميع بيانات العائلة بتنسيق GEDCOM القياسي.')}</p>
                  </div>
                  <button className="w-full py-3 bg-card border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors shadow-sm">
                    {t('settings.export_data', 'تصدير البيانات')}
                  </button>
                </div>

                {/* Delete Family Tree - Owner Only */}
                {isOwner && (
                  <div className="p-6 bg-red-50/30 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">delete_forever</span>
                        <h4 className="font-bold text-red-600 text-sm">{t('settings.delete_tree', 'حذف شجرة العائلة')}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">{t('settings.delete_tree_desc', 'حذف هذه الشجرة وجميع بياناتها بشكل دائم.')}</p>
                    </div>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/10"
                    >
                      {t('settings.delete_permanently', 'حذف نهائي')}
                    </button>
                  </div>
                )}
              </div>
              {isOwner && <p className="text-[11px] text-muted-foreground text-center mt-6 italic">{t('settings.deletion_warning', 'تحذير: إجراءات الحذف لا يمكن التراجع عنها وستمسح جميع السجلات.')}</p>}
            </div>
          </>
        )}

        {/* Back to Dashboard */}
        <div className="flex justify-center pb-8">
          <button
            onClick={() => navigate('/stitch-dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-colors group"
          >
            <span className="material-symbols-outlined transition-transform group-hover:rtl:translate-x-1 group-hover:ltr:-translate-x-1">arrow_back</span>
            {t('settings.back_to_dashboard', 'العودة للوحة التحكم')}
          </button>
        </div>
      </div>

      {/* Modals */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        familyName={familyData?.name || ''}
        shareLink={shareableLink}
        familyId={familyId}
        hasCustomDomain={!!familyData?.custom_domain}
      />

      <CustomDomainModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        familyId={familyId}
        currentDomain={familyData?.custom_domain || undefined}
        onDomainUpdated={() => onFamilyUpdated?.()}
      />

      <TreeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        treeId={familyId}
        treeName={familyData?.name || ''}
      />
    </section>
  );
};

// Premium Feature Row Component
const PremiumFeatureRow: React.FC<{
  icon: string;
  title: string;
  description: string;
  isAvailable: boolean;
  isLoading: boolean;
  currentValue?: string | null;
  onUpgrade: () => void;
  onConfigure?: () => void;
}> = ({ icon, title, description, isAvailable, isLoading, currentValue, onUpgrade, onConfigure }) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-5 border border-dashed border-border rounded-2xl flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAvailable) {
    if (!onConfigure) {
      // Feature is available but no configuration needed — show as enabled
      return (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary">{icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">{title}</span>
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary">{icon}</span>
          </div>
          <div>
            <span className="font-bold text-foreground text-sm">{title}</span>
            {currentValue && <p className="text-xs text-primary mt-0.5">shjrti.com/{currentValue}</p>}
            {!currentValue && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <button
          onClick={onConfigure}
          className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
        >
          {currentValue ? t('tree_settings.edit_button', 'تعديل') : t('settings.configure', 'إعداد')}
        </button>
      </div>
    );
  }

  // Locked / Premium
  return (
    <div className="p-5 border border-dashed border-[hsl(37,60%,60%)]/50 bg-[hsl(37,60%,60%)]/5 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[hsl(37,60%,60%)]/10 rounded-xl flex items-center justify-center border border-[hsl(37,60%,60%)]/20">
          <span className="material-symbols-outlined text-[hsl(37,60%,60%)]">{icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{title}</span>
            <span className="px-1.5 py-0.5 bg-[hsl(37,60%,60%)]/20 text-[hsl(37,60%,60%)] text-[9px] font-bold rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              PREMIUM
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[hsl(37,60%,60%)]">lock</span>
        <button
          onClick={onUpgrade}
          className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground hover:border-[hsl(37,60%,60%)] transition-colors"
        >
          {t('tree_settings.upgrade_now', 'ترقية الآن')}
        </button>
      </div>
    </div>
  );
};

export default StitchSettingsView;
