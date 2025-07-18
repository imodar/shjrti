import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Users, TreePine, TrendingUp, Heart, Baby, Crown, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SharedFooter } from "@/components/SharedFooter";
import { supabase } from "@/integrations/supabase/client";

const FamilyStatistics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyMarriages, setFamilyMarriages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch family data
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        // Fetch family data
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .select('*')
          .eq('creator_id', user.id)
          .single();

        if (familyError && familyError.code !== 'PGRST116') {
          throw familyError;
        }

        if (familyData) {
          // Fetch family members
          const { data: membersData, error: membersError } = await supabase
            .from('family_tree_members')
            .select('*')
            .eq('family_id', familyData.id)
            .order('created_at', { ascending: true });

          if (membersError) throw membersError;

          // Transform data
          const transformedMembers = membersData?.map(member => ({
            id: member.id,
            name: member.name,
            fatherId: member.father_id,
            motherId: member.mother_id,
            spouseId: member.spouse_id,
            isFounder: member.is_founder,
            gender: member.gender,
            birthDate: member.birth_date || "",
            isAlive: member.is_alive,
            deathDate: member.death_date || null,
            bio: member.biography || "",
            image: member.image_url || null,
            createdAt: member.created_at
          })) || [];

          setFamilyMembers(transformedMembers);

          // Fetch marriages
          const { data: marriagesData, error: marriagesError } = await supabase
            .from('marriages')
            .select('*')
            .eq('family_id', familyData.id)
            .eq('is_active', true);

          if (marriagesError) throw marriagesError;

          const transformedMarriages = marriagesData?.map(marriage => ({
            id: marriage.id,
            familyId: marriage.family_id,
            isActive: marriage.is_active,
            husband: transformedMembers.find(m => m.id === marriage.husband_id),
            wife: transformedMembers.find(m => m.id === marriage.wife_id),
            marriageDate: marriage.marriage_date
          })) || [];

          setFamilyMarriages(transformedMarriages);
        }

      } catch (error) {
        console.error('Error fetching family data:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل بيانات العائلة",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyData();
  }, [navigate, toast]);

  // Calculate statistics
  const getGenerationStats = () => {
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

    // Count members per generation
    const generationCounts = new Map();
    generationMap.forEach((generation) => {
      generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
    });
    
    return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
  };

  const stats = {
    totalMembers: familyMembers.length,
    maleMembers: familyMembers.filter(m => m.gender === "male").length,
    femaleMembers: familyMembers.filter(m => m.gender === "female").length,
    founders: familyMembers.filter(m => m.isFounder).length,
    livingMembers: familyMembers.filter(m => m.isAlive).length,
    deceasedMembers: familyMembers.filter(m => !m.isAlive).length,
    totalMarriages: familyMarriages.length,
    generations: getGenerationStats(),
    averageAgeAtDeath: familyMembers
      .filter(m => !m.isAlive && m.birthDate && m.deathDate)
      .reduce((acc, m) => {
        const birthYear = new Date(m.birthDate).getFullYear();
        const deathYear = new Date(m.deathDate).getFullYear();
        return acc + (deathYear - birthYear);
      }, 0) / familyMembers.filter(m => !m.isAlive && m.birthDate && m.deathDate).length || 0
  };

  const generationCount = Math.max(...stats.generations.map(([gen]) => gen)) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
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
                <h1 className="text-3xl font-bold text-foreground">إحصائيات العائلة</h1>
                <p className="text-muted-foreground mt-1">
                  تحليل شامل لبيانات شجرة العائلة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/family-overview')}
                variant="outline"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                إدارة الأعضاء
              </Button>
              <Button
                onClick={() => navigate('/family-tree-view')}
                variant="outline"
                className="gap-2"
              >
                <TreePine className="h-4 w-4" />
                عرض الشجرة
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Content */}
      <div className="container mx-auto px-4 py-6">
        {stats.totalMembers > 0 ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الأعضاء</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.maleMembers} ذكر و {stats.femaleMembers} أنثى
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">عدد الأجيال</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{generationCount}</div>
                  <p className="text-xs text-muted-foreground">
                    من المؤسسين إلى الجيل الحالي
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">على قيد الحياة</CardTitle>
                  <Heart className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.livingMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.livingMembers / stats.totalMembers) * 100)}% من الإجمالي
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-100 to-pink-50 border-pink-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الزيجات</CardTitle>
                  <Heart className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-600">{stats.totalMarriages}</div>
                  <p className="text-xs text-muted-foreground">
                    زيجة مسجلة في الشجرة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Generation Distribution */}
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  توزيع الأجيال
                </CardTitle>
                <CardDescription>
                  عدد الأعضاء في كل جيل من أجيال العائلة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.generations.map(([generation, count]) => (
                    <div key={generation} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="min-w-[80px] justify-center">
                            الجيل {generation}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} {count === 1 ? 'عضو' : 'أعضاء'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round((count / stats.totalMembers) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(count / stats.totalMembers) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    التوزيع حسب الجنس
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">الذكور</span>
                        <span className="text-sm">{stats.maleMembers} ({Math.round((stats.maleMembers / stats.totalMembers) * 100)}%)</span>
                      </div>
                      <Progress value={(stats.maleMembers / stats.totalMembers) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">الإناث</span>
                        <span className="text-sm">{stats.femaleMembers} ({Math.round((stats.femaleMembers / stats.totalMembers) * 100)}%)</span>
                      </div>
                      <Progress value={(stats.femaleMembers / stats.totalMembers) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    حالة الحياة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-600">على قيد الحياة</span>
                        <span className="text-sm">{stats.livingMembers} ({Math.round((stats.livingMembers / stats.totalMembers) * 100)}%)</span>
                      </div>
                      <Progress value={(stats.livingMembers / stats.totalMembers) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">متوفى</span>
                        <span className="text-sm">{stats.deceasedMembers} ({Math.round((stats.deceasedMembers / stats.totalMembers) * 100)}%)</span>
                      </div>
                      <Progress value={(stats.deceasedMembers / stats.totalMembers) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">المؤسسون</CardTitle>
                  <Crown className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.founders}</div>
                  <p className="text-xs text-muted-foreground">
                    مؤسسي العائلة
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل النمو</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {generationCount > 1 ? Math.round(stats.totalMembers / generationCount) : stats.totalMembers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    عضو لكل جيل
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">نسبة الزواج</CardTitle>
                  <Heart className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((stats.totalMarriages / stats.totalMembers) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    من الأعضاء متزوجون
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-muted-foreground mb-4">
              لا توجد إحصائيات متاحة
            </h3>
            <p className="text-muted-foreground mb-6">
              أضف أعضاء إلى شجرة العائلة لعرض الإحصائيات التفصيلية
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

      <SharedFooter />
    </div>
  );
};

export default FamilyStatistics;