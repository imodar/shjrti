import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const FamilyGallerySkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 relative z-10">
      {/* Family Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-6 px-8 shadow-xl">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>

      {/* Content Card */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-background/95 dark:bg-background/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-border/40 space-y-6">
          
          {/* Upload Section Skeleton */}
          <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-rose-900/30 backdrop-blur-xl border border-purple-200/40 dark:border-purple-700/40 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Stats */}
                <div className="flex items-center gap-3 lg:border-r border-purple-300/40 dark:border-purple-600/40 lg:pr-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>

                {/* Storage */}
                <div className="flex-1 lg:max-w-[200px] lg:border-r border-purple-300/40 dark:border-purple-600/40 lg:pr-4 w-full">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                </div>

                {/* Upload Dropzone */}
                <div className="flex-1 w-full">
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Header Skeleton */}
          <div className="flex items-center justify-between px-2 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>

          {/* Gallery Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-square">
                  <Skeleton className="w-full h-full rounded-none" />
                </div>
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyGallerySkeleton;
