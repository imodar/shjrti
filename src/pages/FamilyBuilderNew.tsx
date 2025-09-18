import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Crown, MapPin, FileText, Camera, Clock, Bell, Settings, LogOut, UserPlus, Menu, Shield, AlertTriangle, UserCircle, Activity, Share2, Eye, Copy, Download, Lock, Globe, Link, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { DateDisplay } from "@/components/DateDisplay";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";
import MemberProfileSkeleton from "@/components/skeletons/MemberProfileSkeleton";
import { MemberProfileView } from "@/components/MemberProfileView";
import { TreeSettingsButton } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsButton";
import { MemberCard } from "@/pages/FamilyBuilderNew/components/MemberList/MemberCard";
import { TreeSettingsView } from "@/pages/FamilyBuilderNew/components/TreeSettings/TreeSettingsView";
import { MemberListComponent } from "@/pages/FamilyBuilderNew/components/MemberList/MemberListComponent";
import { FormLogicManager } from "@/pages/FamilyBuilderNew/components/Forms/FormLogicManager";

const FamilyBuilderNew = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasAIFeatures } = useSubscription();
  const isMobile = useIsMobile();
  
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { notifications, profile } = useDashboardData();

  // Package and subscription data
  const [packageData, setPackageData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  
  // URL params
  const familyId = searchParams.get('family');
  const treeId = searchParams.get('treeId');
  const isNew = searchParams.get('new') === 'true';
  const autoAdd = searchParams.get('autoAdd') === 'true';
  
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMarriages, setFamilyMarriages] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberListLoading, setMemberListLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [memberProfileData, setMemberProfileData] = useState(null);

  // Form panel states
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit' | 'profile' | 'tree-settings'>('view');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Mobile drawer state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);

  // Delete and upgrade modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Generation count calculation
  const generationCount = useMemo(() => {
    console.log('🔍 calculateGenerationCount called with familyMembers.length:', familyMembers.length);
    console.log('🔍 familyMarriages.length:', familyMarriages?.length || 0);
    console.log('🔍 loading state:', loading);
    if (familyMembers.length === 0) {
      console.log('🔍 No family members, returning 1');
      return 1;
    }
    console.log('🔍 Starting generation calculation with members:', familyMembers.map(m => ({
      id: m.id,
      name: m.name,
      isFounder: m.isFounder,
      fatherId: m.fatherId,
      motherId: m.motherId
    })));
    const generationMap = new Map();

    // Step 1: Find the founder and assign generation 1
    const founder = familyMembers.find(member => member.isFounder);
    if (founder) {
      generationMap.set(founder.id, 1);
      console.log(`🔍 Assigned generation 1 to founder: ${founder.name}`);

      // Step 2: Find founder's spouse(s) from marriages and assign generation 1
      familyMarriages.forEach(marriage => {
        if (marriage.husband_id === founder.id && marriage.wife_id) {
          generationMap.set(marriage.wife_id, 1);
          const spouse = familyMembers.find(m => m.id === marriage.wife_id);
          console.log(`🔍 Assigned generation 1 to founder's spouse: ${spouse?.name}`);
        } else if (marriage.wife_id === founder.id && marriage.husband_id) {
          generationMap.set(marriage.husband_id, 1);
          const spouse = familyMembers.find(m => m.id === marriage.husband_id);
          console.log(`🔍 Assigned generation 1 to founder's spouse: ${spouse?.name}`);
        }
      });
    }

    // Step 3: Iteratively assign generations based on parent-child relationships
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      familyMembers.forEach(member => {
        if (generationMap.has(member.id)) return; // Skip if already assigned

        const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : null;
        const motherGeneration = member.motherId ? generationMap.get(member.motherId) : null;

        // If at least one parent has a generation, assign child generation
        if (fatherGeneration !== undefined && fatherGeneration !== null || motherGeneration !== undefined && motherGeneration !== null) {
          const parentGeneration = Math.max(fatherGeneration || 0, motherGeneration || 0);
          const childGeneration = parentGeneration + 1;
          generationMap.set(member.id, childGeneration);
          console.log(`🔍 Assigned generation ${childGeneration} to ${member.name} (child of generation ${parentGeneration})`);
          changed = true;

          // Step 4: Also assign the same generation to their spouse(s)
          familyMarriages.forEach(marriage => {
            let spouseId = null;
            if (marriage.husband_id === member.id && marriage.wife_id) {
              spouseId = marriage.wife_id;
            } else if (marriage.wife_id === member.id && marriage.husband_id) {
              spouseId = marriage.husband_id;
            }
            if (spouseId && !generationMap.has(spouseId)) {
              generationMap.set(spouseId, childGeneration);
              const spouse = familyMembers.find(m => m.id === spouseId);
              console.log(`🔍 Assigned generation ${childGeneration} to spouse: ${spouse?.name}`);
              changed = true;
            }
          });
        }
      });
      console.log(`🔍 Iteration ${iterations}: ${generationMap.size} members assigned`);
    }

    // Step 5: Assign generation 1 to any remaining members without parents (fallback)
    familyMembers.forEach(member => {
      if (!generationMap.has(member.id) && !member.fatherId && !member.motherId) {
        generationMap.set(member.id, 1);
        console.log(`🔍 Assigned generation 1 to ${member.name} (no parents, fallback)`);
      }
    });

    // Final log of all assignments
    console.log("🔍 Final generation assignments:");
    familyMembers.forEach(member => {
      const gen = generationMap.get(member.id) || 1;
      console.log(`🔍 ${member.name} -> Generation ${gen}`);
    });
    const maxGeneration = Math.max(...Array.from(generationMap.values()));
    console.log("🔍 Max generation calculated:", maxGeneration);
    return maxGeneration;
  }, [familyMembers, familyMarriages, loading]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          packages:package_id (
            id,
            name,
            max_family_members,
            max_family_trees,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userSubscription && userSubscription.packages) {
        setPackageData(userSubscription.packages);
        setSubscriptionData(userSubscription);
      } else {
        const { data: freePackage } = await supabase
          .from('packages')
          .select('*')
          .ilike('name->en', 'Free')
          .single();
        if (freePackage) setPackageData(freePackage);
      }

      if (!familyId) {
        throw new Error('No family ID provided');
      }

      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .eq('creator_id', user.id)
        .single();

      if (familyError) {
        console.error('Error fetching family:', familyError);
        throw familyError;
      }

      if (!family) {
        throw new Error('Family not found or access denied');
      }

      setFamilyData(family);

      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id);

      if (membersError) throw membersError;

      if (members) {
        const transformedMembers = members.map(member => ({
          id: member.id,
          name: member.name,
          first_name: member.first_name,
          last_name: member.last_name,
          fatherId: member.father_id,
          motherId: member.mother_id,
          spouseId: member.spouse_id,
          relatedPersonId: member.related_person_id,
          isFounder: member.is_founder,
          gender: member.gender || 'male',
          birthDate: member.birth_date || '',
          isAlive: member.is_alive,
          deathDate: member.death_date || null,
          image: member.image_url || null,
          bio: member.biography || '',
          marital_status: member.marital_status || 'single',
          relation: ""
        }));
        setFamilyMembers(transformedMembers);
      }

      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select(`
          id,
          husband_id,
          wife_id,
          is_active,
          marital_status
        `)
        .eq('family_id', family.id)
        .eq('is_active', true);

      if (marriagesError) throw marriagesError;

      // Get detailed marriage data with member info
      let marriagesWithMembers = [];
      if (marriages) {
        marriagesWithMembers = await Promise.all(marriages.map(async (marriage) => {
          const [husbandResult, wifeResult] = await Promise.all([
            supabase.from('family_tree_members').select('*').eq('id', marriage.husband_id).single(),
            supabase.from('family_tree_members').select('*').eq('id', marriage.wife_id).single()
          ]);
          return {
            ...marriage,
            husband: husbandResult.data,
            wife: wifeResult.data
          };
        }));
      }

      if (marriagesWithMembers) {
        setFamilyMarriages(marriagesWithMembers);
      }

    } catch (error) {
      console.error('Error fetching family data:', error);
      toast({
        title: t('family_builder.error_loading_data', 'خطأ في تحميل البيانات'),
        description: t('family_builder.error_loading_desc', 'حدث خطأ أثناء تحميل بيانات العائلة'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFamilyData = async () => {
    await fetchFamilyData();
  };

  useEffect(() => {
    fetchFamilyData();
  }, [familyId]);

  // Simplified functions for form logic manager
  const handleCancelForm = () => {
    setFormMode('view');
    setEditingMember(null);
    setCurrentStep(1);
  };

  const handleEditMember = useCallback((member: any) => {
    setFormMode('edit');
    setEditingMember(member);
    setCurrentStep(1);
  }, []);

  const handleAddMember = () => {
    if (packageData && familyMembers.length >= packageData.max_family_members) {
      setShowUpgradeModal(true);
      return;
    }
    setFormMode('add');
    setEditingMember(null);
    setCurrentStep(1);
  };

  const handleDeleteMember = async (member: any) => {
    setMemberToDelete(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    
    try {
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف ${memberToDelete.name} من العائلة`,
      });

      await refreshFamilyData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العضو",
        variant: "destructive"
      });
    } finally {
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const handleViewProfile = (member: any) => {
    setEditingMember(member);
    setFormMode('profile');
  };

  if (loading) {
    return <FamilyBuilderNewSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <GlobalHeader />
      
      {/* Smart Search Bar */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-b border-white/20 dark:border-gray-700/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <SmartSearchBar 
              familyId={familyId || ''}
              onResultSelect={(member) => handleViewProfile(member)}
            />
            
            {hasAIFeatures && (
              <SuggestionPanel 
                familyId={familyId || ''}
                className="flex-shrink-0"
              />
            )}
            
            <Button 
              onClick={handleAddMember}
              size="lg" 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              إضافة عضو
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-2 pb-6">
        <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-12")}>
          {/* Form Panel - Right Side on Desktop */}
          <div className={cn("space-y-6", isMobile ? "order-2" : "col-span-8 order-2")}>
            <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
              
              <CardContent className="relative p-2 sm:p-4 md:p-6 overflow-hidden">
                {formMode === 'view' ? (
                  <div className="py-8 px-6">
                    {/* Family Overview Header - Redesigned */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-background via-card/50 to-accent/5 rounded-3xl p-8 sm:p-12 mb-8 border border-border/50 shadow-2xl backdrop-blur-sm animate-fade-in">
                      {/* Settings Button - Enhanced */}
                      <div className="absolute top-6 left-6 z-20">
                        <div className="relative group">
                          <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-secondary rounded-xl blur opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse"></div>
                          <div className="relative bg-card/80 backdrop-blur-md rounded-xl p-2 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <TreeSettingsButton onShowSettings={() => setFormMode('tree-settings')} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative z-10 pt-4">
                        {/* Hero Content */}
                        <div className="text-center space-y-8">
                          {/* Logo Section with Enhanced Design */}
                          <div className="relative inline-block">
                            <div className="relative group">
                              {/* Main Icon Container */}
                              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                                {/* Animated background rings */}
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin" style={{animationDuration: '10s'}}></div>
                                <div className="absolute inset-2 rounded-full border-2 border-secondary/30 animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
                                
                                {/* Main icon */}
                                <div className="absolute inset-4 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:shadow-primary/50 transition-all duration-500 border-2 border-primary/20">
                                  <TreePine className="h-12 w-12 sm:h-14 sm:w-14 text-primary-foreground drop-shadow-lg" />
                                </div>
                                
                                {/* Active Status Indicator */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full border-4 border-card shadow-xl flex items-center justify-center">
                                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Title Section with Enhanced Typography */}
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
                                  عائلة {familyData?.name || 'غير محدد'}
                                </span>
                              </h1>
                              
                              {/* Animated Decorative Line */}
                              <div className="flex items-center justify-center space-x-2">
                                <div className="h-1 w-8 bg-gradient-to-r from-transparent to-primary rounded-full animate-fade-in delay-200"></div>
                                <div className="h-2 w-20 bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-fade-in delay-100"></div>
                                <div className="h-1 w-8 bg-gradient-to-r from-secondary to-transparent rounded-full animate-fade-in delay-200"></div>
                              </div>
                            </div>
                            
                            {/* Family Description with Glass Morphism */}
                            {familyData?.description && (
                              <div className="max-w-2xl mx-auto animate-fade-in delay-300">
                                <div className="relative group">
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-card/20 to-secondary/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                                  <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border border-border/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-medium">
                                      {familyData.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {/* Total Members */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-700">
                        <Users className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {familyMembers.length}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">إجمالي الأعضاء</div>
                      </div>

                      {/* Generations */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-700">
                        <Crown className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                          {generationCount}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">الأجيال</div>
                      </div>

                      {/* Males */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-700">
                        <UserIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {familyMembers.filter(m => m.gender === 'male').length}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">الذكور</div>
                      </div>

                      {/* Females */}
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 rounded-xl p-4 text-center border border-pink-200 dark:border-pink-700">
                        <UserRoundIcon className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">
                          {familyMembers.filter(m => m.gender === 'female').length}
                        </div>
                        <div className="text-xs text-pink-600 dark:text-pink-400">الإناث</div>
                      </div>
                     </div>
                   </div>
                ) : formMode === 'profile' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        ملف {editingMember?.name || 'العضو'}
                      </h2>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelForm}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        العودة
                      </Button>
                    </div>
                    {profileLoading ? (
                      <MemberProfileSkeleton />
                    ) : (
                      <MemberProfileView 
                        member={editingMember}
                        onEdit={() => setFormMode('edit')}
                        onDelete={() => handleDeleteMember(editingMember)}
                        onBack={() => setFormMode('view')}
                        familyMembers={familyMembers}
                        marriages={familyMarriages}
                      />
                    )}
                  </div>
                ) : formMode === 'tree-settings' ? (
                  <TreeSettingsView
                    familyData={familyData}
                    onBack={() => setFormMode('view')}
                  />
                ) : (
                  // Use FormLogicManager for add/edit modes
                  <FormLogicManager
                    familyId={familyId || ''}
                    familyData={familyData}
                    familyMembers={familyMembers}
                    familyMarriages={familyMarriages}
                    packageData={packageData}
                    subscriptionData={subscriptionData}
                    editingMember={editingMember}
                    formMode={formMode}
                    refreshFamilyData={refreshFamilyData}
                    onFormModeChange={(mode) => setFormMode(mode as 'view' | 'add' | 'edit' | 'profile' | 'tree-settings')}
                    onCurrentStepChange={setCurrentStep}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Member List - Left Side on Desktop */}
          <div className={cn("space-y-4", isMobile ? "order-1" : "col-span-4 order-1")}>
            {isMobile ? (
              <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <Menu className="h-4 w-4" />
                    قائمة الأعضاء ({familyMembers.length})
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh]">
                  <div className="p-4 h-full overflow-y-auto">
                    <MemberListComponent
                      members={familyMembers}
                      familyMembers={familyMembers}
                      marriages={familyMarriages}
                      searchTerm=""
                      selectedFilter="all"
                      memberListLoading={memberListLoading}
                      formMode={formMode}
                      packageData={packageData}
                      isMemberListOpen={isMemberListOpen}
                      onSearchChange={() => {}}
                      onFilterChange={() => {}}
                      onEditMember={handleEditMember}
                      onViewMember={handleViewProfile}
                      onDeleteMember={handleDeleteMember}
                      onSpouseEditAttempt={() => {}}
                      onAddMember={handleAddMember}
                      onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
                      checkIfMemberIsSpouse={() => false}
                      getAdditionalInfo={() => ""}
                      getGenderColor={() => "bg-blue-500"}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Card className="sticky top-4 max-h-[calc(100vh-8rem)] overflow-y-auto bg-white/40 dark:bg-gray-800/40 backdrop-blur-lg border-white/30 dark:border-gray-600/30 shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-bold">أعضاء العائلة</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">({familyMembers.length})</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <MemberListComponent
                    members={familyMembers}
                    familyMembers={familyMembers}
                    marriages={familyMarriages}
                    searchTerm=""
                    selectedFilter="all"
                    memberListLoading={memberListLoading}
                    formMode={formMode}
                    packageData={packageData}
                    isMemberListOpen={isMemberListOpen}
                    onSearchChange={() => {}}
                    onFilterChange={() => {}}
                    onEditMember={handleEditMember}
                    onViewMember={handleViewProfile}
                    onDeleteMember={handleDeleteMember}
                    onSpouseEditAttempt={() => {}}
                    onAddMember={handleAddMember}
                    onToggleMemberList={() => setIsMemberListOpen(!isMemberListOpen)}
                    checkIfMemberIsSpouse={() => false}
                    getAdditionalInfo={() => ""}
                    getGenderColor={() => "bg-blue-500"}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العضو "{memberToDelete?.name}"؟ 
              هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بهذا العضو.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Package Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
              تطوير الباقة مطلوب
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              لقد وصلت للحد الأقصى المسموح في باقتك الحالية
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  الحد الأقصى: {packageData?.max_family_members || 0} عضو
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                باقتك الحالية تسمح بإضافة {packageData?.max_family_members || 0} أعضاء فقط.
              </p>
            </div>

            <p className="text-gray-600 dark:text-gray-300">
              لإضافة المزيد من أعضاء العائلة، يمكنك ترقية باقتك للحصول على المزيد من الميزات والإمكانيات.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              إلغاء
            </Button>
            <Button 
              onClick={() => {
                setShowUpgradeModal(false);
                navigate('/plan-selection');
              }} 
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="h-4 w-4 ml-2" />
              ترقية الباقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderNew;