import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Heart, 
  Baby, 
  Crown, 
  BarChart3
} from "lucide-react";

interface FamilyStatisticsViewProps {
  familyMembers: any[];
  familyMarriages: any[];
}

export const FamilyStatisticsView: React.FC<FamilyStatisticsViewProps> = ({
  familyMembers,
  familyMarriages,
}) => {
  const stats = useMemo(() => {
    const getGenerationStats = () => {
      const generationMap = new Map();
      
      // Start with founders as generation 1
      familyMembers.forEach(member => {
        if (member.isFounder || member.is_founder) {
          generationMap.set(member.id, 1);
        }
      });
      
      // Calculate generations
      let changed = true;
      let maxIterations = 50;
      let iterations = 0;
      
      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        familyMembers.forEach(member => {
          if (!generationMap.has(member.id)) {
            const fatherId = member.fatherId || member.father_id;
            const motherId = member.motherId || member.mother_id;
            
            if (fatherId || motherId) {
              const fatherGeneration = fatherId ? generationMap.get(fatherId) : undefined;
              const motherGeneration = motherId ? generationMap.get(motherId) : undefined;
              
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
        const husbandGeneration = generationMap.get(marriage.husband_id);
        const wifeGeneration = generationMap.get(marriage.wife_id);
        
        if (husbandGeneration && !wifeGeneration) {
          generationMap.set(marriage.wife_id, husbandGeneration);
        } else if (wifeGeneration && !husbandGeneration) {
          generationMap.set(marriage.husband_id, wifeGeneration);
        }
      });

      // Count members per generation
      const generationCounts = new Map();
      generationMap.forEach((generation) => {
        generationCounts.set(generation, (generationCounts.get(generation) || 0) + 1);
      });
      
      return Array.from(generationCounts.entries()).sort((a, b) => a[0] - b[0]);
    };

    const totalMembers = familyMembers.length;
    const maleMembers = familyMembers.filter(m => m.gender === "male").length;
    const femaleMembers = familyMembers.filter(m => m.gender === "female").length;
    const founders = familyMembers.filter(m => m.isFounder || m.is_founder).length;
    const livingMembers = familyMembers.filter(m => m.isAlive ?? m.is_alive ?? true).length;
    const deceasedMembers = familyMembers.filter(m => !(m.isAlive ?? m.is_alive ?? true)).length;
    const totalMarriages = familyMarriages.length;
    const generations = getGenerationStats();
    
    const averageAgeAtDeath = familyMembers
      .filter(m => {
        const isAlive = m.isAlive ?? m.is_alive ?? true;
        const birthDate = m.birthDate || m.birth_date;
        const deathDate = m.deathDate || m.death_date;
        return !isAlive && birthDate && deathDate;
      })
      .reduce((acc, m) => {
        const birthDate = m.birthDate || m.birth_date;
        const deathDate = m.deathDate || m.death_date;
        const birthYear = new Date(birthDate).getFullYear();
        const deathYear = new Date(deathDate).getFullYear();
        return acc + (deathYear - birthYear);
      }, 0) / familyMembers.filter(m => {
        const isAlive = m.isAlive ?? m.is_alive ?? true;
        const birthDate = m.birthDate || m.birth_date;
        const deathDate = m.deathDate || m.death_date;
        return !isAlive && birthDate && deathDate;
      }).length || 0;

    return {
      totalMembers,
      maleMembers,
      femaleMembers,
      founders,
      livingMembers,
      deceasedMembers,
      totalMarriages,
      generations,
      averageAgeAtDeath,
    };
  }, [familyMembers, familyMarriages]);

  const generationCount = Math.max(...stats.generations.map(([gen]) => gen)) || 0;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">إجمالي الأعضاء</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.totalMembers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.maleMembers} ذكر و {stats.femaleMembers} أنثى
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-blue-200/30 dark:border-blue-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">عدد الأجيال</p>
                <p className="text-2xl font-bold text-blue-600">{generationCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  من المؤسسين إلى الجيل الحالي
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-green-200/30 dark:border-green-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">على قيد الحياة</p>
                <p className="text-2xl font-bold text-green-600">{stats.livingMembers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.livingMembers / stats.totalMembers) * 100)}% من الإجمالي
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-pink-200/30 dark:border-pink-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">الزيجات</p>
                <p className="text-2xl font-bold text-pink-600">{stats.totalMarriages}</p>
                <p className="text-xs text-gray-500 mt-1">
                  زيجة مسجلة في الشجرة
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Distribution */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-emerald-600 text-xl">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <Baby className="h-5 w-5" />
            </div>
            توزيع الأجيال
          </CardTitle>
          <CardDescription>
            عدد الأعضاء في كل جيل من أجيال العائلة
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {stats.generations.map(([generation, count]) => (
              <div key={generation} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-medium">
                      الجيل {generation}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} {count === 1 ? "عضو" : "أعضاء"}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
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

      {/* Additional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-purple-200/30 dark:border-purple-700/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-purple-600">
              <Users className="h-5 w-5" />
              توزيع الجنس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">ذكور</span>
                <span className="font-bold text-blue-600">{stats.maleMembers}</span>
              </div>
              <Progress value={(stats.maleMembers / stats.totalMembers) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">إناث</span>
                <span className="font-bold text-pink-600">{stats.femaleMembers}</span>
              </div>
              <Progress value={(stats.femaleMembers / stats.totalMembers) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Life Status */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-teal-200/30 dark:border-teal-700/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-teal-600">
              <Heart className="h-5 w-5" />
              حالة الحياة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">على قيد الحياة</span>
                <span className="font-bold text-green-600">{stats.livingMembers}</span>
              </div>
              <Progress value={(stats.livingMembers / stats.totalMembers) * 100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">متوفين</span>
                <span className="font-bold text-gray-600">{stats.deceasedMembers}</span>
              </div>
              <Progress value={(stats.deceasedMembers / stats.totalMembers) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Founders Card */}
      {stats.founders > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-amber-200/30 dark:border-amber-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-amber-600">مؤسسو العائلة</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {stats.founders} {stats.founders === 1 ? "مؤسس" : "مؤسسين"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
