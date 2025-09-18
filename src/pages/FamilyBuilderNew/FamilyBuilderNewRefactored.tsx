import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useIsMobile } from "@/hooks/use-mobile";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";

// New Components
import { FamilyBuilderHeader } from "./components/Header/FamilyBuilderHeader";
import { MainLayout } from "./components/Layout/MainLayout";
import { FamilyStatsPanel } from "./components/Stats/FamilyStatsPanel";
import { FormPanelContainer } from "./components/FormPanel/FormPanelContainer";
import { MemberFormContainer } from "./components/Forms/MemberFormContainer";
import { SimplifiedMemberList } from "./components/MemberList/SimplifiedMemberList";
import { TreeSettingsView } from "./components/TreeSettings/TreeSettingsView";

// Hooks
import { useFamilyData } from "./hooks/useFamilyData";
import { useFormState } from "./hooks/useFormState";
import { useGenerationStats } from "./hooks/useGenerationStats";

// Types
import { Member } from "./types/family.types";

const FamilyBuilderNewRefactored = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { hasAIFeatures } = useSubscription();
  const { notifications, profile } = useDashboardData();
  const isMobile = useIsMobile();

  // URL Parameters
  const familyId = searchParams.get('family');
  const isNew = searchParams.get('new') === 'true';
  const isEditMode = searchParams.get('edit') === 'true';

  // State Management
  const [activeTab, setActiveTab] = useState("overview");
  const [memberProfileData, setMemberProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Custom Hooks
  const {
    familyData,
    familyMembers,
    marriages: familyMarriages,
    loading,
    refreshFamilyData
  } = useFamilyData(familyId);

  const {
    formMode,
    formData,
    selectedMemberId,
    setFormMode,
    setFormData,
    resetForm,
    loadMemberToForm
  } = useFormState();

  const { generationCount, generationStats } = useGenerationStats(
    familyMembers,
    familyMarriages,
    loading
  );

  // Form state for the new form component
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Loading check
  if (loading) {
    return <FamilyBuilderNewSkeleton />;
  }

  // Error check
  if (!familyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            خطأ في معرف العائلة
          </h2>
          <p className="text-muted-foreground">
            لم يتم العثور على معرف العائلة في الرابط
          </p>
        </div>
      </div>
    );
  }

  // Handlers
  const handleMemberSelect = async (member: Member) => {
    try {
      setProfileLoading(true);
      setMemberProfileData(member);
      setFormMode('profile');
      
      // Load full member data if needed
      // This is where you would fetch additional member details
    } catch (error) {
      console.error('Error loading member profile:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات العضو",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMemberEdit = (member: Member) => {
    loadMemberToForm(member);
    setFormMode('edit');
    setCurrentStep(1);
  };

  const handleAddMember = () => {
    resetForm();
    setFormMode('add');
    setCurrentStep(1);
  };

  const handleFormClose = () => {
    resetForm();
    setFormMode('view');
    setMemberProfileData(null);
  };

  const handleTreeSettings = () => {
    setFormMode('tree-settings');
  };

  const handleSaveMember = async () => {
    try {
      setIsSaving(true);
      
      // TODO: Implement save logic
      console.log('Saving member:', formData);
      
      // Refresh family data after save
      await refreshFamilyData();
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ بيانات العضو بنجاح",
      });

      handleFormClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات العضو",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render form content based on mode
  const renderFormPanel = () => {
    if (formMode === 'tree-settings') {
      return (
        <TreeSettingsView
          familyData={familyData}
          onBack={handleFormClose}
        />
      );
    }

    if (formMode === 'add' || formMode === 'edit') {
      return (
        <MemberFormContainer
          formData={formData}
          setFormData={setFormData}
          familyMembers={familyMembers}
          familyMarriages={familyMarriages}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          isSaving={isSaving}
          loading={loading}
          onSave={handleSaveMember}
          editingMember={formMode === 'edit' ? familyMembers.find(m => m.id === selectedMemberId) : null}
        />
      );
    }

    return null;
  };

  // Left Panel (Members List)
  const leftPanel = (
    <SimplifiedMemberList
      familyMembers={familyMembers}
      onMemberSelect={handleMemberSelect}
      onMemberEdit={handleMemberEdit}
      onAddMember={handleAddMember}
      searchable={true}
    />
  );

  // Right Panel (Form or Stats)
  const rightPanel = activeTab === 'stats' ? (
    <FamilyStatsPanel
      familyMembers={familyMembers}
      familyMarriages={familyMarriages}
      generationCount={generationCount}
      generationStats={generationStats}
      loading={loading}
    />
  ) : (
    <FormPanelContainer
      formMode={formMode}
      editingMember={familyMembers.find(m => m.id === selectedMemberId) || null}
      memberProfileData={memberProfileData}
      profileLoading={profileLoading}
      familyMembers={familyMembers}
      familyMarriages={familyMarriages}
      onClose={handleFormClose}
      onEdit={handleMemberEdit}
    >
      {renderFormPanel()}
    </FormPanelContainer>
  );

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))]">
        <FamilyBuilderHeader
          familyData={familyData}
          memberCount={familyMembers.length}
          generationCount={generationCount}
          onTreeSettingsClick={handleTreeSettings}
          loading={loading}
        />

        <MainLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          isMobile={isMobile}
        />
      </div>

      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderNewRefactored;