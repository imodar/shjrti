import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const MemberProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <Card className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl shadow-xl overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-4">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-white/30" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Personal Info */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
              
              {/* Biography */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Connections */}
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-5 w-36" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/20">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Action Buttons */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-xl sticky top-6">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileSkeleton;