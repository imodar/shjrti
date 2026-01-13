import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MemberCardSkeletonProps {
  index?: number;
}

export const MemberCardSkeleton: React.FC<MemberCardSkeletonProps> = ({ index = 0 }) => {
  return (
    <Card 
      className="relative bg-white dark:bg-gray-800 border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 rounded-3xl overflow-hidden animate-fade-in-wave"
      style={{ 
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 min-h-[80px]">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar skeleton with shimmer */}
            <div className="h-12 w-12 rounded-full flex-shrink-0 skeleton-shimmer" />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name skeleton */}
              <div className="h-4 w-28 rounded-md skeleton-shimmer" />
              
              {/* Lineage skeleton */}
              <div className="h-3 w-36 rounded-md skeleton-shimmer" />
              
              {/* Birth info skeleton */}
              <div className="h-5 w-32 rounded-full skeleton-shimmer" />
            </div>
          </div>
          
          {/* Action buttons skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-8 w-8 rounded-full skeleton-shimmer" />
            <div className="h-8 w-8 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCardSkeleton;
