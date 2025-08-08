import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const StatsBarSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl p-3 mb-6 border">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default StatsBarSkeleton;
