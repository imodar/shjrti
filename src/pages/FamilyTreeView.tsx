import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, BarChart3, ZoomIn, ZoomOut, Maximize, Minimize, TreePine, Heart, HeartCrack, Star, Crown, Gem, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { FamilyHeader } from "@/components/FamilyHeader";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import FamilyTreeViewSkeleton from "@/components/skeletons/FamilyTreeViewSkeleton";
const FamilyTreeView = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const {
    hasAIFeatures
  } = useSubscription();
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [selectedRootMarriage, setSelectedRootMarriage] = useState<string>("all");

  const traditionalRef = useRef<HTMLDivElement>(null);

  // Reset zoom and center when filter changes
  const handleRootMarriageChange = (value: string) => {
    setSelectedRootMarriage(value);
    setZoomLevel(1); // Reset zoom to default
    // Center container on next tick
    setTimeout(() => {
      if (traditionalRef.current) {
        const el = traditionalRef.current;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        el.scrollTop = 0;
      }
    }, 0);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    const el = traditionalRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      (el as any).requestFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
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
      const {
        data: family,
        error: familyError
      } = await supabase.from('families').select('id, name, creator_id').eq('id', familyId).eq('creator_id', user.id).single();
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
      setFamilyData(family);

      // Fetch family tree members for the specific family only
      const {
        data: members,
        error: membersError
      } = await supabase.from('family_tree_members').select('*').eq('family_id', familyId);
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
      const {
        data: marriages,
        error: marriagesError
      } = await supabase.from('marriages').select('*').eq('family_id', familyId);
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
          const parentUnit = fatherId ? getUnitByMemberId(fatherId, units) : motherId ? getUnitByMemberId(motherId, units) : undefined;
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
    return <div key={groupIndex} className="relative flex flex-col items-center mx-8">
        {/* Connection line from parent */}
        <div className="absolute -top-6 left-1/2 w-px h-6 bg-gradient-to-b from-emerald-400 to-transparent"></div>
        
        {/* Sibling group container */}
        <div className="relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-4 border border-emerald-200/30 dark:border-emerald-600/30">
          <div className="flex gap-6 justify-center items-center">
            {siblingGroup.map((unit, unitIndex) => <div key={unit.id} className="relative">
                {renderFamilyUnit(unit)}
                
                {/* Connection line between siblings (horizontal) */}
                {unitIndex < siblingGroup.length - 1 && <div className="absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-emerald-400 to-emerald-300"></div>}
              </div>)}
          </div>
          
          {/* Family group label */}
          <div className="text-center mt-2">
            <Badge variant="outline" className="text-xs bg-emerald-50/50 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-600">
              {getParentFamilyName()}
            </Badge>
          </div>
        </div>
      </div>;
  };
  const renderFamilyUnit = (unit: FamilyUnit) => {
    if (unit.type === 'married' && unit.members.length === 2) {
      const [husband, wife] = unit.members;
      return <div key={unit.id} className="text-center">
          <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 min-w-[200px]">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-1">
                  {wife.image_url ? <AvatarImage src={wife.image_url} alt={wife.name} /> : <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-pink-600/20">
                      {wife.name.slice(0, 2)}
                    </AvatarFallback>}
                </Avatar>
                <p className="text-sm font-medium">{wife.name}</p>
              </div>
              {husband.marital_status === 'divorced' || wife.marital_status === 'divorced' ? <HeartCrack className="h-6 w-6 text-gray-500 mx-2" /> : <Heart className="h-6 w-6 text-pink-500 mx-2" />}
              <div className="text-center">
                <Avatar className="h-12 w-12 mx-auto mb-1">
                  {husband.image_url ? <AvatarImage src={husband.image_url} alt={husband.name} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                      {husband.name.slice(0, 2)}
                    </AvatarFallback>}
                </Avatar>
                <p className="text-sm font-medium">{husband.name}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              عائلة متزوجة
            </Badge>
          </Card>
        </div>;
    } else {
      const member = unit.members[0];
      return <div key={unit.id} className="text-center">
          <Card className={`p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[140px]`}>
            <Avatar className="h-14 w-14 mx-auto mb-2">
              {member.image_url ? <AvatarImage src={member.image_url} alt={member.name} /> : <AvatarFallback className={`bg-gradient-to-br from-accent/20 to-accent/40`}>
                  {member.name.slice(0, 2)}
                </AvatarFallback>}
            </Avatar>
            <h3 className="font-semibold">{member.name}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {member.gender === 'male' ? 'ذكر' : 'أنثى'}
            </Badge>
            {member.birth_date && <p className="text-xs text-muted-foreground mt-1">
                {new Date(member.birth_date).getFullYear()}
              </p>}
          </Card>
        </div>;
    }
  };
  const renderMember = (member: any, showRelation = false) => {
    const initials = member.name.slice(0, 2);
    const genderVariant = member.gender === 'female' ? 'accent' : 'primary';
    return <div key={member.id} className="text-center">
        <Card className={`p-4 bg-card/80 backdrop-blur-sm border-${genderVariant}/20 min-w-[140px]`}>
          <Avatar className="h-14 w-14 mx-auto mb-2">
            {member.image_url ? <AvatarImage src={member.image_url} alt={member.name} /> : <AvatarFallback className={`bg-gradient-to-br from-${genderVariant}/20 to-accent/20`}>
                {initials}
              </AvatarFallback>}
          </Avatar>
          <h3 className="font-semibold">{member.name}</h3>
          <Badge variant="outline" className="text-xs mt-1">
            {member.gender === 'male' ? 'ذكر' : 'أنثى'}
          </Badge>
          {showRelation && member.biography && <p className="text-xs text-muted-foreground mt-1">{member.biography}</p>}
          {member.birth_date && <p className="text-xs text-muted-foreground mt-1">
              {new Date(member.birth_date).getFullYear()}
            </p>}
        </Card>
      </div>;
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <FamilyTreeViewSkeleton />
        </div>
        <GlobalFooter />
      </div>;
  }

  // Generate family tree structure using family units with proper cousin grouping
  const generateFamilyTree = () => {
    console.log('Generating family tree with members:', familyMembers.length);
    if (familyMembers.length === 0) return {
      tree: [],
      units: new Map()
    };

    // Create family units
    const units = createFamilyUnits();

    // Assign generations to units first (establishes parent-child relationships)
    assignGenerationsToUnits(units);

    // Filter units based on selected root marriage AFTER relationships are established
    if (selectedRootMarriage !== "all") {
      const rootMarriage = familyMarriages.find(m => m.id === selectedRootMarriage);
      if (rootMarriage) {
        const filteredUnits = new Map<string, FamilyUnit>();
        const rootUnitId = `married_${rootMarriage.id}`;
        
        // Function to collect descendants recursively
        const collectDescendants = (unitId: string, visited = new Set<string>()) => {
          if (visited.has(unitId)) return;
          visited.add(unitId);
          
          const unit = units.get(unitId);
          if (unit) {
            filteredUnits.set(unitId, unit);
            // Now childUnits should be populated
            unit.childUnits.forEach(childId => collectDescendants(childId, visited));
          }
        };
        
        // Start from root marriage and collect all descendants
        collectDescendants(rootUnitId);
        
        // Update units to only filtered ones - preserve the relationships
        const originalUnits = new Map(units);
        units.clear();
        filteredUnits.forEach((unit, id) => {
          units.set(id, unit);
        });
        
        console.log(`Filtered to ${filteredUnits.size} units from original ${originalUnits.size} units`);

        // Clean up parent/child references to only include ids within filtered set
        units.forEach((unit) => {
          if (unit.parentUnitId && !units.has(unit.parentUnitId)) {
            unit.parentUnitId = undefined;
          }
          unit.childUnits = unit.childUnits.filter((id) => units.has(id));
        });

        // Recompute generations starting from selected root so layout algorithms find a root
        units.forEach((u) => { u.generation = 0; });
        if (units.has(rootUnitId)) {
          const q: Array<{ id: string; gen: number }> = [{ id: rootUnitId, gen: 1 }];
          const seen = new Set<string>();
          while (q.length) {
            const { id, gen } = q.shift()!;
            if (seen.has(id)) continue;
            seen.add(id);
            const u = units.get(id);
            if (!u) continue;
            u.generation = gen;
            u.childUnits.forEach((cid) => { if (units.has(cid)) q.push({ id: cid, gen: gen + 1 }); });
          }
        }
      }
    }

    // Ensure generations exist in the current subset
    let hasAnyGeneration = false;
    units.forEach(u => { if (u.generation > 0) hasAnyGeneration = true; });

    if (!hasAnyGeneration) {
      // Determine roots: selected root marriage if provided, otherwise units without parents
      const roots: string[] = [];
      if (selectedRootMarriage !== "all") {
        const rm = familyMarriages.find(m => m.id === selectedRootMarriage);
        if (rm) roots.push(`married_${rm.id}`);
      }
      if (roots.length === 0) {
        units.forEach((u, id) => { if (!u.parentUnitId) roots.push(id); });
      }

      // Reset generations and BFS assign
      units.forEach(u => { u.generation = 0; });
      const queue: Array<{ id: string; gen: number }> = roots.map(id => ({ id, gen: 1 }));
      const visited = new Set<string>();
      while (queue.length) {
        const { id, gen } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const u = units.get(id);
        if (!u) continue;
        u.generation = gen;
        u.childUnits.forEach(cid => { if (units.has(cid)) queue.push({ id: cid, gen: gen + 1 }); });
      }
    }

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
    return {
      tree: result,
      units
    };
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
  return <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden" dir="rtl">
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
        {/* Family Header */}
        {familyData && <div className="container mx-auto px-4">
            <FamilyHeader familyData={familyData} familyId={familyId || ''} familyMembers={familyMembers} generationCount={Math.max(...familyTree.map(group => group.generation || 0)) + 1} onSettingsClick={() => navigate(`/family-builder-new?family=${familyId}&settings=true`)} />
          </div>}
        
        {/* Hero Section */}
        <section className="pt-4 pb-8 relative">
          <div className="container mx-auto px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">

                  {/* Center: Title */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <TreePine className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        {t('familyTree')}
                      </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {t('familyTreeDescription')}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* البحث الذكي - يظهر فقط إذا كانت ميزات الـ AI مفعلة */}
            {hasAIFeatures && <div className="mb-8 max-w-3xl mx-auto">
                <SmartSearchBar familyId={familyMembers[0]?.family_id || ''} onResultSelect={handleSearchResultSelect} placeholder="ابحث في شجرة العائلة... (مثال: ابن عم أحمد من ناحية الأب)" />
              </div>}


            {/* الشريط الجانبي والمحتوى الرئيسي */}
            <div className={`grid gap-6 mb-8 ${hasAIFeatures ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
              {/* لوحة الاقتراحات الذكية - تظهر فقط إذا كانت ميزات الـ AI مفعلة */}
              {hasAIFeatures && <div className="lg:col-span-1">
                  <SuggestionPanel familyId={familyMembers[0]?.family_id || ''} className="sticky top-4" />
                </div>}

              {/* شجرة العائلة */}
              <div className={hasAIFeatures ? "lg:col-span-3" : "col-span-1"}>
                {/* Tree Container */}
                <div className="w-full">
                <div ref={traditionalRef} className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-xl shadow-lg overflow-hidden">
                  {/* Filter Bar at Top */}
                  <div className="flex items-center justify-between p-4 border-b border-white/40 dark:border-gray-600/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10">
                    <div className="flex-1 max-w-md">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        اختر جذر الشجرة
                      </label>
                      <Select value={selectedRootMarriage} onValueChange={handleRootMarriageChange}>
                        <SelectTrigger className="w-full bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-600/50">
                          <SelectValue placeholder="اختر الزواج كجذر للشجرة" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-emerald-200/50 dark:border-emerald-600/50">
                          <SelectItem value="all">عرض الشجرة كاملة</SelectItem>
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
                      marriages={familyMarriages}
                      members={familyMembers}
                    />
                  </div>
                </div>

                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>;
};
export default FamilyTreeView;