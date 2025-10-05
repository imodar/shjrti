import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, BarChart3, ZoomIn, ZoomOut, Maximize, Minimize, TreePine, Heart, HeartCrack, Star, Sparkles, Crown, Gem, Calendar } from "lucide-react";
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
  const diagramRef = useRef<HTMLDivElement>(null);

  // Reset zoom and center when filter changes
  const handleRootMarriageChange = (value: string) => {
    setSelectedRootMarriage(value);
    setZoomLevel(1); // Reset zoom to default
    // Center both containers on next tick
    setTimeout(() => {
      if (traditionalRef.current) {
        const el = traditionalRef.current;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        el.scrollTop = 0;
      }
      if (diagramRef.current) {
        const el = diagramRef.current;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
        el.scrollTop = 0;
      }
    }, 0);
  };

  const [activeTab, setActiveTab] = useState<string>("traditional");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    const el = (activeTab === 'traditional' ? traditionalRef.current : diagramRef.current);
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
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <p>Family Tree View - UI Removed</p>
    </div>
  );
};
export default FamilyTreeView;