import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Users, 
  BarChart3, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  TreePine, 
  Heart,
  Star,
  Sparkles,
  Crown,
  Gem,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";

const FamilyTreeView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasAIFeatures } = useSubscription();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [user, setUser] = useState<any>(null);
  
  // Get family ID from URL parameters
  const familyId = searchParams.get('family');

  // Fetch family tree data from database
  useEffect(() => {
    fetchFamilyTreeData();
  }, [familyId]);

  const fetchFamilyTreeData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // If no family ID is provided, redirect to dashboard
      if (!familyId) {
        navigate('/dashboard');
        return;
      }

      // Verify user has access to this family (either as creator or member)
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('id, name, creator_id')
        .eq('id', familyId)
        .eq('creator_id', user.id)
        .single();

      if (familyError || !family) {
        console.error('Error accessing family or family not found:', familyError);
        toast({
          title: "خطأ",
          description: "لا يمكن الوصول إلى شجرة العائلة المطلوبة",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

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

      console.log('Fetched family members:', members);
      console.log('Fetched marriages:', marriages);
      console.log('Family ID:', familyId);

      setFamilyMembers(members || []);
      setFamilyMarriages(marriages || []);
      
    } catch (error) {
      console.error('Error fetching family tree data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

    console.log('Creating family units from members:', familyMembers.length);

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
          console.log(`Created married unit: ${husband.name} & ${wife.name}`);
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
        console.log(`Created single unit: ${member.name}`);
      }
    });

    console.log('Created units:', units.size);
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
    console.log('Assigning generations to units...');

    // Step 1: Find founder units (units containing founders)
    const founderUnits: string[] = [];
    units.forEach((unit, unitId) => {
      if (unit.members.some(m => m.is_founder)) {
        unit.generation = 1;
        founderUnits.push(unitId);
        console.log(`Set ${unit.members.map(m => m.name).join(' & ')} as generation 1 (founder unit)`);
      }
    });

    // Step 2: Establish parent-child relationships between units
    units.forEach((unit, unitId) => {
      unit.members.forEach(member => {
        if (member.father_id || member.mother_id) {
          // Find parent unit
          const fatherId = member.father_id;
          const motherId = member.mother_id;
          
          const parentUnit = fatherId ? getUnitByMemberId(fatherId, units) : 
                           motherId ? getUnitByMemberId(motherId, units) : undefined;
          
          if (parentUnit && parentUnit.id !== unitId) {
            unit.parentUnitId = parentUnit.id;
            if (!parentUnit.childUnits.includes(unitId)) {
              parentUnit.childUnits.push(unitId);
            }
            console.log(`Connected ${unit.members.map(m => m.name).join(' & ')} to parent ${parentUnit.members.map(m => m.name).join(' & ')}`);
          }
        }
      });
    });

    // Step 3: Assign generations based on parent-child relationships
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
            console.log(`Set ${unit.members.map(m => m.name).join(' & ')} as generation ${unit.generation}`);
            changed = true;
          }
        }
      });
    }

    console.log('Generation assignment completed after', iterations, 'iterations');
  };

  // Group siblings together by their common parent for proper cousin visualization
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

    // Return grouped siblings and orphan units
    const result = Array.from(parentGroups.values());
    if (orphanUnits.length > 0) {
      result.push(orphanUnits);
    }
    return result;
  };

  // Render a group of siblings with proper spacing and connection lines
  const renderSiblingGroup = (siblingGroup: FamilyUnit[], groupIndex: number, allUnits: Map<string, FamilyUnit>) => {
    // Get the parent family name based on the first unit's parent
    const getParentFamilyName = () => {
      if (siblingGroup.length > 0 && siblingGroup[0].parentUnitId) {
        const parentUnit = allUnits.get(siblingGroup[0].parentUnitId);
        if (parentUnit) {
          if (parentUnit.type === 'married' && parentUnit.members.length === 2) {
            const [husband, wife] = parentUnit.members;
            return `عائلة ${husband.name}`;
          } else if (parentUnit.members.length === 1) {
            return `عائلة ${parentUnit.members[0].name}`;
          }
        }
      }
      return `مجموعة أسرية ${groupIndex + 1}`;
    };

    return (
      <div key={groupIndex} className="relative flex flex-col items-center mx-8">
        {/* Connection line from parent */}
        <div className="absolute -top-6 left-1/2 w-px h-6 bg-gradient-to-b from-emerald-400 to-transparent"></div>
        
        {/* Sibling group container */}
        <div className="relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-4 border border-emerald-200/30 dark:border-emerald-600/30">
          <div className="flex gap-6 justify-center items-center">
            {siblingGroup.map((unit, unitIndex) => (
              <div key={unit.id} className="relative">
                {renderFamilyUnit(unit)}
                
                {/* Connection line between siblings (horizontal) */}
                {unitIndex < siblingGroup.length - 1 && (
                  <div className="absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-emerald-400 to-emerald-300"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Family group label */}
          <div className="text-center mt-2">
            <Badge variant="outline" className="text-xs bg-emerald-50/50 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-600">
              {getParentFamilyName()}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const renderFamilyUnit = (unit: FamilyUnit) => {
    if (unit.type === 'married' && unit.members.length === 2) {
      const [husband, wife] = unit.members;
      return (
        <div key={unit.id} className="text-center">
          <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 min-w-[200px]">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-1">
                  {husband.image_url ? (
                    <AvatarImage src={husband.image_url} alt={husband.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                      {husband.name.slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <p className="text-sm font-medium">{husband.name}</p>
              </div>
              <Heart className="h-6 w-6 text-pink-500 mx-2" />
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-1">
                  {wife.image_url ? (
                    <AvatarImage src={wife.image_url} alt={wife.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-pink-600/20">
                      {wife.name.slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <p className="text-sm font-medium">{wife.name}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              عائلة متزوجة
            </Badge>
          </Card>
        </div>
      );
    } else {
      const member = unit.members[0];
      return (
        <div key={unit.id} className="text-center">
          <Card className={`p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[140px]`}>
            <Avatar className="h-14 w-14 mx-auto mb-2">
              {member.image_url ? (
                <AvatarImage src={member.image_url} alt={member.name} />
              ) : (
                <AvatarFallback className={`bg-gradient-to-br from-accent/20 to-accent/40`}>
                  {member.name.slice(0, 2)}
                </AvatarFallback>
              )}
            </Avatar>
            <h3 className="font-semibold">{member.name}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {member.gender === 'male' ? 'ذكر' : 'أنثى'}
            </Badge>
            {member.birth_date && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(member.birth_date).getFullYear()}
              </p>
            )}
          </Card>
        </div>
      );
    }
  };

  const renderMember = (member: any, showRelation = false) => {
    const initials = member.name.slice(0, 2);
    const genderVariant = member.gender === 'female' ? 'accent' : 'primary';
    
    return (
      <div key={member.id} className="text-center">
        <Card className={`p-4 bg-card/80 backdrop-blur-sm border-${genderVariant}/20 min-w-[140px]`}>
          <Avatar className="h-14 w-14 mx-auto mb-2">
            {member.image_url ? (
              <AvatarImage src={member.image_url} alt={member.name} />
            ) : (
              <AvatarFallback className={`bg-gradient-to-br from-${genderVariant}/20 to-accent/20`}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <h3 className="font-semibold">{member.name}</h3>
          <Badge variant="outline" className="text-xs mt-1">
            {member.gender === 'male' ? 'ذكر' : 'أنثى'}
          </Badge>
          {showRelation && member.biography && (
            <p className="text-xs text-muted-foreground mt-1">{member.biography}</p>
          )}
          {member.birth_date && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(member.birth_date).getFullYear()}
            </p>
          )}
        </Card>
      </div>
    );
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

  // Generate family tree structure using family units with proper cousin grouping
  const generateFamilyTree = () => {
    console.log('Generating family tree with members:', familyMembers.length);
    
    if (familyMembers.length === 0) return { tree: [], units: new Map() };
    
    // Create family units
    const units = createFamilyUnits();
    
    // Assign generations to units
    assignGenerationsToUnits(units);
    
    // Group units by generation with sibling grouping
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

    // For each generation, group siblings together
    generationUnits.forEach((units, generation) => {
      const siblingGroups = groupSiblingsByParent(units);
      generations.set(generation, siblingGroups);
    });

    const result = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    console.log('Final family tree structure with sibling groups:', result);
    return { tree: result, units };
  };

  const familyTreeData = generateFamilyTree();
  const familyTree = familyTreeData.tree;
  const familyUnits = familyTreeData.units;
  console.log('Family tree for rendering:', familyTree);
  console.log('Family tree length:', familyTree.length);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleSearchResultSelect = (member: any) => {
    console.log('Selected member from search:', member);
    // يمكن إضافة منطق للتنقل إلى العضو في شجرة العائلة
    toast({
      title: "تم اختيار العضو",
      description: `تم اختيار ${member.name} من نتائج البحث`,
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
      <GlobalHeader />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Floating Animated Icons */}
      <div className="absolute top-32 right-20 animate-float">
        <Heart className="h-10 w-10 text-pink-400 opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-float-delayed">
        <Users className="h-12 w-12 text-emerald-400 opacity-40" />
      </div>
      <div className="absolute top-1/2 left-10 animate-float-slow">
        <Star className="h-8 w-8 text-yellow-400 opacity-60" />
      </div>

      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="py-8 relative">
          <div className="container mx-auto px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Back Button */}
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    العودة للوحة الإدارة
                  </Button>

                  {/* Center: Title */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <TreePine className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        شجرة العائلة
                      </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      عرض تفاعلي وجميل لشجرة عائلتك - {familyTree.length} عائلة
                    </p>
                  </div>

                  {/* Right: Zoom Controls & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
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
                      <Button variant="ghost" size="sm" onClick={handleResetZoom} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                      >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">إدارة الأعضاء</span>
                        <span className="sm:hidden">الأعضاء</span>
                      </Button>
                      <Button
                        onClick={() => navigate('/family-statistics')}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">الإحصائيات</span>
                        <span className="sm:hidden">الإحصائيات</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* البحث الذكي - يظهر فقط إذا كانت ميزات الـ AI مفعلة */}
            {hasAIFeatures && (
              <div className="mb-8 max-w-3xl mx-auto">
                <SmartSearchBar
                  familyId={familyMembers[0]?.family_id || ''}
                  onResultSelect={handleSearchResultSelect}
                  placeholder="ابحث في شجرة العائلة... (مثال: ابن عم أحمد من ناحية الأب)"
                />
              </div>
            )}

            {/* الشريط الجانبي والمحتوى الرئيسي */}
            <div className={`grid gap-6 mb-8 ${hasAIFeatures ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {/* لوحة الاقتراحات الذكية - تظهر فقط إذا كانت ميزات الـ AI مفعلة */}
              {hasAIFeatures && (
                <div className="lg:col-span-1">
                  <SuggestionPanel
                    familyId={familyMembers[0]?.family_id || ''}
                    className="sticky top-4"
                  />
                </div>
              )}

              {/* شجرة العائلة */}
              <div className={hasAIFeatures ? "lg:col-span-3" : "col-span-1"}>
                {/* Tree Container */}
                <Tabs defaultValue="traditional" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-xl p-2">
                <TabsTrigger value="traditional" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                  <TreePine className="ml-2 h-4 w-4" />
                  العرض التقليدي
                </TabsTrigger>
                <TabsTrigger value="diagram" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                  <Sparkles className="ml-2 h-4 w-4" />
                  العرض التخطيطي
                </TabsTrigger>
              </TabsList>
              
              {/* Traditional Tree View - Organizational Chart Style */}
              <TabsContent value="traditional">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 min-h-[600px] overflow-auto shadow-xl">
                  <OrganizationalChart 
                    familyUnits={familyUnits} 
                    zoomLevel={zoomLevel} 
                  />
                </div>
              </TabsContent>

              {/* Diagram Tree View - Enhanced for Cousin Visualization */}
              <TabsContent value="diagram">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 min-h-[600px] overflow-auto shadow-xl">
                  <div 
                    className="transition-transform duration-300 relative"
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  >
                    {familyTree.length > 0 ? (
                      <div className="relative min-h-[700px] flex flex-col items-center pt-8 space-y-24">
                        {familyTree.map(([generation, siblingGroups], genIndex) => (
                          <div key={generation} className="relative w-full">
                            {/* Generation Header */}
                            <div className="text-center mb-16">
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl"></div>
                                <Badge className="relative text-lg px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0">
                                  <Crown className="h-5 w-5 mr-2" />
                                  الجيل {generation}
                                </Badge>
                              </div>
                            </div>

                            {/* All Cousin Groups in Same Row */}
                            <div className="flex justify-center items-start gap-20 flex-wrap min-w-max">
                              {siblingGroups.map((siblingGroup, groupIndex) => (
                                <div key={groupIndex} className="relative">
                                  {/* Family Group Container */}
                                  <div className="relative bg-gradient-to-br from-white/40 to-emerald-50/40 dark:from-gray-800/40 dark:to-emerald-900/40 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-200/50 dark:border-emerald-600/50 shadow-lg">
                                     {/* Family Group Label */}
                                     <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                       <Badge className="bg-gradient-to-r from-emerald-400 to-teal-400 text-white text-xs px-3 py-1 shadow-md">
                                         {(() => {
                                           // Get parent family name based on the first unit's parent
                                           if (siblingGroup.length > 0 && siblingGroup[0].parentUnitId) {
                                             const parentUnit = familyUnits.get(siblingGroup[0].parentUnitId);
                                             if (parentUnit) {
                                               if (parentUnit.type === 'married' && parentUnit.members.length === 2) {
                                                 const [husband, wife] = parentUnit.members;
                                                 return `عائلة ${husband.name}`;
                                               } else if (parentUnit.members.length === 1) {
                                                 return `عائلة ${parentUnit.members[0].name}`;
                                               }
                                             }
                                           }
                                           return `عائلة ${groupIndex + 1}`;
                                         })()}
                                       </Badge>
                                     </div>

                                    {/* Connection Line from Parent */}
                                    {generation > 1 && (
                                      <div className="absolute -top-12 left-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-transparent rounded-full transform -translate-x-1/2"></div>
                                    )}

                                    {/* Siblings Row */}
                                    <div className="flex gap-8 items-center justify-center pt-4">
                                      {siblingGroup.map((unit: FamilyUnit, unitIndex) => (
                                        <div key={unit.id} className="relative">
                                          {unit.type === 'married' && unit.members.length === 2 ? (
                                            // Married Couple Display
                                            <div className="relative">
                                              <div className="flex items-center justify-center w-72 h-36 rounded-2xl border-3 border-pink-300/60 bg-gradient-to-r from-pink-100/80 to-rose-100/80 dark:from-pink-900/40 dark:to-rose-900/40 backdrop-blur-xl shadow-2xl">
                                                <div className="flex items-center gap-4">
                                                  <div className="text-center">
                                                    <Avatar className="h-16 w-16 mx-auto mb-2 ring-3 ring-pink-300/50">
                                                      {unit.members[0].image_url ? (
                                                        <AvatarImage src={unit.members[0].image_url} alt={unit.members[0].name} />
                                                      ) : (
                                                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-lg font-bold">
                                                          {unit.members[0].name.slice(0, 2)}
                                                        </AvatarFallback>
                                                      )}
                                                    </Avatar>
                                                    <h3 className="font-bold text-xs text-emerald-700 dark:text-emerald-300">{unit.members[0].name}</h3>
                                                  </div>
                                                  <Heart className="h-6 w-6 text-pink-500" />
                                                  <div className="text-center">
                                                    <Avatar className="h-16 w-16 mx-auto mb-2 ring-3 ring-teal-300/50">
                                                      {unit.members[1].image_url ? (
                                                        <AvatarImage src={unit.members[1].image_url} alt={unit.members[1].name} />
                                                      ) : (
                                                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-lg font-bold">
                                                          {unit.members[1].name.slice(0, 2)}
                                                        </AvatarFallback>
                                                      )}
                                                    </Avatar>
                                                    <h3 className="font-bold text-xs text-teal-700 dark:text-teal-300">{unit.members[1].name}</h3>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            // Single Person Display
                                            <div className="relative">
                                              <div className="flex items-center justify-center w-40 h-36 rounded-2xl border-3 border-accent/60 bg-gradient-to-br from-accent/20 to-secondary/20 backdrop-blur-xl shadow-2xl">
                                                <div className="text-center">
                                                  <Avatar className="h-20 w-20 mx-auto mb-3 ring-3 ring-accent/50">
                                                    {unit.members[0].image_url ? (
                                                      <AvatarImage src={unit.members[0].image_url} alt={unit.members[0].name} />
                                                    ) : (
                                                      <AvatarFallback className="bg-gradient-to-br from-accent to-secondary text-white text-xl font-bold">
                                                        {unit.members[0].name.slice(0, 2)}
                                                      </AvatarFallback>
                                                    )}
                                                  </Avatar>
                                                  <h3 className="font-bold text-sm text-accent dark:text-accent">{unit.members[0].name}</h3>
                                                  <Badge variant="outline" className="text-xs mt-1">
                                                    {unit.members[0].gender === 'male' ? 'ذكر' : 'أنثى'}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Horizontal Connector Between Siblings */}
                                          {unitIndex < siblingGroup.length - 1 && (
                                            <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-300 transform -translate-y-1/2"></div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Connector Between Family Groups */}
                                  {groupIndex < siblingGroups.length - 1 && (
                                    <div className="absolute top-1/2 -right-10 w-20 h-1 bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-300 rounded-full transform -translate-y-1/2 opacity-60"></div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Connection to Next Generation */}
                            {genIndex < familyTree.length - 1 && (
                              <div className="flex justify-center mt-16">
                                <div className="w-2 h-20 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-24">
                        <div className="relative max-w-md mx-auto">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                          
                          <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-12 px-8 shadow-xl">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                              <Sparkles className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                              لا توجد شجرة عائلة بعد
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                              ابدأ ببناء شجرة عائلتك لرؤية العرض التخطيطي الجميل!
                            </p>
                            <Button
                              onClick={() => navigate('/family-builder')}
                              className="gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                            >
                              <Sparkles className="h-5 w-5" />
                              بناء العائلة
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </TabsContent>

                </Tabs>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 flex justify-center gap-6">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="gap-3 bg-white/60 hover:bg-white/80 border-emerald-200 text-emerald-600 dark:bg-gray-800/60 dark:hover:bg-gray-800/80 dark:border-emerald-700 dark:text-emerald-400"
              >
                <Users className="h-5 w-5" />
                إدارة الأعضاء
              </Button>
              <Button
                onClick={() => navigate('/family-statistics')}
                variant="outline"
                className="gap-3 bg-white/60 hover:bg-white/80 border-teal-200 text-teal-600 dark:bg-gray-800/60 dark:hover:bg-gray-800/80 dark:border-teal-700 dark:text-teal-400"
              >
                <BarChart3 className="h-5 w-5" />
                إحصائيات العائلة
              </Button>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default FamilyTreeView;