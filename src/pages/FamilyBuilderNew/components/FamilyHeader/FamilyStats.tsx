import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Activity } from "lucide-react";

interface FamilyStatsProps {
  membersCount: number;
  marriagesCount: number;
  generationsCount: number;
}

export const FamilyStats = React.memo(({ 
  membersCount, 
  marriagesCount, 
  generationsCount 
}: FamilyStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأعضاء</p>
              <p className="text-3xl font-bold">{membersCount}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عدد الزيجات</p>
              <p className="text-3xl font-bold">{marriagesCount}</p>
            </div>
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عدد الأجيال</p>
              <p className="text-3xl font-bold">{generationsCount}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

FamilyStats.displayName = "FamilyStats";