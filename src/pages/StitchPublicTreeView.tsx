import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { supabase } from "@/integrations/supabase/client";
import PasswordModal from "@/components/PasswordModal";
import { SuggestEditDialog } from "@/components/SuggestEditDialog";
import { FamilyMembersList } from "@/components/FamilyMembersList";
import { FamilyStatisticsView } from "@/components/FamilyStatisticsView";
import { FamilyGalleryView } from "@/components/FamilyGalleryView";
import { FamilyOverview } from "@/components/FamilyOverview";
import { MemberProfileModal } from "@/components/MemberProfileModal";
import { StitchTreeCanvas } from "@/components/stitch/TreeCanvas";
import { StitchFamilyBar } from "@/components/stitch/FamilyBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFamilyData } from '@/contexts/FamilyDataContext';
import familyTreeLogo from "@/assets/family-tree-logo.png";

interface StitchPublicTreeViewProps {
  shareToken?: string | null;
  skipDataLoading?: boolean;
}

const StitchPublicTreeView = ({ shareToken, skipDataLoading = false }: StitchPublicTreeViewProps) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { direction, t } = useLanguage();

  // Context data when skipDataLoading
  const contextData = skipDataLoading ? useFamilyData() : null;

  // Local state
  const [localFamilyMembers, setLocalFamilyMembers] = useState<any[]>([]);
  const [localFamilyMarriages, setLocalFamilyMarriages] = useState<any[]>([]);
  const [localFamilyData, setLocalFamilyData] = useState<any>(null);

  const familyMembers = skipDataLoading ? (contextData?.familyMembers || []) : localFamilyMembers;
  const familyMarriages = skipDataLoading ? (contextData?.marriages || []) : localFamilyMarriages;
  const familyData = skipDataLoading ? contextData?.familyData : localFamilyData;

  const [isLoading, setIsLoading] = useState(!skipDataLoading);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>("all");

  // Suggest Edit Dialog state
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [suggestEditMemberId, setSuggestEditMemberId] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");

  // Member Profile Modal state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const familyId = familyData?.id;

  // Context data ready check
  useEffect(() => {
    if (skipDataLoading && contextData) {
      if (!contextData.loading && contextData.familyData) {
        setIsLoading(false);
      }
    }
  }, [skipDataLoading, contextData]);

  // Load data via token
  useEffect(() => {
    if (skipDataLoading) {
      setIsLoading(false);
      return;
    }
    if (shareToken) {
      loadFamilyDataViaToken();
    } else {
      setTokenError('TOKEN_REQUIRED');
      setIsLoading(false);
    }
  }, [shareToken, skipDataLoading]);

  const handlePasswordSubmit = async (password: string) => {
    setEnteredPassword(password);
    await loadFamilyDataViaToken(password);
  };

  const loadFamilyDataViaToken = async (password?: string) => {
    try {
      setIsLoading(true);
      setTokenError(null);

      const { data, error } = await supabase.functions.invoke('get-shared-family', {
        body: {
          share_token: shareToken,
          password: password || enteredPassword || undefined
        }
      });

      if (error) {
        toast({
          title: t('common.error', 'Error'),
          description: t('common.network_error', 'Network error'),
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      if (!data?.success) {
        const errorCode = data?.error;
        if (errorCode === 'PASSWORD_REQUIRED') {
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        }
        if (errorCode === 'PASSWORD_INCORRECT') {
          setPasswordError(true);
          setShowPasswordModal(true);
          setIsLoading(false);
          return;
        }
        if (errorCode === 'TOKEN_EXPIRED') {
          setTokenError('TOKEN_EXPIRED');
          setIsLoading(false);
          return;
        }
        if (errorCode === 'TOKEN_INVALID') {
          setTokenError('TOKEN_INVALID');
          setIsLoading(false);
          return;
        }
        setTokenError(errorCode || 'UNKNOWN_ERROR');
        setIsLoading(false);
        return;
      }

      const { family, members, marriages } = data.data;
      setLocalFamilyData(family);
      setLocalFamilyMembers(members || []);
      setLocalFamilyMarriages(marriages || []);
      setShowPasswordModal(false);
      setPasswordError(false);
      setIsLoading(false);
    } catch (error) {
      console.error('[StitchPublicTreeView] Unexpected error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('common.network_error', 'An unexpected error occurred'),
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Generation count
  const generationCount = useMemo(() => {
    if (familyMembers.length === 0) return 0;
    const founders = familyMembers.filter((m: any) => m.is_founder);
    if (founders.length === 0) return 1;

    let maxGen = 0;
    const getGeneration = (member: any, visited = new Set()): number => {
      if (visited.has(member.id)) return 0;
      visited.add(member.id);
      if (!member.father_id && !member.mother_id) return 0;
      const children = familyMembers.filter((m: any) =>
        m.father_id === member.id || m.mother_id === member.id
      );
      if (children.length === 0) return 0;
      return 1 + Math.max(...children.map(c => getGeneration(c, visited)));
    };

    founders.forEach(f => {
      maxGen = Math.max(maxGen, getGeneration(f));
    });
    return maxGen + 1;
  }, [familyMembers]);

  // Handle member click
  const handleMemberClick = (member: any) => setSelectedMemberId(member.id);

  // Handle suggest edit
  const handleSuggestEdit = (memberId: string, memberName: string) => {
    setSuggestEditMemberId(memberId);
    setSelectedMemberName(memberName);
    setSuggestEditOpen(true);
  };

  // Root options for FamilyBar
  const rootOptions = useMemo(() => {
    return familyMarriages
      .filter((m: any) => m.is_active !== false)
      .map((marriage: any) => {
        const husband = familyMembers.find((m: any) => m.id === marriage.husband_id);
        const wife = familyMembers.find((m: any) => m.id === marriage.wife_id);
        if (husband && wife) {
          return {
            id: marriage.id,
            label: `${husband.name} ❤️ ${wife.name}`
          };
        }
        return null;
      })
      .filter(Boolean) as { id: string; label: string }[];
  }, [familyMarriages, familyMembers]);

  // Family name extraction
  const familyName = useMemo(() => {
    if (!familyData?.name) return '';
    if (typeof familyData.name === 'string') return familyData.name;
    if (typeof familyData.name === 'object') return familyData.name.ar || familyData.name.en || '';
    return '';
  }, [familyData]);

  // Section tabs
  const sections = useMemo(() => {
    const base = [
      { id: 'overview', label: t('public_tree.overview', 'نبذة'), icon: 'info' },
      { id: 'tree', label: t('public_tree.tree', 'الشجرة'), icon: 'account_tree' },
      { id: 'statistics', label: t('public_tree.statistics', 'الإحصائيات'), icon: 'bar_chart' },
    ];
    if (familyData?.share_gallery) {
      base.push({ id: 'gallery', label: t('public_tree.gallery', 'المعرض'), icon: 'photo_library' });
    }
    return base;
  }, [familyData, t]);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="theme-stitch min-h-screen flex flex-col bg-slate-50 dark:bg-background">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">{t('common.loading', 'جاري التحميل...')}</p>
          </div>
        </main>
      </div>
    );
  }

  // --- PASSWORD MODAL ---
  if (showPasswordModal) {
    return (
      <div className="theme-stitch min-h-screen flex flex-col bg-slate-50 dark:bg-background">
        <main className="flex-1">
          <PasswordModal
            isOpen={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(false);
              setPasswordError(true);
            }}
            onSubmit={handlePasswordSubmit}
            familyName={familyName}
          />
        </main>
      </div>
    );
  }

  // --- TOKEN ERROR ---
  if (tokenError && !isLoading) {
    const isExpired = tokenError === 'TOKEN_EXPIRED';
    return (
      <div className="theme-stitch min-h-screen flex flex-col bg-slate-50 dark:bg-background">
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-lg w-full p-8 sm:p-10 text-center border-2 border-destructive/20 shadow-xl rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent"></div>
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-destructive">
                  {isExpired ? 'schedule' : 'link_off'}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-destructive mb-4">
              {isExpired
                ? t('public_tree.link_expired', 'انتهت صلاحية الرابط')
                : t('public_tree.invalid_link', 'رابط غير صحيح')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {isExpired
                ? t('public_tree.link_expired_desc', 'عذراً، انتهت صلاحية رابط المشاركة. يرجى طلب رابط جديد.')
                : t('public_tree.invalid_link_desc', 'عذراً، يبدو أنك اتبعت رابط غير صحيح.')}
            </p>
            <p className="text-muted-foreground/80 text-sm leading-relaxed">
              {t('public_tree.request_new_link', 'اطلب من صاحب الشجرة مشاركة الرابط مرة أخرى.')}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent"></div>
          </Card>
        </main>
      </div>
    );
  }

  // --- PASSWORD ERROR (closed modal) ---
  if (passwordError && !showPasswordModal) {
    return (
      <div className="theme-stitch min-h-screen flex flex-col bg-slate-50 dark:bg-background">
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full p-8 text-center border-2 border-destructive/20 shadow-xl rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-5 bg-destructive/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-destructive">lock</span>
            </div>
            <h2 className="text-xl font-bold text-destructive mb-3">
              {t('public_tree.access_denied', 'الوصول محظور')}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('public_tree.wrong_password', 'كلمة المرور المدخلة غير صحيحة.')}
            </p>
          </Card>
        </main>
      </div>
    );
  }

  // --- MAIN CONTENT ---
  return (
    <div className="theme-stitch min-h-screen flex flex-col bg-slate-50 dark:bg-background" dir={direction}>
      {/* Simple Public Header */}
      <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={familyTreeLogo} alt="Logo" className="h-8 w-8 object-contain" />
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Playfair Display', serif" }}>
              {familyName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">group</span>
              {familyMembers.length} {t('stitch.members', 'عضو')}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">layers</span>
              {generationCount} {t('public_tree.generations', 'أجيال')}
            </span>
          </div>
        </div>
      </header>

      {/* Section Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 overflow-x-auto">
        <div className="flex items-center gap-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-base sm:text-lg">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4">
          <div className="grid gap-4 items-start grid-cols-1 md:grid-cols-12">

            {/* Member List Sidebar - Col 3 */}
            <div className="col-span-1 md:col-span-3 order-1 md:order-1">
              {isMobile ? (
                <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-base">group</span>
                      {t('public_tree.show_members', 'عرض الأعضاء')} ({familyMembers.length})
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[75vh] flex flex-col">
                    <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2 mb-3" />
                    <div className="flex-1 overflow-y-auto p-4">
                      <FamilyMembersList
                        familyMembers={familyMembers}
                        familyMarriages={familyMarriages}
                        readOnly={true}
                        onMemberClick={(member) => {
                          handleMemberClick(member);
                          setIsMemberListOpen(false);
                        }}
                      />
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden sticky top-28">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <span className="material-symbols-outlined text-lg text-primary">group</span>
                      <span>{t('public_tree.family_members', 'أعضاء العائلة')} ({familyMembers.length})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100vh-14rem)] p-3">
                    <FamilyMembersList
                      familyMembers={familyMembers}
                      familyMarriages={familyMarriages}
                      readOnly={true}
                      onMemberClick={handleMemberClick}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Panel - Col 9 */}
            <div className="col-span-1 md:col-span-9 order-2 md:order-2">
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[calc(100vh-14rem)]">
                <CardContent className="p-0">
                  {activeSection === 'overview' && (
                    <div className="p-5 sm:p-6">
                      <FamilyOverview
                        familyData={familyData}
                        familyMembers={familyMembers}
                        generationCount={generationCount}
                      />
                    </div>
                  )}

                  {activeSection === 'tree' && (
                    <div className="flex flex-col">
                      {/* FamilyBar for root selection */}
                      <StitchFamilyBar
                        familyName={familyName}
                        showRootSelector={true}
                        rootOptions={rootOptions}
                        selectedRoot={selectedRootMarriage}
                        onRootChange={(val) => setSelectedRootMarriage(val)}
                      />
                      {/* Zoom controls */}
                      <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </Button>
                        <span className="text-xs min-w-[3rem] text-center font-medium text-muted-foreground">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                          <span className="material-symbols-outlined text-lg">add</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-8 w-8 p-0">
                          <span className="material-symbols-outlined text-lg">fit_screen</span>
                        </Button>
                      </div>
                      {/* Tree Canvas */}
                      <div className="min-h-[600px]">
                        {familyMembers.length === 0 ? (
                          <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground text-sm">{t('public_tree.no_data', 'لا توجد بيانات')}</p>
                          </div>
                        ) : (
                          <StitchTreeCanvas
                            familyMembers={familyMembers}
                            marriages={familyMarriages}
                            zoomLevel={zoomLevel}
                            viewMode="vertical"
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onResetZoom={handleResetZoom}
                            selectedRootMarriage={selectedRootMarriage}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {activeSection === 'statistics' && (
                    <div className="p-5 sm:p-6">
                      <FamilyStatisticsView
                        familyMembers={familyMembers}
                        familyMarriages={familyMarriages}
                      />
                    </div>
                  )}

                  {activeSection === 'gallery' && familyData?.share_gallery && (
                    <div className="p-5 sm:p-6">
                      <FamilyGalleryView
                        familyId={familyData?.id || ''}
                        readOnly={true}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>

      <GlobalFooterSimplified />

      {/* Member Profile Modal */}
      <MemberProfileModal
        isOpen={selectedMemberId !== null}
        onClose={() => setSelectedMemberId(null)}
        memberId={selectedMemberId}
        familyId={familyId}
        readOnly={true}
        onMemberClick={handleMemberClick}
      />

      {/* Suggest Edit Dialog */}
      <SuggestEditDialog
        isOpen={suggestEditOpen}
        onClose={() => setSuggestEditOpen(false)}
        familyId={familyId}
        memberId={suggestEditMemberId}
        memberName={selectedMemberName}
      />
    </div>
  );
};

export default StitchPublicTreeView;
