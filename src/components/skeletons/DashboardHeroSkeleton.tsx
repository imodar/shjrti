import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const DashboardHeroSkeleton: React.FC = () => {
  return (
    <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-1 px-3 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
      <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8">
        {/* Left: Avatar & Welcome */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Center: Tree Count & Description */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Skeleton className="h-6 w-40 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>

        {/* Right: Subscription Status */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-2 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeroSkeleton;
