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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-muted/20" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-primary mr-4">جاري تحميل شجرة العائلة...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  if (showPasswordModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-muted/20" dir="rtl">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-muted/20" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full p-8 text-center bg-card/70 backdrop-blur-xl border-2 border-destructive/20 shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-destructive to-destructive/80 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="h-10 w-10 text-destructive-foreground" />
              </div>
              
              <h2 className="text-2xl font-bold text-destructive mb-4">
                الوصول محظور
              </h2>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
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
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-muted/20" dir="rtl">
      <GlobalHeader />
      
      <main className="container mx-auto px-4 sm:px-6 pt-4 pb-8">
        {/* Family Header Section */}
        <section className="py-2 relative mb-6">
          <div className="mb-2 relative">
            {/* Main Content Container */}
            <div className="relative w-full mx-auto">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-card/30 backdrop-blur-xl border border-border rounded-2xl py-3 px-4 shadow-xl ring-1 ring-border/10">
                <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
                  {/* Left: Avatar & Title */}
                  <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                    {/* Family Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-40 animate-pulse"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/30 dark:border-gray-700/30">
                        <TreePine className="h-6 w-6 text-white" />
                      </div>
                      {/* Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      </div>
                    </div>
                    
                    {/* Family Name */}
                    <div className="text-right">
                      <h1 className="text-base sm:text-lg md:text-xl font-bold">
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                          عائلة {familyData?.name || 'شجرة العائلة'}
                        </span>
                      </h1>
                      {familyData?.description && (
                        <div 
                          className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: familyData.description }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Stats & Zoom Controls */}
                  <div className="flex items-center gap-3">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="font-medium">{familyMembers.length}</span>
                      </div>
                      <div className="w-1 h-1 bg-border rounded-full"></div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded-full text-xs">
                        <Crown className="h-3 w-3 text-amber-600" />
                        <span className="font-medium text-amber-600">{familyTree.length}</span>
                      </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 bg-card/50 backdrop-blur-xl rounded-lg p-1 border border-border/30">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                      <div className="h-4 w-px bg-border"></div>
                      <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs min-w-[2.5rem] text-center font-medium px-1">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-8 w-8 p-0">
                        <Maximize className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-emerald-300/40 dark:border-emerald-700/40"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-emerald-300/40 dark:border-emerald-700/40"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Tabs */}
        <div className="w-full">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className={`grid w-full ${familyData?.share_gallery ? 'grid-cols-5' : 'grid-cols-4'} mb-6 bg-card/70 backdrop-blur-xl border border-border rounded-xl p-1.5`}>
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all">
                <TreePine className="ml-2 h-4 w-4" />
                نبذة
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all">
                <Users className="ml-2 h-4 w-4" />
                الأعضاء
              </TabsTrigger>
              <TabsTrigger value="tree" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all">
                <TreePine className="ml-2 h-4 w-4" />
                الشجرة
              </TabsTrigger>
              <TabsTrigger value="statistics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <BarChart3 className="ml-2 h-4 w-4" />
                الإحصائيات
              </TabsTrigger>
              {familyData?.share_gallery && (
                <TabsTrigger value="gallery" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all">
                  <Images className="ml-2 h-4 w-4" />
                  الألبوم
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card className="bg-card/70 backdrop-blur-xl border-border shadow-lg">
                <div className="p-6">
                  <FamilyOverviewStats
                    familyData={familyData}
                    familyMembers={familyMembers}
                    familyMarriages={familyMarriages}
                    generationCount={Math.max(...(familyTree.length > 0 ? familyTree.map((_, i) => i + 1) : [1]))}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card className="bg-card/70 backdrop-blur-xl border-border shadow-lg">
                <div className="p-6">
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
              </Card>
            </TabsContent>
            
            {/* Tree Tab */}
            <TabsContent value="tree">
              <Card className="bg-card/70 backdrop-blur-xl border-border shadow-lg">
                <div className="p-6 min-h-[600px] overflow-auto">
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
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics">
              <Card className="bg-card/70 backdrop-blur-xl border-border shadow-lg">
                <div className="p-6">
                  <FamilyStatisticsView
                    familyMembers={familyMembers}
                    familyMarriages={familyMarriages}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            {familyData?.share_gallery && (
              <TabsContent value="gallery">
                <Card className="bg-card/70 backdrop-blur-xl border-border shadow-lg">
                  <div className="p-6">
                    <FamilyGalleryView 
                      familyId={familyId!} 
                      readOnly={true} 
                    />
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
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