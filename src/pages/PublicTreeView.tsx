import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { supabase } from "@/integrations/supabase/client";
import PasswordModal from "@/components/PasswordModal";
import { SuggestEditDialog } from "@/components/SuggestEditDialog";
import { FamilyMembersList } from "@/components/FamilyMembersList";
import { FamilyStatisticsView } from "@/components/FamilyStatisticsView";
import { FamilyGalleryView } from "@/components/FamilyGalleryView";
import { PublicFamilyHeader } from "@/components/PublicFamilyHeader";
import { FamilyOverview } from "@/components/FamilyOverview";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { Users, AlertCircle, Menu, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { MemberProfileModal } from "@/components/MemberProfileModal";

interface PublicTreeViewProps {
  overrideFamilyId?: string;
}

const PublicTreeView = ({ overrideFamilyId }: PublicTreeViewProps = {}) => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("traditional");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const traditionalRef = useRef<HTMLDivElement>(null);
  
  // Suggest Edit Dialog state
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [suggestEditMemberId, setSuggestEditMemberId] = useState<string>("");
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  
  // Member Profile Modal state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Get family ID from URL parameters or props
  const familyId = overrideFamilyId || searchParams.get('familyId');

  useEffect(() => {
    if (familyId) {
      checkFamilyAccess();
    } else {
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

      // Check if password is required
      if (family.share_password) {
        setShowPasswordModal(true);
        setIsLoading(false);
      } else {
        // No password required, proceed to load data
        await loadFamilyTreeData();
      }
    } catch (error) {
      console.error('Error checking family access:', error);
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (password === familyData?.share_password) {
      setIsPasswordCorrect(true);
      setShowPasswordModal(false);
      await loadFamilyTreeData();
    } else {
      setPasswordError(true);
      setShowPasswordModal(false);
    }
  };

  const loadFamilyTreeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch family members
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      // Fetch marriages
      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select('*')
        .eq('family_id', familyId);

      if (marriagesError) {
        console.error('Error fetching marriages:', marriagesError);
      }

      setFamilyMembers(members || []);
      setFamilyMarriages(marriages || []);
      
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

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFamilyTreeData();
    setIsRefreshing(false);
  };

  // Calculate generation count
  const generationCount = useMemo(() => {
    if (familyMembers.length === 0) return 0;
    const founders = familyMembers.filter((m: any) => !m.father_id && !m.mother_id);
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

  // Handle member click for profile view
  const handleMemberClick = (member: any) => {
    setSelectedMemberId(member.id);
  };

  // Handle suggest edit
  const handleSuggestEdit = (memberId: string, memberName: string) => {
    setSuggestEditMemberId(memberId);
    setSelectedMemberName(memberName);
    setSuggestEditOpen(true);
  };

  // Handle root marriage change
  const handleRootMarriageChange = (value: string) => {
    setSelectedRootMarriage(value);
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      traditionalRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Generate family units for organizational chart
  interface FamilyUnit {
    id: string;
    type: 'married' | 'single';
    members: any[];
    generation: number;
    parentUnitId?: string;
    childUnits: string[];
  }

  const familyUnits = useMemo(() => {
    const units = new Map<string, FamilyUnit>();

    // Filter marriages if specific root is selected
    const filteredMarriages = selectedRootMarriage === "all" 
      ? familyMarriages 
      : familyMarriages.filter(m => m.id === selectedRootMarriage);

    // Create units for married couples
    filteredMarriages.forEach((marriage: any) => {
      const husband = familyMembers.find((m: any) => m.id === marriage.husband_id);
      const wife = familyMembers.find((m: any) => m.id === marriage.wife_id);

      if (husband && wife) {
        const unitId = `marriage-${marriage.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'married',
          members: [husband, wife],
          generation: 0,
          childUnits: []
        });
      }
    });

    // Create units for single members (not in any marriage)
    familyMembers.forEach((member: any) => {
      const isInMarriage = familyMarriages.some(
        (m: any) => m.husband_id === member.id || m.wife_id === member.id
      );

      if (!isInMarriage) {
        const unitId = `single-${member.id}`;
        units.set(unitId, {
          id: unitId,
          type: 'single',
          members: [member],
          generation: 0,
          childUnits: []
        });
      }
    });

    // Clean invalid links
    units.forEach((u) => {
      u.childUnits = Array.from(new Set(u.childUnits.filter((cid) => units.has(cid))));
      if (u.parentUnitId && !units.has(u.parentUnitId)) {
        u.parentUnitId = undefined;
      }
      u.generation = 0;
    });

    // Recompute generations with BFS
    const roots: string[] = [];
    units.forEach((u, id) => {
      const hasParentInUnits = u.members.some((m: any) => {
        const fatherId = m.father_id;
        const motherId = m.mother_id;
        let parentFound = false;
        units.forEach((cand) => {
          if (cand.members.some((x) => x.id === fatherId || x.id === motherId)) {
            parentFound = true;
          }
        });
        return parentFound;
      });
      if (!hasParentInUnits) roots.push(id);
    });

    const q: Array<{ id: string; gen: number }> = roots.map((id) => ({ id, gen: 0 }));
    const seen = new Set<string>();

    while (q.length) {
      const { id, gen } = q.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const u = units.get(id);
      if (!u) continue;
      u.generation = gen;

      familyMembers.forEach((member: any) => {
        const parentIds = u.members.map((mm: any) => mm.id);
        if (parentIds.includes(member.father_id) || parentIds.includes(member.mother_id)) {
          units.forEach((childUnit, childId) => {
            if (childUnit.members.some((mm: any) => mm.id === member.id)) {
              if (childId !== id) {
                childUnit.parentUnitId = id;
                childUnit.generation = gen + 1;
                if (!u.childUnits.includes(childId)) u.childUnits.push(childId);
                q.push({ id: childId, gen: gen + 1 });
              }
            }
          });
        }
      });
    }

    // Ensure we have at least one root
    let rootCount = 0;
    units.forEach((u) => { if (!u.parentUnitId) rootCount++; });
    if (rootCount === 0) {
      let minGen = Infinity;
      units.forEach((u) => { minGen = Math.min(minGen, u.generation); });
      units.forEach((u) => { if (u.generation === minGen) u.parentUnitId = undefined; });
    }

    return units;
  }, [familyMembers, familyMarriages, selectedRootMarriage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
        <GlobalHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-primary mr-4">جاري تحميل شجرة العائلة...</p>
            </div>
          </div>
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  }

  if (showPasswordModal) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
        <GlobalHeader />
        <main className="flex-1">
          <PasswordModal
            isOpen={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(false);
              setPasswordError(true);
            }}
            onSubmit={handlePasswordSubmit}
            familyName={familyData?.name || ''}
          />
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  }

  // Show error page if password is incorrect
  // Show error page if no family ID is provided
  if (!familyId && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
        <GlobalHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6 py-12">
            <div className="flex flex-col items-center justify-center relative">
              {/* Decorative background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-20 w-72 h-72 bg-destructive/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 left-20 w-72 h-72 bg-destructive/5 rounded-full blur-3xl animate-pulse delay-700"></div>
              </div>
              
              <Card className="max-w-lg w-full p-10 sm:p-12 text-center bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-2xl border-2 border-destructive/30 shadow-2xl rounded-3xl relative overflow-hidden animate-scale-in">
                {/* Top decorative line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent"></div>
                
                {/* Icon container with animation */}
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-destructive via-destructive/90 to-destructive/70 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-br from-destructive to-transparent rounded-full opacity-50 animate-ping"></div>
                    <AlertCircle className="h-12 w-12 text-destructive-foreground relative z-10" strokeWidth={2.5} />
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 border-2 border-destructive/20 rounded-full"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 border border-destructive/10 rounded-full"></div>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-destructive via-destructive/90 to-destructive/80 bg-clip-text text-transparent mb-6">
                  رابط غير صحيح
                </h2>
                
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-destructive/50 to-transparent mx-auto mb-6"></div>
                
                <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                  عذراً، يبدو أنك اتبعت رابط غير صحيح.
                </p>
                
                <p className="text-muted-foreground/80 leading-relaxed">
                  إذا كنت فعلاً قد تلقيت رابط الشجرة من أحد أقربائك، اطلب منه أن يعيد مشاركة الرابط مرة أخرى بشكل صحيح.
                </p>
                
                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent"></div>
              </Card>
            </div>
          </div>
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  }

  if (passwordError) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
        <GlobalHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center">
              <Card className="max-w-md w-full p-8 text-center bg-card/70 backdrop-blur-xl border-2 border-destructive/20 shadow-2xl">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-destructive to-destructive/80 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-10 w-10 text-destructive-foreground" />
                </div>
                
                <h2 className="text-2xl font-bold text-destructive mb-4">
                  الوصول محظور
                </h2>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  عذراً، كلمة المرور المستخدمة للشجرة <span className="font-bold">{familyData?.name}</span> غير صحيحة.
                </p>
              </Card>
            </div>
          </div>
        </main>
        <GlobalFooterSimplified />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      <GlobalHeader />
      
      <main className="flex-1 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 pt-20">
          {/* Public Family Header */}
          <div className="container mx-auto px-4">
            <PublicFamilyHeader
              familyData={familyData}
              familyMembers={familyMembers}
              generationCount={generationCount}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              showGallery={familyData?.share_gallery || false}
            />
          </div>
          
          {/* Main Grid Layout */}
          <div className="container mx-auto px-4 pt-2 pb-6">
            <div className="grid gap-6 items-start grid-cols-1 md:grid-cols-12">
              
              {/* Content Panel - Col-8 (Right Side in RTL) */}
              <div className="col-span-1 md:col-span-8 order-2 md:order-2">
                <Card className="relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-gray-500/10 overflow-hidden">
                  <CardContent className="relative p-6 bg-white dark:bg-gray-900">
                    {activeSection === 'overview' && (
                      <FamilyOverview 
                        familyData={familyData}
                        familyMembers={familyMembers}
                        generationCount={generationCount}
                      />
                    )}

                    {activeSection === 'tree' && (
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="hidden">
                          <TabsTrigger value="traditional">
                            العرض التقليدي
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="traditional">
                          <div ref={traditionalRef} className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-xl shadow-lg overflow-hidden">
                            {/* Filter Bar at Top */}
                            <div className="flex items-center justify-between p-4 border-b border-white/40 dark:border-gray-600/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10">
                              <div className="flex-1 max-w-md">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                  اختر الجذر
                                </label>
                                <Select value={selectedRootMarriage} onValueChange={handleRootMarriageChange}>
                                  <SelectTrigger className="w-full bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-600/50">
                                    <SelectValue placeholder="اختر زواجاً لعرضه" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-emerald-200/50 dark:border-emerald-600/50">
                                    <SelectItem value="all">عرض الشجرة الكاملة</SelectItem>
                                    {familyMarriages
                                      .filter(marriage => marriage.is_active)
                                      .map(marriage => {
                                        const husband = familyMembers.find(m => m.id === marriage.husband_id);
                                        const wife = familyMembers.find(m => m.id === marriage.wife_id);
                                        if (husband && wife) {
                                          return (
                                            <SelectItem key={marriage.id} value={marriage.id}>
                                              عائلة {husband.name} و {wife.name}
                                            </SelectItem>
                                          );
                                        }
                                        return null;
                                      })}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Zoom Controls */}
                              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-lg p-2 border border-emerald-200/30 dark:border-emerald-700/30">
                                <Button variant="ghost" size="sm" onClick={handleZoomOut} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                  <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-sm min-w-[3rem] text-center font-medium">
                                  {Math.round(zoomLevel * 100)}%
                                </span>
                                <Button variant="ghost" size="sm" onClick={handleZoomIn} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleToggleFullscreen} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Tree Content Area */}
                            <div className="p-4 min-h-[600px] overflow-auto">
                              <OrganizationalChart 
                                familyUnits={familyUnits} 
                                zoomLevel={zoomLevel}
                                isPublicView={true}
                                onSuggestEdit={handleSuggestEdit}
                                marriages={familyMarriages}
                                members={familyMembers}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                    
                    {activeSection === 'statistics' && (
                      <FamilyStatisticsView
                        familyMembers={familyMembers}
                        familyMarriages={familyMarriages}
                      />
                    )}
                    
                    {activeSection === 'gallery' && familyData?.share_gallery && (
                      <FamilyGalleryView
                        familyId={familyId!}
                        readOnly={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Member List - Col-4 (Left Side in RTL) */}
              <div className="col-span-1 md:col-span-4 order-1 md:order-1">
                {isMobile ? (
                  <Drawer open={isMemberListOpen} onOpenChange={setIsMemberListOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        عرض قائمة الأعضاء ({familyMembers.length})
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="h-[80vh] flex flex-col">
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
                  <Card className="bg-white dark:bg-gray-900 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-2xl ring-1 ring-white/10 dark:ring-gray-500/10 overflow-hidden sticky top-4">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-border/50">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          أعضاء العائلة ({familyMembers.length})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100vh-16rem)] p-4">
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

export default PublicTreeView;
