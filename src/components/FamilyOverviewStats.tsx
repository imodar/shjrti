import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, TrendingUp, Heart, Crown, Calendar } from "lucide-react";
import { useResolvedImageUrl } from "@/utils/useResolvedImageUrl";

interface FamilyOverviewStatsProps {
  familyData: any;
  familyMembers: any[];
  familyMarriages: any[];
  generationCount: number;
}

export const FamilyOverviewStats: React.FC<FamilyOverviewStatsProps> = ({
  familyData,
  familyMembers,
  familyMarriages,
  generationCount,
}) => {
  const founders = familyMembers.filter(m => m.isFounder || m.is_founder);
  const livingMembers = familyMembers.filter(m => m.isAlive ?? m.is_alive ?? true).length;
  const recentMembers = [...familyMembers]
    .sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">إجمالي الأعضاء</p>
                <p className="text-2xl font-bold text-emerald-600">{familyMembers.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{livingMembers}</p>
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
                <p className="text-2xl font-bold text-pink-600">{familyMarriages.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Description */}
      {familyData?.description && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-emerald-200/30 dark:border-emerald-700/30 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-emerald-600 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              نبذة عن العائلة
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {familyData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Founders */}
      {founders.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-amber-200/30 dark:border-amber-700/30 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              مؤسسو العائلة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {founders.map((founder) => (
                <FounderCard key={founder.id} member={founder} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Members */}
      {recentMembers.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-teal-200/30 dark:border-teal-700/30 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-teal-600 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              آخر الأعضاء المضافين
            </h3>
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                  <Avatar className="h-10 w-10 border-2 border-teal-200">
                    <AvatarImage src={useResolvedImageUrl(member.image || member.image_url)} />
                    <AvatarFallback className="bg-teal-100 text-teal-600">
                      {(member.name || member.first_name || "؟").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.gender === "male" ? "ذكر" : "أنثى"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const FounderCard: React.FC<{ member: any }> = ({ member }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
      <Avatar className="h-16 w-16 border-2 border-amber-300">
        <AvatarImage src={useResolvedImageUrl(member.image || member.image_url)} />
        <AvatarFallback className="bg-amber-100 text-amber-600 text-xl">
          {(member.name || member.first_name || "؟").charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 dark:text-gray-100">{member.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {member.gender === "male" ? "مؤسس" : "مؤسسة"}
        </p>
        {(member.birth_date || member.birthDate) && (
          <p className="text-xs text-gray-500 mt-1">
            مواليد: {new Date(member.birth_date || member.birthDate).getFullYear()}
          </p>
        )}
      </div>
    </div>
  );
};
