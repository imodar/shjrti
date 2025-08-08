import React from "react";
import { FamilyCardSkeleton } from "./FamilyCardSkeleton";

interface FamiliesGridSkeletonProps {
  count?: number;
}

export const FamiliesGridSkeleton: React.FC<FamiliesGridSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="group relative">
          {/* Floating Background Effect (muted) */}
          <div className="absolute -inset-2 rounded-3xl blur-xl opacity-20"></div>
          <FamilyCardSkeleton />
        </div>
      ))}
    </div>
  );
};

export default FamiliesGridSkeleton;
