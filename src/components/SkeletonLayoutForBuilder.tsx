import React from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";

export const SkeletonLayoutForBuilder: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950">
      <GlobalHeader />
      <main className="flex-1 pt-20">
        <FamilyBuilderNewSkeleton />
      </main>
      <GlobalFooterSimplified />
    </div>
  );
};
