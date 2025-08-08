import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ListItemSkeleton: React.FC = () => (
  <div className="flex items-start gap-3">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

const FamilyBuilderNewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top hero/info bar */}
      <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs placeholder */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Member list */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-5 w-36" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <Skeleton className="h-10 w-full rounded-md" />
              {/* Filter */}
              <Skeleton className="h-10 w-40 rounded-md" />
              {/* List items */}
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <ListItemSkeleton />
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Form panel */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-white/80 dark:bg-gray-900/50 border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              {/* Photo upload area */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <div className="h-32 rounded-xl border-2 border-dashed grid place-items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>

              {/* More fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-4">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyBuilderNewSkeleton;
