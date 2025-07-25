import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Users, 
  TreePine, 
  TrendingUp, 
  Heart, 
  Baby, 
  Crown, 
  Calendar, 
  BarChart3, 
  Sparkles,
  Star,
  Gem,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
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
            wife: transformedMembers.find(m => m.id === marriage.wife_id)
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
    
    // Start ONLY with explicitly marked founders as generation 1
    familyMembers.forEach(member => {
      if (member.isFounder) {
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950" dir="rtl">
        <GlobalHeader />
        <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="text-emerald-600 mr-4">جاري تحميل الإحصائيات...</p>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

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
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Header Card */}
            <div className="relative max-w-5xl mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
              
              <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between">
                  {/* Back Button */}
                  <div className="w-full sm:w-auto order-1 sm:order-1">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/dashboard')}
                      className="w-full sm:w-auto text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      العودة للوحة الإدارة
                    </Button>
                  </div>

                  {/* Title */}
                  <div className="text-center order-2 sm:order-2">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                        إحصائيات العائلة
                      </h1>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      تحليل شامل وتفصيلي لبيانات شجرة العائلة
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto order-3 sm:order-3">
                    <Button
                      onClick={() => navigate('/dashboard')}
                      variant="outline"
                      className="w-full sm:w-auto gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      <Users className="h-4 w-4" />
                      إدارة الأعضاء
                    </Button>
                    <Button
                      onClick={() => navigate('/family-tree-view')}
                      variant="outline"
                      className="w-full sm:w-auto gap-2 border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    >
                      <TreePine className="h-4 w-4" />
                      عرض الشجرة
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Content */}
            {stats.totalMembers > 0 ? (
              <div className="space-y-6 sm:space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">إجمالي الأعضاء</p>
                          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.totalMembers}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.maleMembers} ذكر و {stats.femaleMembers} أنثى
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">عدد الأجيال</p>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{generationCount}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            من المؤسسين إلى الجيل الحالي
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-green-200/30 dark:border-green-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">على قيد الحياة</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.livingMembers}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round((stats.livingMembers / stats.totalMembers) * 100)}% من الإجمالي
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-pink-200/30 dark:border-pink-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">الزيجات</p>
                          <p className="text-xl sm:text-2xl font-bold text-pink-600">{stats.totalMarriages}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            زيجة مسجلة في الشجرة
                          </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                          <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Generation Distribution */}
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-emerald-600 text-lg sm:text-xl">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                        <Baby className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      توزيع الأجيال
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      عدد الأعضاء في كل جيل من أجيال العائلة
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {stats.generations.map(([generation, count]) => (
                        <div key={generation} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Badge variant="outline" className="min-w-[70px] sm:min-w-[80px] justify-center bg-emerald-50 text-emerald-600 border-emerald-200 text-xs sm:text-sm">
                                الجيل {generation}
                              </Badge>
                              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                                {count} {count === 1 ? 'عضو' : 'أعضاء'}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-emerald-600">
                              {Math.round((count / stats.totalMembers) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(count / stats.totalMembers) * 100} 
                            className="h-2 sm:h-3 bg-emerald-100 dark:bg-emerald-900/20"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Gender and Life Status Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-blue-600 text-lg sm:text-xl">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        التوزيع حسب الجنس
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-blue-600">الذكور</span>
                            <span className="text-xs sm:text-sm font-medium">{stats.maleMembers} ({Math.round((stats.maleMembers / stats.totalMembers) * 100)}%)</span>
                          </div>
                          <Progress value={(stats.maleMembers / stats.totalMembers) * 100} className="h-2 sm:h-3 bg-blue-100 dark:bg-blue-900/20" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-pink-600">الإناث</span>
                            <span className="text-xs sm:text-sm font-medium">{stats.femaleMembers} ({Math.round((stats.femaleMembers / stats.totalMembers) * 100)}%)</span>
                          </div>
                          <Progress value={(stats.femaleMembers / stats.totalMembers) * 100} className="h-2 sm:h-3 bg-pink-100 dark:bg-pink-900/20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 shadow-xl">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-purple-600 text-lg sm:text-xl">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        حالة الحياة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-green-600">على قيد الحياة</span>
                            <span className="text-xs sm:text-sm font-medium">{stats.livingMembers} ({Math.round((stats.livingMembers / stats.totalMembers) * 100)}%)</span>
                          </div>
                          <Progress value={(stats.livingMembers / stats.totalMembers) * 100} className="h-2 sm:h-3 bg-green-100 dark:bg-green-900/20" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-gray-600">متوفى</span>
                            <span className="text-xs sm:text-sm font-medium">{stats.deceasedMembers} ({Math.round((stats.deceasedMembers / stats.totalMembers) * 100)}%)</span>
                          </div>
                          <Progress value={(stats.deceasedMembers / stats.totalMembers) * 100} className="h-2 sm:h-3 bg-gray-100 dark:bg-gray-900/20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-yellow-200/30 dark:border-yellow-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">المؤسسون</p>
                          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.founders}</p>
                          <p className="text-xs text-gray-500 mt-1">مؤسسي العائلة</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-teal-200/30 dark:border-teal-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">معدل النمو</p>
                          <p className="text-xl sm:text-2xl font-bold text-teal-600">
                            {generationCount > 1 ? Math.round(stats.totalMembers / generationCount) : stats.totalMembers}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">عضو لكل جيل</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-rose-200/30 dark:border-rose-700/30 shadow-xl">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">نسبة الزواج</p>
                          <p className="text-xl sm:text-2xl font-bold text-rose-600">
                            {stats.totalMembers > 0 ? Math.round((stats.totalMarriages / stats.totalMembers) * 100) : 0}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">من الأعضاء متزوجون</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
                          <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="relative max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
                  
                  <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-12 px-8 shadow-xl">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <BarChart3 className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                      لا توجد إحصائيات متاحة
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                      أضف أعضاء إلى شجرة العائلة لعرض الإحصائيات التفصيلية
                    </p>
                    <Button
                      onClick={() => navigate('/dashboard')}
                      className="gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                    >
                      <Users className="h-5 w-5" />
                      ابدأ بإضافة الأعضاء
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
};

export default FamilyStatistics;