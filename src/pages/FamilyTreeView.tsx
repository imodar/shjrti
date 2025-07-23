import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";

const FamilyTreeView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  const familyTree = generateFamilyTree();
  console.log('Family tree for rendering:', familyTree);
  console.log('Family tree length:', familyTree.length);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

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
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex items-center justify-between">
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
                      عرض تفاعلي وجميل لشجرة عائلتك - {familyTree.length} أجيال
                    </p>
                  </div>

                  {/* Right: Zoom Controls & Action Buttons */}
                  <div className="flex items-center gap-3">
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
                    
                    <Button
                      onClick={() => navigate('/dashboard')}
                      variant="outline"
                      className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      <Users className="h-4 w-4" />
                      إدارة الأعضاء
                    </Button>
                    <Button
                      onClick={() => navigate('/family-statistics')}
                      variant="outline"
                      className="gap-2 border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    >
                      <BarChart3 className="h-4 w-4" />
                      الإحصائيات
                    </Button>
                  </div>
                </div>
              </div>
            </div>

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
              
              {/* Traditional Tree View */}
              <TabsContent value="traditional">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 min-h-[600px] overflow-auto shadow-xl">
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
                          <div className="space-y-16">
                            {familyTree.map(([generation, members]) => (
                              <div key={generation} className="text-center">
                                {/* Generation Header */}
                                <div className="mb-10">
                                  <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-xl"></div>
                                    <Badge className="relative text-lg px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0">
                                      <Crown className="h-5 w-5 mr-2" />
                                      الجيل {generation}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Members in this generation */}
                                <div className="flex flex-wrap justify-center gap-10 mb-12">
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
                                        <div key={member.id} className="flex items-center gap-6">
                                          {/* Member Card */}
                                          <Card className="relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 hover:shadow-2xl transition-all duration-500 min-w-[220px] group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="relative flex items-center gap-4">
                                              <Avatar className="h-16 w-16 ring-4 ring-emerald-200/50 dark:ring-emerald-700/50">
                                                <AvatarImage src={member.image_url} />
                                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-lg font-bold">
                                                  {member.name.slice(0, 2)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="text-right flex-1">
                                                <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300">{member.name}</h3>
                                                <div className="flex gap-2 mt-2 justify-end">
                                                  {member.is_founder && (
                                                    <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                                                      <Crown className="h-3 w-3 mr-1" />
                                                      مؤسس
                                                    </Badge>
                                                  )}
                                                  <Badge variant={member.gender === "male" ? "default" : "secondary"} className="text-xs">
                                                    {member.gender === "male" ? "ذكر" : "أنثى"}
                                                  </Badge>
                                                </div>
                                                {member.birth_date && (
                                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-end">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(member.birth_date).getFullYear()}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </Card>

                                          {/* Marriage Line and Spouse */}
                                          {spouse && (
                                            <>
                                              <div className="flex items-center gap-2">
                                                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                                                <Heart className="h-6 w-6 text-pink-500 animate-pulse" />
                                                <div className="w-12 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></div>
                                              </div>
                                              
                                              {/* Spouse Card */}
                                              <Card className="relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-teal-200/30 dark:border-teal-700/30 hover:shadow-2xl transition-all duration-500 min-w-[220px] group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-teal-100/50 to-emerald-100/50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                  <Avatar className="h-16 w-16 ring-4 ring-teal-200/50 dark:ring-teal-700/50">
                                                    <AvatarImage src={spouse.image_url} />
                                                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-lg font-bold">
                                                      {spouse.name.slice(0, 2)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="text-right flex-1">
                                                    <h3 className="font-bold text-lg text-teal-700 dark:text-teal-300">{spouse.name}</h3>
                                                    <div className="flex gap-2 mt-2 justify-end">
                                                      {spouse.is_founder && (
                                                        <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                                                          <Crown className="h-3 w-3 mr-1" />
                                                          مؤسس
                                                        </Badge>
                                                      )}
                                                      <Badge variant={spouse.gender === "male" ? "default" : "secondary"} className="text-xs">
                                                        {spouse.gender === "male" ? "ذكر" : "أنثى"}
                                                      </Badge>
                                                    </div>
                                                    {spouse.birth_date && (
                                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-end">
                                                        <Calendar className="h-3 w-3 mr-1" />
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
                                    <div className="w-1 h-16 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
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
                            <div className="relative max-w-md mx-auto">
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                              
                              <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-12 px-8 shadow-xl">
                                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                  <TreePine className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                                  لا توجد شجرة عائلة بعد
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-8">
                                  لم يتم إنشاء أي عائلة أو إضافة أعضاء بعد. ابدأ ببناء شجرة عائلتك الآن!
                                </p>
                                <div className="flex gap-4 justify-center">
                                  <Button
                                    onClick={() => navigate('/dashboard')}
                                    className="gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                                  >
                                    <Users className="h-5 w-5" />
                                    إدارة الأعضاء
                                  </Button>
                                  <Button
                                    onClick={() => navigate('/family-builder')}
                                    variant="outline"
                                    className="gap-3 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                                  >
                                    <TreePine className="h-5 w-5" />
                                    بناء العائلة
                                  </Button>
                                </div>
                              </div>
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
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 rounded-2xl p-8 min-h-[600px] overflow-auto shadow-xl">
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
                                        <div className="flex items-center justify-center w-80 h-40 rounded-full border-4 border-emerald-400/60 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 dark:from-emerald-900/40 dark:to-teal-900/40 backdrop-blur-xl shadow-2xl">
                                          <div className="flex items-center gap-6">
                                            <div className="text-center">
                                              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-emerald-300/50">
                                                {member.image_url ? (
                                                  <AvatarImage src={member.image_url} alt={member.name} />
                                                ) : (
                                                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl font-bold">
                                                    {member.name.slice(0, 2)}
                                                  </AvatarFallback>
                                                )}
                                              </Avatar>
                                              <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">{member.name}</h3>
                                            </div>
                                            <div className="text-3xl text-pink-500 animate-pulse">💕</div>
                                            <div className="text-center">
                                              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-teal-300/50">
                                                {spouse.image_url ? (
                                                  <AvatarImage src={spouse.image_url} alt={spouse.name} />
                                                ) : (
                                                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xl font-bold">
                                                    {spouse.name.slice(0, 2)}
                                                  </AvatarFallback>
                                                )}
                                              </Avatar>
                                              <h3 className="font-bold text-sm text-teal-700 dark:text-teal-300">{spouse.name}</h3>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Connection lines for children - Enhanced */}
                                        {genIndex < familyTree.length - 1 && (
                                          <>
                                            {/* Vertical line down */}
                                            <div 
                                              className="absolute w-2 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-lg"
                                              style={{ 
                                                top: '100%', 
                                                left: '50%',
                                                height: '50px',
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
                                                      className="absolute h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"
                                                      style={{ 
                                                        top: 'calc(100% + 50px)', 
                                                        left: `calc(50% - ${lineWidth/2}px)`, 
                                                        width: `${lineWidth}px` 
                                                      }}
                                                    ></div>
                                                    {children.map((child, childIndex) => (
                                                      <div 
                                                        key={child.id}
                                                        className="absolute w-2 h-50 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full shadow-lg"
                                                        style={{ 
                                                          top: 'calc(100% + 50px)', 
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
                                        <Card className={`p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl ${member.gender === 'female' ? 'border-teal-200/30 dark:border-teal-700/30' : 'border-emerald-200/30 dark:border-emerald-700/30'} min-w-[160px] shadow-xl hover:shadow-2xl transition-all duration-300 group`}>
                                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                          <div className="relative">
                                            <Avatar className="h-16 w-16 mx-auto mb-3 ring-4 ring-emerald-200/50 dark:ring-emerald-700/50">
                                              {member.image_url ? (
                                                <AvatarImage src={member.image_url} alt={member.name} />
                                              ) : (
                                                <AvatarFallback className={`bg-gradient-to-br ${member.gender === 'female' ? 'from-teal-500 to-emerald-500' : 'from-emerald-500 to-teal-500'} text-white font-bold`}>
                                                  {member.name.slice(0, 2)}
                                                </AvatarFallback>
                                              )}
                                            </Avatar>
                                            <h3 className="font-bold text-emerald-700 dark:text-emerald-300">{member.name}</h3>
                                            <Badge variant="outline" className="text-xs mt-2 bg-white/50 dark:bg-gray-800/50">
                                              {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                                            </Badge>
                                            {member.biography && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{member.biography}</p>
                                            )}
                                          </div>
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
                                                  className="absolute left-1/2 transform -translate-x-1/2 w-2 h-16 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full shadow-lg"
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
                        <div className="relative max-w-md mx-auto">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                          
                          <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-12 px-8 shadow-xl">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                              <TreePine className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                              لا توجد شجرة عائلة بعد
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                              ابدأ ببناء شجرة عائلتك بإضافة أول عضو
                            </p>
                            <Button
                              onClick={() => navigate('/dashboard')}
                              className="gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                            >
                              <Users className="h-5 w-5" />
                              إدارة الأعضاء
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
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default FamilyTreeView;