import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, BarChart3, ZoomIn, ZoomOut, Maximize, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";

const FamilyTreeView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lines, setLines] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
  const memberRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});

  // Fetch family tree data from database
  useEffect(() => {
    fetchFamilyTreeData();
  }, []);

  const fetchFamilyTreeData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // First get families where user is creator
      const { data: createdFamilies, error: createdFamiliesError } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', user.id);

      // Then get families where user is a member
      const { data: memberFamilies, error: memberFamiliesError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id);

      if (createdFamiliesError || memberFamiliesError) {
        console.error('Error fetching families:', createdFamiliesError || memberFamiliesError);
        return;
      }

      // Combine all family IDs
      const createdFamilyIds = createdFamilies?.map(f => f.id) || [];
      const memberFamilyIds = memberFamilies?.map(f => f.family_id) || [];
      const allFamilyIds = [...new Set([...createdFamilyIds, ...memberFamilyIds])];
      
      if (allFamilyIds.length === 0) {
        setFamilyMembers([]);
        setFamilyMarriages([]);
        setIsLoading(false);
        return;
      }

      // Fetch family tree members for user's families
      const { data: members, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .in('family_id', allFamilyIds);

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات شجرة العائلة",
          variant: "destructive"
        });
        return;
      }

      // Fetch marriages
      const { data: marriages, error: marriagesError } = await supabase
        .from('marriages')
        .select('*')
        .in('family_id', allFamilyIds);

      if (marriagesError) {
        console.error('Error fetching marriages:', marriagesError);
      }

      console.log('Fetched family members:', members);
      console.log('Fetched marriages:', marriages);
      console.log('All family IDs:', allFamilyIds);

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

  // Helper functions to organize family data
  const getFounders = () => {
    return familyMembers.filter(member => member.is_founder);
  };

  const getChildrenOf = (parentId: string) => {
    return familyMembers.filter(member => 
      member.father_id === parentId || member.mother_id === parentId
    );
  };

  const getSpouseOf = (memberId: string) => {
    return familyMembers.find(member => member.spouse_id === memberId);
  };

  const getGeneration = (member: any, visited = new Set()): number => {
    if (visited.has(member.id)) return 0;
    visited.add(member.id);
    
    if (member.is_founder) return 1;
    
    const father = familyMembers.find(m => m.id === member.father_id);
    const mother = familyMembers.find(m => m.id === member.mother_id);
    
    let maxParentGeneration = 0;
    if (father) maxParentGeneration = Math.max(maxParentGeneration, getGeneration(father, visited));
    if (mother) maxParentGeneration = Math.max(maxParentGeneration, getGeneration(mother, visited));
    
    return maxParentGeneration + 1;
  };

  const organizeByGenerations = () => {
    const generations: { [key: number]: any[] } = {};
    
    familyMembers.forEach(member => {
      const gen = getGeneration(member);
      if (!generations[gen]) generations[gen] = [];
      generations[gen].push(member);
    });
    
    return generations;
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل شجرة العائلة...</p>
        </div>
      </div>
    );
  }

  // Generate family tree structure by generations
  const generateFamilyTree = () => {
    console.log('Generating family tree with members:', familyMembers.length);
    
    if (familyMembers.length === 0) return [];
    
    const generationMap = new Map();
    
    // STEP 1: Only actual founders (is_founder = true) start as generation 1
    familyMembers.forEach(member => {
      if (member.is_founder) {
        generationMap.set(member.id, 1);
        console.log(`Setting ${member.name} as generation 1 (founder: ${member.is_founder})`);
      }
    });
    
    console.log('Initial founders:', Array.from(generationMap.entries()));
    
    // STEP 2: Assign spouses of founders to generation 1
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband_id);
      const wifeGeneration = generationMap.get(marriage.wife_id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife_id, husbandGeneration);
        const spouse = familyMembers.find(m => m.id === marriage.wife_id);
        console.log(`Setting spouse ${spouse?.name} to same generation as husband: ${husbandGeneration}`);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband_id, wifeGeneration);
        const spouse = familyMembers.find(m => m.id === marriage.husband_id);
        console.log(`Setting spouse ${spouse?.name} to same generation as wife: ${wifeGeneration}`);
      }
    });
    
    // STEP 3: Recursively assign generations based on parent-child relationships
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.father_id || member.mother_id) {
            const fatherGeneration = member.father_id ? generationMap.get(member.father_id) : undefined;
            const motherGeneration = member.mother_id ? generationMap.get(member.mother_id) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              console.log(`Setting ${member.name} as generation ${parentGeneration + 1} (child of parents)`);
              changed = true;
            }
          }
        }
      });
    }
    
    // STEP 4: Assign spouses of all members to same generation  
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband_id);
      const wifeGeneration = generationMap.get(marriage.wife_id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife_id, husbandGeneration);
        const spouse = familyMembers.find(m => m.id === marriage.wife_id);
        console.log(`Setting spouse ${spouse?.name} to same generation as husband: ${husbandGeneration}`);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband_id, wifeGeneration);
        const spouse = familyMembers.find(m => m.id === marriage.husband_id);
        console.log(`Setting spouse ${spouse?.name} to same generation as wife: ${wifeGeneration}`);
      }
    });

    console.log('Generation map after assignments:', Array.from(generationMap.entries()));

    // Group by generation
    const generations = new Map();
    generationMap.forEach((generation, memberId) => {
      if (!generations.has(generation)) {
        generations.set(generation, []);
      }
      const member = familyMembers.find(m => m.id === memberId);
      if (member) {
        generations.get(generation).push(member);
      }
    });

    const result = Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
    console.log('Final generations structure:', result);
    return result;
  };

  // Generate family tree structure using useMemo to prevent re-calculation on every render
  const familyTree = React.useMemo(() => {
    return generateFamilyTree();
  }, [familyMembers, familyMarriages]);

  console.log('Family tree for rendering:', familyTree);
  console.log('Family tree length:', familyTree.length);

  // تحديث الخطوط بعد تحميل المربعات
  useEffect(() => {
    if (familyTree.length === 0) return;
    
    // Wait for next tick to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      const newLines: typeof lines = [];

      familyTree.forEach(([generation, members]) => {
        members.forEach((member: any) => {
          const children = getChildrenOf(member.id);
          const fromEl = memberRefs.current[member.id];
          if (!fromEl) return;

          const fromRect = fromEl.getBoundingClientRect();
          const fromX = fromRect.left + fromRect.width / 2 + window.scrollX;
          const fromY = fromRect.bottom + window.scrollY;

          children.forEach((child) => {
            const toEl = memberRefs.current[child.id];
            if (!toEl) return;

            const toRect = toEl.getBoundingClientRect();
            const toX = toRect.left + toRect.width / 2 + window.scrollX;
            const toY = toRect.top + window.scrollY;

            newLines.push({ x1: fromX, y1: fromY, x2: toX, y2: toY });
          });
        });
      });

      setLines(newLines);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [familyTree, familyMembers]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/family-overview')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                العودة للإدارة
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">شجرة العائلة</h1>
                <p className="text-muted-foreground mt-1">
                  عرض تفاعلي لشجرة العائلة - {familyTree.length} أجيال
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-card/50 rounded-lg p-2">
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetZoom}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => navigate('/family-overview')}
                variant="outline"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                إدارة الأعضاء
              </Button>
              <Button
                onClick={() => navigate('/family-statistics')}
                variant="outline"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                الإحصائيات
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Container */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="traditional" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="traditional">العرض التقليدي</TabsTrigger>
            <TabsTrigger value="diagram">العرض التخطيطي</TabsTrigger>
          </TabsList>
          
          {/* Traditional Tree View */}
          <TabsContent value="traditional">
            <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-primary/20 p-6 min-h-[600px] overflow-auto">
              <div 
                className="transition-transform duration-300"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                {(() => {
                  console.log('Rendering check - familyTree.length:', familyTree.length);
                  console.log('familyTree content:', familyTree);
                  
                  if (familyTree.length > 0) {
                    console.log('Should show tree structure');
                    return (
                      <div className="space-y-12">
                        {familyTree.map(([generation, members]) => (
                          <div key={generation} className="text-center">
                            {/* Generation Header */}
                            <div className="mb-8">
                              <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-primary to-accent text-white">
                                الجيل {generation}
                              </Badge>
                            </div>

                            {/* Members in this generation */}
                            <div className="flex flex-wrap justify-center gap-8 mb-8">
                              {(() => {
                                const displayedMembers = new Set();
                                const memberElements = [];

                                members.forEach((member: any) => {
                                  // Skip if this member was already displayed as a spouse
                                  if (displayedMembers.has(member.id)) {
                                    return;
                                  }

                                  // Find spouse for this member
                                  const marriage = familyMarriages.find(m => 
                                    m.husband_id === member.id || m.wife_id === member.id
                                  );
                                  const spouse = marriage ? 
                                    familyMembers.find(m => m.id === (marriage.husband_id === member.id ? marriage.wife_id : marriage.husband_id)) : null;

                                  // Mark both member and spouse as displayed
                                  displayedMembers.add(member.id);
                                  if (spouse) {
                                    displayedMembers.add(spouse.id);
                                  }

                                  memberElements.push(
                                    <div key={member.id} className="flex items-center gap-4">
                                      {/* Member Card */}
                                      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:shadow-lg transition-all duration-300 min-w-[200px]">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-12 w-12">
                                            <AvatarImage src={member.image_url} />
                                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                              {member.name.slice(0, 2)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="text-right">
                                            <h3 className="font-semibold text-foreground">{member.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                              {member.is_founder && (
                                                <Badge variant="secondary" className="text-xs">مؤسس</Badge>
                                              )}
                                              <Badge variant="outline" className="text-xs">
                                                {member.gender === "male" ? "ذكر" : "أنثى"}
                                              </Badge>
                                            </div>
                                            {member.birth_date && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(member.birth_date).getFullYear()}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </Card>

                                      {/* Marriage Line and Spouse */}
                                      {spouse && (
                                        <>
                                          <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-accent"></div>
                                          
                                          {/* Spouse Card */}
                                          <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/20 hover:shadow-lg transition-all duration-300 min-w-[200px]">
                                            <div className="flex items-center gap-3">
                                              <Avatar className="h-12 w-12">
                                                <AvatarImage src={spouse.image_url} />
                                                <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                                                  {spouse.name.slice(0, 2)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="text-right">
                                                <h3 className="font-semibold text-foreground">{spouse.name}</h3>
                                                <div className="flex gap-2 mt-1">
                                                  {spouse.is_founder && (
                                                    <Badge variant="secondary" className="text-xs">مؤسس</Badge>
                                                  )}
                                                  <Badge variant="outline" className="text-xs">
                                                    {spouse.gender === "male" ? "ذكر" : "أنثى"}
                                                  </Badge>
                                                </div>
                                                {spouse.birth_date && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(spouse.birth_date).getFullYear()}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </Card>
                                        </>
                                      )}
                                    </div>
                                  );
                                });

                                return memberElements;
                              })()}
                            </div>

                            {/* Connection Line to next generation */}
                            {generation < Math.max(...familyTree.map(([gen]) => gen)) && (
                              <div className="flex justify-center">
                                <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    console.log('Should show empty state');
                    return (
                      <div className="text-center py-24">
                        <Users className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                          لا توجد شجرة عائلة بعد
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          لم يتم إنشاء أي عائلة أو إضافة أعضاء بعد. ابدأ ببناء شجرة عائلتك الآن!
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button
                            onClick={() => navigate('/family-overview')}
                            className="gap-2 bg-gradient-to-r from-primary to-accent"
                          >
                            <Users className="h-4 w-4" />
                            إدارة الأعضاء
                          </Button>
                          <Button
                            onClick={() => navigate('/family-builder')}
                            variant="outline"
                            className="gap-2"
                          >
                            <TreePine className="h-4 w-4" />
                            بناء العائلة
                          </Button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </TabsContent>

          {/* Diagram Tree View */}
          <TabsContent value="diagram">
            <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-primary/20 p-6 min-h-[600px] overflow-auto">
              <div 
                className="transition-transform duration-300 relative"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                {familyTree.length > 0 ? (
                  <div className="relative min-h-[700px] flex flex-col items-center pt-8">
                    {familyTree.map(([generation, members], genIndex) => (
                      <div key={generation} className="relative mb-20">
                        {/* Generation Members */}
                        <div className="flex justify-center items-start gap-16">
                          {(() => {
                            const displayedMembers = new Set();
                            const memberElements = [];

                            members.forEach((member: any) => {
                              if (displayedMembers.has(member.id)) return;

                              // Find spouse for this member
                              const marriage = familyMarriages.find(m => 
                                m.husband_id === member.id || m.wife_id === member.id
                              );
                              const spouse = marriage ? 
                                (marriage.husband_id === member.id ? 
                                  familyMembers.find(m => m.id === marriage.wife_id) : 
                                  familyMembers.find(m => m.id === marriage.husband_id)) : null;

                              displayedMembers.add(member.id);
                              if (spouse) displayedMembers.add(spouse.id);

                              if (generation === 1 && spouse) {
                                // For generation 1 (founders), show them as a couple
                                memberElements.push(
                                  <div key={member.id} className="relative">
                                    <div className="flex items-center justify-center w-64 h-32 rounded-full border-4 border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
                                      <div className="flex items-center gap-4">
                                        <div className="text-center">
                                          <Avatar className="h-16 w-16 mx-auto mb-2">
                                            {member.image_url ? (
                                              <AvatarImage src={member.image_url} alt={member.name} />
                                            ) : (
                                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg">
                                                {member.name.slice(0, 2)}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                          <h3 className="font-semibold text-sm">{member.name}</h3>
                                        </div>
                                        <div className="text-xl text-primary">♥</div>
                                        <div className="text-center">
                                          <Avatar className="h-16 w-16 mx-auto mb-2">
                                            {spouse.image_url ? (
                                              <AvatarImage src={spouse.image_url} alt={spouse.name} />
                                            ) : (
                                              <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-lg">
                                                {spouse.name.slice(0, 2)}
                                              </AvatarFallback>
                                            )}
                                          </Avatar>
                                          <h3 className="font-semibold text-sm">{spouse.name}</h3>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Connection lines for children */}
                                    {genIndex < familyTree.length - 1 && (
                                      <>
                                        {/* Vertical line down */}
                                        <div 
                                          className="absolute w-1 bg-gradient-to-b from-primary to-accent"
                                          style={{ 
                                            top: '100%', 
                                            left: '50%',
                                            height: '40px',
                                            transform: 'translateX(-50%)'
                                          }}
                                        ></div>
                                        
                                        {/* Horizontal line for children */}
                                        {(() => {
                                          const children = familyMembers.filter(child => 
                                            child.father_id === member.id || child.mother_id === member.id ||
                                            child.father_id === spouse.id || child.mother_id === spouse.id
                                          );
                                          
                                          if (children.length > 1) {
                                            const lineWidth = Math.max(200, (children.length - 1) * 160);
                                            return (
                                              <>
                                                <div 
                                                  className="absolute h-1 bg-gradient-to-r from-primary to-accent"
                                                  style={{ 
                                                    top: 'calc(100% + 40px)', 
                                                    left: `calc(50% - ${lineWidth/2}px)`, 
                                                    width: `${lineWidth}px` 
                                                  }}
                                                ></div>
                                                {children.map((child, childIndex) => (
                                                  <div 
                                                    key={child.id}
                                                    className="absolute w-1 h-40 bg-gradient-to-b from-accent to-primary"
                                                    style={{ 
                                                      top: 'calc(100% + 40px)', 
                                                      left: `calc(50% + ${(childIndex - (children.length-1)/2) * 160}px)`,
                                                      transform: 'translateX(-50%)'
                                                    }}
                                                  ></div>
                                                ))}
                                              </>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </>
                                    )}
                                  </div>
                                );
                              } else {
                                // For other generations, show individual cards
                                memberElements.push(
                                  <div key={member.id} className="relative text-center">
                                    <Card className={`p-4 bg-card/80 backdrop-blur-sm ${member.gender === 'female' ? 'border-accent/20' : 'border-primary/20'} min-w-[140px]`}>
                                      <Avatar className="h-14 w-14 mx-auto mb-2">
                                        {member.image_url ? (
                                          <AvatarImage src={member.image_url} alt={member.name} />
                                        ) : (
                                          <AvatarFallback className={`bg-gradient-to-br ${member.gender === 'female' ? 'from-accent/20 to-primary/20' : 'from-primary/20 to-accent/20'}`}>
                                            {member.name.slice(0, 2)}
                                          </AvatarFallback>
                                        )}
                                      </Avatar>
                                      <h3 className="font-semibold">{member.name}</h3>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                                      </Badge>
                                      {member.biography && (
                                        <p className="text-xs text-muted-foreground mt-1">{member.biography}</p>
                                      )}
                                    </Card>

                                    {/* Connection line to children */}
                                    {genIndex < familyTree.length - 1 && (
                                      (() => {
                                        const children = familyMembers.filter(child => 
                                          child.father_id === member.id || child.mother_id === member.id
                                        );
                                        if (children.length > 0) {
                                          return (
                                            <div 
                                              className="absolute left-1/2 transform -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-primary to-accent"
                                              style={{ top: '100%' }}
                                            ></div>
                                          );
                                        }
                                        return null;
                                      })()
                                    )}
                                  </div>
                                );
                              }
                            });

                            return memberElements;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24">
                    <Users className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
                      لا توجد شجرة عائلة بعد
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      ابدأ ببناء شجرة عائلتك بإضافة أول عضو
                    </p>
                    <Button
                      onClick={() => navigate('/family-overview')}
                      className="gap-2 bg-gradient-to-r from-primary to-accent"
                    >
                      <Users className="h-4 w-4" />
                      إدارة الأعضاء
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SharedFooter />
    </div>
  );
};

export default FamilyTreeView;