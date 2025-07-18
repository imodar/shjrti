import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, BarChart3, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";

const FamilyTreeView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Set to false for demo data
  const [zoomLevel, setZoomLevel] = useState(1);

  // Demo family data based on user's request
  const demoFamilyMembers = [
    // الجيل الأول - أمير ورانية
    {
      id: "amir-1",
      name: "أمير",
      fatherId: null,
      motherId: null,
      spouseId: "rania-1",
      isFounder: true,
      gender: "male",
      birthDate: "1970-01-01",
      isAlive: true,
      deathDate: null,
      bio: "مؤسس العائلة",
      image: null,
      relation: "founder"
    },
    {
      id: "rania-1",
      name: "رانية",
      fatherId: null,
      motherId: null,
      spouseId: "amir-1",
      isFounder: true,
      gender: "female",
      birthDate: "1972-01-01",
      isAlive: true,
      deathDate: null,
      bio: "مؤسسة العائلة",
      image: null,
      relation: "founder"
    },
    // الجيل الثاني - مضر وزينة وربى
    {
      id: "mudar-2",
      name: "مضر",
      fatherId: "amir-1",
      motherId: "rania-1",
      spouseId: null,
      isFounder: false,
      gender: "male",
      birthDate: "1995-01-01",
      isAlive: true,
      deathDate: null,
      bio: "ابن أمير ورانية",
      image: null,
      relation: "son"
    },
    {
      id: "zina-2",
      name: "زينة",
      fatherId: "amir-1",
      motherId: "rania-1",
      spouseId: null,
      isFounder: false,
      gender: "female",
      birthDate: "1997-01-01",
      isAlive: true,
      deathDate: null,
      bio: "ابنة أمير ورانية",
      image: null,
      relation: "daughter"
    },
    {
      id: "ruba-2",
      name: "ربى",
      fatherId: "amir-1",
      motherId: "rania-1",
      spouseId: null,
      isFounder: false,
      gender: "female",
      birthDate: "1999-01-01",
      isAlive: true,
      deathDate: null,
      bio: "ابنة أمير ورانية",
      image: null,
      relation: "daughter"
    },
    // الجيل الثالث - مجد (ابن زينة) وأمير بن مضر (ابن مضر)
    {
      id: "majd-3",
      name: "مجد",
      fatherId: null,
      motherId: "zina-2", // مجد ابن زينة
      spouseId: null,
      isFounder: false,
      gender: "male",
      birthDate: "2020-01-01",
      isAlive: true,
      deathDate: null,
      bio: "ابن زينة",
      image: null,
      relation: "grandson"
    },
    {
      id: "amir-3",
      name: "أمير بن مضر",
      fatherId: "mudar-2",
      motherId: null,
      spouseId: null,
      isFounder: false,
      gender: "male",
      birthDate: "2022-01-01",
      isAlive: true,
      deathDate: null,
      bio: "ابن مضر",
      image: null,
      relation: "grandson"
    }
  ];

  const demoMarriages = [
    {
      id: "marriage-1",
      familyId: "demo-family",
      isActive: true,
      husband: demoFamilyMembers.find(m => m.id === "amir-1"),
      wife: demoFamilyMembers.find(m => m.id === "rania-1")
    }
  ];

  // Initialize with demo data
  useEffect(() => {
    // Set demo data directly
    setFamilyMembers(demoFamilyMembers);
    setFamilyMarriages(demoMarriages);
    setIsLoading(false);
  }, []);

  // Generate family tree structure by generations
  const generateFamilyTree = () => {
    const generationMap = new Map();
    
    // Start with founders as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder || (!member.fatherId && !member.motherId)) {
        generationMap.set(member.id, 1);
      }
    });
    
    // Recursively assign generations
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      familyMembers.forEach(member => {
        if (!generationMap.has(member.id)) {
          if (member.fatherId || member.motherId) {
            const fatherGeneration = member.fatherId ? generationMap.get(member.fatherId) : undefined;
            const motherGeneration = member.motherId ? generationMap.get(member.motherId) : undefined;
            
            if (fatherGeneration !== undefined || motherGeneration !== undefined) {
              const parentGeneration = Math.max(
                fatherGeneration || 0, 
                motherGeneration || 0
              );
              generationMap.set(member.id, parentGeneration + 1);
              changed = true;
            }
          } else {
            generationMap.set(member.id, 1);
            changed = true;
          }
        }
      });
    }
    
    // Assign spouses to same generation
    familyMarriages.forEach(marriage => {
      const husbandGeneration = generationMap.get(marriage.husband?.id);
      const wifeGeneration = generationMap.get(marriage.wife?.id);
      
      if (husbandGeneration && !wifeGeneration) {
        generationMap.set(marriage.wife?.id, husbandGeneration);
      } else if (wifeGeneration && !husbandGeneration) {
        generationMap.set(marriage.husband?.id, wifeGeneration);
      }
    });

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

    return Array.from(generations.entries()).sort((a, b) => a[0] - b[0]);
  };

  const familyTree = generateFamilyTree();

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

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
                {familyTree.length > 0 ? (
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
                                m.husband?.id === member.id || m.wife?.id === member.id
                              );
                              const spouse = marriage ? 
                                (marriage.husband?.id === member.id ? marriage.wife : marriage.husband) : null;

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
                                        <AvatarImage src={member.image} />
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                                          {member.name.slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="text-right">
                                        <h3 className="font-semibold text-foreground">{member.name}</h3>
                                        <div className="flex gap-2 mt-1">
                                          {member.isFounder && (
                                            <Badge variant="secondary" className="text-xs">مؤسس</Badge>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            {member.gender === "male" ? "ذكر" : "أنثى"}
                                          </Badge>
                                        </div>
                                        {member.birthDate && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(member.birthDate).getFullYear()}
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
                                            <AvatarImage src={spouse.image} />
                                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                                              {spouse.name.slice(0, 2)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="text-right">
                                            <h3 className="font-semibold text-foreground">{spouse.name}</h3>
                                            <div className="flex gap-2 mt-1">
                                              {spouse.isFounder && (
                                                <Badge variant="secondary" className="text-xs">مؤسس</Badge>
                                              )}
                                              <Badge variant="outline" className="text-xs">
                                                {spouse.gender === "male" ? "ذكر" : "أنثى"}
                                              </Badge>
                                            </div>
                                            {spouse.birthDate && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(spouse.birthDate).getFullYear()}
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

          {/* Diagram Tree View */}
          <TabsContent value="diagram">
            <div className="bg-card/30 backdrop-blur-sm rounded-xl border border-primary/20 p-6 min-h-[600px] overflow-auto">
              <div 
                className="transition-transform duration-300 relative"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                <div className="relative min-h-[700px] flex flex-col items-center pt-8">
                  
                  {/* الجيل الأول - أمير ورانية في دائرة واحدة */}
                  <div className="relative mb-16">
                    <div className="flex items-center justify-center w-64 h-32 rounded-full border-4 border-primary/40 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg">
                              أم
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold text-sm">أمير</h3>
                        </div>
                        <div className="text-xl text-primary">♥</div>
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-lg">
                              را
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold text-sm">رانية</h3>
                        </div>
                      </div>
                    </div>
                    
                    {/* خط رئيسي من الزوجين للأطفال */}
                    <div className="absolute left-1/2 top-full transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-primary to-accent"></div>
                    
                    {/* نقطة التفرع */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-accent" style={{ top: 'calc(100% + 64px)' }}></div>
                    
                    {/* الخطوط الأفقية للأطفال الثلاثة */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-primary to-accent" style={{ top: 'calc(100% + 72px)', width: '400px', left: 'calc(50% - 200px)' }}></div>
                    
                    {/* خطوط عمودية للأطفال */}
                    {/* مضر - يسار */}
                    <div className="absolute w-1 h-16 bg-gradient-to-b from-accent to-primary" style={{ top: 'calc(100% + 72px)', left: 'calc(50% - 133px)' }}></div>
                    {/* زينة - وسط */}
                    <div className="absolute w-1 h-16 bg-gradient-to-b from-accent to-primary" style={{ top: 'calc(100% + 72px)', left: 'calc(50% - 0.5px)' }}></div>
                    {/* ربى - يمين */}
                    <div className="absolute w-1 h-16 bg-gradient-to-b from-accent to-primary" style={{ top: 'calc(100% + 72px)', left: 'calc(50% + 133px)' }}></div>
                  </div>

                  {/* الجيل الثاني - مضر وزينة وربى */}
                  <div className="relative mb-16">
                    <div className="flex justify-center items-start gap-32">
                      {/* مضر */}
                      <div className="relative text-center">
                        <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 min-w-[140px]">
                          <Avatar className="h-14 w-14 mx-auto mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                              مض
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">مضر</h3>
                          <Badge variant="outline" className="text-xs mt-1">ذكر</Badge>
                        </Card>
                        
                        {/* خط من مضر لأمير بن مضر */}
                        <div className="absolute left-1/2 top-full transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-primary to-accent"></div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-primary" style={{ top: 'calc(100% + 64px)' }}></div>
                      </div>

                      {/* زينة */}
                      <div className="relative text-center">
                        <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[140px]">
                          <Avatar className="h-14 w-14 mx-auto mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                              زي
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">زينة</h3>
                          <Badge variant="outline" className="text-xs mt-1">أنثى</Badge>
                        </Card>
                        
                        {/* خط من زينة لمجد */}
                        <div className="absolute left-1/2 top-full transform -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-accent to-primary"></div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-accent" style={{ top: 'calc(100% + 64px)' }}></div>
                      </div>

                      {/* ربى */}
                      <div className="text-center">
                        <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[140px]">
                          <Avatar className="h-14 w-14 mx-auto mb-2">
                            <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                              رب
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold">ربى</h3>
                          <Badge variant="outline" className="text-xs mt-1">أنثى</Badge>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* الجيل الثالث */}
                  <div className="flex justify-center gap-64 pt-8">
                    {/* أمير بن مضر - ابن مضر */}
                    <div className="text-center">
                      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 min-w-[120px]">
                        <Avatar className="h-12 w-12 mx-auto mb-2">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20">
                            أم
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm">أمير بن مضر</h3>
                        <Badge variant="outline" className="text-xs mt-1">ذكر</Badge>
                        <p className="text-xs text-muted-foreground mt-1">ابن مضر</p>
                      </Card>
                    </div>

                    {/* مجد - ابن زينة */}
                    <div className="text-center">
                      <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[120px]">
                        <Avatar className="h-12 w-12 mx-auto mb-2">
                          <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20">
                            مج
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm">مجد</h3>
                        <Badge variant="outline" className="text-xs mt-1">ذكر</Badge>
                        <p className="text-xs text-muted-foreground mt-1">ابن زينة</p>
                      </Card>
                    </div>
                  </div>

                </div>
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