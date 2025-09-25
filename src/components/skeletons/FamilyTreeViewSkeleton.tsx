import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const FamilyTreeViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Family Header Skeleton */}
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
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tree Controls Section */}
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-xl">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:justify-between">
            {/* Back Button */}
            <div className="w-full lg:w-auto">
              <Skeleton className="h-10 w-full lg:w-48 rounded-md" />
            </div>

            {/* Center Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-1">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Tree Visualization Area */}
      <div className="relative">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden min-h-[600px]">
          <CardContent className="p-8">
            {/* Generation 1 - Founders */}
            <div className="text-center mb-8">
              <Skeleton className="h-4 w-24 mx-auto mb-4" />
              <div className="flex justify-center">
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 min-w-[200px]">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="text-center">
                      <Skeleton className="h-12 w-12 rounded-full mx-auto mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="text-center">
                      <Skeleton className="h-12 w-12 rounded-full mx-auto mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20 mx-auto rounded-full" />
                </Card>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="flex justify-center mb-6">
              <Skeleton className="h-8 w-px" />
            </div>

            {/* Generation 2 */}
            <div className="text-center mb-8">
              <Skeleton className="h-4 w-24 mx-auto mb-4" />
              <div className="flex justify-center gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="relative">
                    <Card className="p-4 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[140px]">
                      <Skeleton className="h-14 w-14 rounded-full mx-auto mb-2" />
                      <Skeleton className="h-4 w-20 mx-auto mb-1" />
                      <Skeleton className="h-5 w-12 mx-auto rounded-full" />
                      <Skeleton className="h-3 w-16 mx-auto mt-1" />
                    </Card>
                    {/* Connection lines between siblings */}
                    {i < 2 && (
                      <div className="absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-emerald-400 to-emerald-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Lines */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-px" />
                ))}
              </div>
            </div>

            {/* Generation 3 */}
            <div className="text-center">
              <Skeleton className="h-4 w-24 mx-auto mb-4" />
              <div className="flex justify-center gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-3 bg-card/80 backdrop-blur-sm border-accent/20 min-w-[120px]">
                    <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-3 w-16 mx-auto mb-1" />
                    <Skeleton className="h-4 w-10 mx-auto rounded-full" />
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Features Panel Skeleton (if applicable) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-6 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FamilyTreeViewSkeleton;