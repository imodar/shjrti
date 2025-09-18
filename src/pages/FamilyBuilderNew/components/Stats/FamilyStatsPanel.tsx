import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TreePine, Heart, Crown, Activity } from "lucide-react";
import { Member, Marriage } from "../../types/family.types";

interface FamilyStatsPanelProps {
  familyMembers: Member[];
  familyMarriages: Marriage[];
  generationCount: number;
  generationStats: Array<{ generation: number; count: number }>;
  loading?: boolean;
}

export const FamilyStatsPanel: React.FC<FamilyStatsPanelProps> = ({
  familyMembers,
  familyMarriages,
  generationCount,
  generationStats,
  loading
}) => {
  const totalMembers = familyMembers.length;
  const maleMembers = familyMembers.filter(m => m.gender === 'male').length;
  const femaleMembers = familyMembers.filter(m => m.gender === 'female').length;
  const aliveMembers = familyMembers.filter(m => m.is_alive !== false).length;
  const founders = familyMembers.filter(m => m.is_founder).length;
  const activeMarriages = familyMarriages.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            إحصائيات العائلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          إحصائيات العائلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">إجمالي الأعضاء</span>
              </div>
              <p className="text-2xl font-bold text-primary">{totalMembers}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">الأجيال</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{generationCount}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">الزيجات</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{activeMarriages}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">المؤسسون</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{founders}</p>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">توزيع الجنس</h4>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex-1 justify-center">
                ذكور: {maleMembers}
              </Badge>
              <Badge variant="secondary" className="flex-1 justify-center">
                إناث: {femaleMembers}
              </Badge>
            </div>
          </div>

          {/* Life Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">الحالة الحياتية</h4>
            <div className="flex gap-2">
              <Badge variant="default" className="flex-1 justify-center">
                أحياء: {aliveMembers}
              </Badge>
              <Badge variant="outline" className="flex-1 justify-center">
                متوفون: {totalMembers - aliveMembers}
              </Badge>
            </div>
          </div>

          {/* Generation Breakdown */}
          {generationStats.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">توزيع الأجيال</h4>
              <div className="space-y-1">
                {generationStats.map(({ generation, count }) => (
                  <div key={generation} className="flex justify-between text-sm">
                    <span>الجيل {generation}</span>
                    <Badge variant="outline">
                      {count} أعضاء
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};