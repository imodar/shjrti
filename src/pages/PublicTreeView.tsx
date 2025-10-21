import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  TreePine, 
  Heart,
  HeartCrack,
  Star,
  Crown,
  Images,
  RefreshCw,
  AlertCircle,
  Users,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalFooter } from "@/components/GlobalFooter";
import { GlobalHeader } from "@/components/GlobalHeader";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { supabase } from "@/integrations/supabase/client";
import PasswordModal from "@/components/PasswordModal";
import { sanitizeHtml } from "@/lib/security";
import { SuggestEditDialog } from "@/components/SuggestEditDialog";
import { FamilyOverviewStats } from "@/components/FamilyOverviewStats";
import { FamilyMembersList } from "@/components/FamilyMembersList";
import { FamilyStatisticsView } from "@/components/FamilyStatisticsView";
import { FamilyGalleryView } from "@/components/FamilyGalleryView";

interface PublicTreeViewProps {
  overrideFamilyId?: string;
}

const PublicTreeView = ({ overrideFamilyId }: PublicTreeViewProps = {}) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [galleryMemories, setGalleryMemories] = useState<any[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedGenerations, setLoadedGenerations] = useState(2); // Progressive loading
  
  // Suggest Edit Dialog state
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  
  // Get family ID from URL parameters or props
  const familyId = overrideFamilyId || searchParams.get('familyId');

  useEffect(() => {
    if (familyId) {
      checkFamilyAccess();
    } else {
      toast({
        title: "خطأ",
        description: "رقم العائلة مطلوب للوصول إلى الشجرة",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [familyId]);

  const checkFamilyAccess = async () => {
    try {
      setIsLoading(true);
      
      // Check if family exists and get share password and gallery sharing
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name, description, share_password, share_gallery')
        .eq('id', familyId)
        .single();

      if (familyError || !family) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على شجرة العائلة المطلوبة",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      setFamilyData(family);

      // If family has password protection, show password modal
      if (family.share_password && !isPasswordCorrect) {
        setShowPasswordModal(true);
        setIsLoading(false);
        return;
      }

      // Load family tree data
      await loadFamilyTreeData();
      
    } catch (error) {
      console.error('Error checking family access:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في الوصول إلى البيانات",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === familyData?.share_password) {
      setIsPasswordCorrect(true);
      setShowPasswordModal(false);
      setPasswordError(false);
      loadFamilyTreeData();
    } else {
      setPasswordError(true);
      setShowPasswordModal(false);
      toast({
        title: "خطأ",
        description: "كلمة المرور غير صحيحة",
        variant: "destructive"
      });
    }
  };

  const loadFamilyTreeData = async () => {
    try {
      setIsLoading(true);

      // Fetch family tree members for the specific family only
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId);

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات شجرة العائلة",
          variant: "destructive"
        });
        return;
      }

      // Fetch marriages for the specific family only
      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);

      if (marriagesError) {
        console.error('Error fetching marriages:', marriagesError);
      }

      setFamilyMembers(members || []);
      setFamilyMarriages(marriages || []);

      // Load gallery memories if sharing is enabled
      if (familyData?.share_gallery) {
        await loadGalleryMemories();
      }
      
    } catch (error) {
      console.error('Error loading family tree data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadGalleryMemories = async () => {
    try {
      setIsLoadingGallery(true);
      
      const { data: memories, error } = await supabase
        .from('family_memories')
        .select('*')
        .eq('family_id', familyId)
        .order('photo_date', { ascending: false });

      if (error) {
        console.error('Error fetching gallery memories:', error);
        return;
      }

      setGalleryMemories(memories || []);
    } catch (error) {
      console.error('Error loading gallery memories:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('family-memories')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Family Units - Core logic for tree structure
  interface FamilyUnit {
    id: string;
    type: 'married' | 'single';
    members: any[];
    generation: number;
    parentUnitId?: string;
    childUnits: string[];
  }

  const createFamilyUnits = (): Map<string, FamilyUnit> => {
    const units = new Map<string, FamilyUnit>();
    const processedMembers = new Set<string>();

    // Step 1: Create units for married couples
    familyMarriages.forEach(marriage => {
      if (marriage.is_active) {
        const husband = familyMembers.find(m => m.id === marriage.husband_id);
        const wife = familyMembers.find(m => m.id === marriage.wife_id);
        
        if (husband && wife) {
          const unitId = `married_${marriage.id}`;
          units.set(unitId, {
            id: unitId,
            type: 'married',
            members: [husband, wife],
            generation: 0,
            childUnits: []
          });
          
          processedMembers.add(husband.id);
          processedMembers.add(wife.id);
        }
      }
    });

    // Step 2: Create units for single members
    familyMembers.forEach(member => {
      if (!processedMembers.has(member.id)) {
        const unitId = `single_${member.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'single',
          members: [member],
          generation: 0,
          childUnits: []
        });
      }
    });

    return units;
  };

  const getUnitByMemberId = (memberId: string, units: Map<string, FamilyUnit>): FamilyUnit | undefined => {
    for (const unit of units.values()) {
      if (unit.members.some(m => m.id === memberId)) {
        return unit;
      }
    }
    return undefined;
  };

  const assignGenerationsToUnits = (units: Map<string, FamilyUnit>) => {
    // Find founder units
    const founderUnits: string[] = [];
    units.forEach((unit, unitId) => {
      if (unit.members.some(m => m.is_founder)) {
        unit.generation = 1;
        founderUnits.push(unitId);
      }
    });

    // Establish parent-child relationships between units
    units.forEach((unit, unitId) => {
      unit.members.forEach(member => {
        if (member.father_id || member.mother_id) {
          const fatherId = member.father_id;
          const motherId = member.mother_id;
          
          const parentUnit = fatherId ? getUnitByMemberId(fatherId, units) : 
                           motherId ? getUnitByMemberId(motherId, units) : undefined;
          
          if (parentUnit && parentUnit.id !== unitId) {
            unit.parentUnitId = parentUnit.id;
            if (!parentUnit.childUnits.includes(unitId)) {
              parentUnit.childUnits.push(unitId);
            }
          }
        }
      });
    });

    // Assign generations based on parent-child relationships
    let changed = true;
    let iterations = 0;
    const maxIterations = 20;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      units.forEach((unit, unitId) => {
        if (unit.generation === 0 && unit.parentUnitId) {
          const parentUnit = units.get(unit.parentUnitId);
          if (parentUnit && parentUnit.generation > 0) {
            unit.generation = parentUnit.generation + 1;
            changed = true;
          }
        }
      });
    }
  };

  const groupSiblingsByParent = (familyUnits: FamilyUnit[]): FamilyUnit[][] => {
    const parentGroups = new Map<string, FamilyUnit[]>();
    const orphanUnits: FamilyUnit[] = [];

    familyUnits.forEach(unit => {
      if (unit.parentUnitId) {
        if (!parentGroups.has(unit.parentUnitId)) {
          parentGroups.set(unit.parentUnitId, []);
        }
        parentGroups.get(unit.parentUnitId)!.push(unit);
      } else {
        orphanUnits.push(unit);
      }
    });

    const result = Array.from(parentGroups.values());
    if (orphanUnits.length > 0) {
      result.push(orphanUnits);
    }
    return result;
  };

  // Generate family tree structure
  const generateFamilyTree = () => {
    if (familyMembers.length === 0) return { tree: [], units: new Map() };
    
    const units = createFamilyUnits();
    assignGenerationsToUnits(units);
    
    const generations = new Map<number, FamilyUnit[][]>();
    const generationUnits = new Map<number, FamilyUnit[]>();
    
    units.forEach(unit => {
      if (unit.generation > 0) {
        if (!generationUnits.has(unit.generation)) {
          generationUnits.set(unit.generation, []);
        }
        generationUnits.get(unit.generation)!.push(unit);
      }
    });

    generationUnits.forEach((units, generation) => {
      const siblingGroups = groupSiblingsByParent(units);
      generations.set(generation, siblingGroups);
    });

    const result = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    return { tree: result, units };
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await checkFamilyAccess();
    setIsRefreshing(false);
  }, [familyId]);

  // Touch handling for pull to refresh
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      currentY = e.touches[0].clientY;
      if (currentY - startY > 100 && window.scrollY === 0) {
        handleRefresh();
      }
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleRefresh]);

  // Progressive loading - load more generations
  const loadMoreGenerations = () => {
    setLoadedGenerations(prev => prev + 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="text-emerald-600 mr-4">جاري تحميل شجرة العائلة...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordError(true);
          }}
          onSubmit={handlePasswordSubmit}
          familyName={familyData?.name || ''}
        />
        <GlobalFooter />
      </div>
    );
  }

  // Show error page if password is incorrect
  if (passwordError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full p-8 text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-2 border-red-200 dark:border-red-800 shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                الوصول محظور
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                عذراً، كلمة المرور المستخدمة للشجرة <span className="font-bold">{familyData?.name}</span> غير صحيحة.
                <br />
                يرجى التواصل مع مالك الشجرة للحصول على كلمة المرور الصحيحة.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setPasswordError(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  إعادة المحاولة
                </Button>
              </div>
            </Card>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  const familyTreeData = generateFamilyTree();
  const familyTree = familyTreeData.tree;
  const familyUnits = familyTreeData.units;

  // Filter units by loaded generations for progressive loading
  const filteredUnits = new Map<string, FamilyUnit>();
  familyUnits.forEach((unit, id) => {
    if (unit.generation <= loadedGenerations) {
      filteredUnits.set(id, unit);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
      <GlobalHeader />
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <main className="relative z-10 pt-8">
        {/* Hero Section */}
        <section className="py-8 relative">
          <div className="container mx-auto px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Center: Title */}
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <TreePine className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {familyData?.name || 'شجرة العائلة'}
                      </h1>
                    </div>
                    {familyData?.description && (
                      <div 
                        className="text-muted-foreground mb-2"
                        dangerouslySetInnerHTML={{ __html: familyData.description }}
                      />
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      عرض عام لشجرة العائلة - {familyTree.length} جيل
                    </p>
                  </div>

                  {/* Right: Zoom Controls */}
                  <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-lg p-2 border border-emerald-200/30 dark:border-emerald-700/30">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefresh} 
                      disabled={isRefreshing}
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="h-4 w-px bg-emerald-200 dark:bg-emerald-700"></div>
                    <Button variant="ghost" size="sm" onClick={handleZoomOut} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm min-w-[3rem] text-center font-medium">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleZoomIn} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleResetZoom} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <div className="w-full">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className={`grid w-full ${familyData?.share_gallery ? 'grid-cols-5' : 'grid-cols-4'} mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-xl p-2`}>
                  <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                    <TreePine className="ml-2 h-4 w-4" />
                    نبذة
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                    <Users className="ml-2 h-4 w-4" />
                    الأعضاء
                  </TabsTrigger>
                  <TabsTrigger value="tree" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                    <TreePine className="ml-2 h-4 w-4" />
                    الشجرة
                  </TabsTrigger>
                  <TabsTrigger value="statistics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                    <BarChart3 className="ml-2 h-4 w-4" />
                    الإحصائيات
                  </TabsTrigger>
                  {familyData?.share_gallery && (
                    <TabsTrigger value="gallery" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                      <Images className="ml-2 h-4 w-4" />
                      الألبوم
                    </TabsTrigger>
                  )}
                </TabsList>
                
                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 shadow-xl">
                    <FamilyOverviewStats
                      familyData={familyData}
                      familyMembers={familyMembers}
                      familyMarriages={familyMarriages}
                      generationCount={Math.max(...(familyTree.length > 0 ? familyTree.map((_, i) => i + 1) : [1]))}
                    />
                  </div>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30 rounded-2xl p-8 shadow-xl">
                    <FamilyMembersList
                      familyMembers={familyMembers}
                      familyMarriages={familyMarriages}
                      readOnly={true}
                      onMemberClick={(member) => {
                        setSelectedMemberId(member.id);
                        setSelectedMemberName(member.name);
                        setSuggestEditOpen(true);
                      }}
                    />
                  </div>
                </TabsContent>
                
                {/* Tree Tab */}
                <TabsContent value="tree">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 min-h-[600px] overflow-auto shadow-xl">
                    {/* Progressive loading indicator */}
                    {familyTree.length > loadedGenerations && (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-center">
                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                          عرض {loadedGenerations} من {familyTree.length} جيل
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={loadMoreGenerations}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        >
                          تحميل المزيد من الأجيال
                        </Button>
                      </div>
                    )}
                    
                    <OrganizationalChart 
                      familyUnits={filteredUnits} 
                      zoomLevel={zoomLevel}
                      isPublicView={true}
                      onSuggestEdit={(memberId, memberName) => {
                        setSelectedMemberId(memberId);
                        setSelectedMemberName(memberName);
                        setSuggestEditOpen(true);
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="statistics">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 rounded-2xl p-8 shadow-xl">
                    <FamilyStatisticsView
                      familyMembers={familyMembers}
                      familyMarriages={familyMarriages}
                    />
                  </div>
                </TabsContent>

                {/* Gallery Tab */}
                {familyData?.share_gallery && (
                  <TabsContent value="gallery">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-amber-200/30 dark:border-amber-700/30 rounded-2xl p-8 shadow-xl">
                      <FamilyGalleryView 
                        familyId={familyId!} 
                        readOnly={true} 
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </section>
      </main>
      
      <GlobalFooter />

      <SuggestEditDialog
        isOpen={suggestEditOpen}
        onClose={() => setSuggestEditOpen(false)}
        familyId={familyId}
        memberId={selectedMemberId}
        memberName={selectedMemberName}
      />
    </div>
  );
};

export default PublicTreeView;