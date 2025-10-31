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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-emerald-50 to-teal-50 dark:from-amber-950 dark:via-emerald-950 dark:to-teal-950 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 pt-20">
        {/* Header Box */}
        <div className="container mx-auto px-4 pt-0 pb-0">
          {/* Empty space to match layout */}
        </div>

        {/* FamilyHeader Skeleton */}
        <div className="container mx-auto px-4">
          <div className="relative max-w-5xl mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/20 to-amber-500/10 rounded-2xl blur-2xl"></div>
            
            <div className="relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-4 sm:py-6 sm:px-8 shadow-xl ring-1 ring-white/10 dark:ring-gray-500/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                {/* Family Info */}
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center space-y-1">
                    <Skeleton className="h-4 w-16 mx-auto" />
                    <Skeleton className="h-6 w-8 mx-auto" />
                  </div>
                  <div className="text-center space-y-1">
                    <Skeleton className="h-4 w-16 mx-auto" />
                    <Skeleton className="h-6 w-8 mx-auto" />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-2 pb-6">
          <div className="grid gap-6 grid-cols-12">
            {/* Form Panel - Right Side */}
            <div className="col-span-8 order-2 space-y-6">
              <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
                
                {/* View Mode - Family Overview */}
                <CardContent className="relative p-2 sm:p-4 md:p-6 overflow-hidden bg-white">
                  <div className="py-8 px-6">
                    {/* Animated Background Orbs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 via-secondary/5 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
                    
                    <div className="relative z-10 pt-4">
                      {/* Hero Content */}
                      <div className="text-center space-y-8">
                        {/* Logo Section */}
                        <div className="relative inline-block">
                          <div className="relative group">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                              <Skeleton className="absolute inset-0 rounded-full" />
                              <Skeleton className="absolute inset-2 rounded-full" />
                              <Skeleton className="absolute inset-4 rounded-full" />
                              <Skeleton className="absolute -top-2 -right-2 w-8 h-8 rounded-full" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Title Section */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Skeleton className="h-12 w-64 mx-auto" />
                            
                            {/* Decorative Line */}
                            <div className="flex items-center justify-center space-x-2">
                              <Skeleton className="h-1 w-8" />
                              <Skeleton className="h-2 w-20" />
                              <Skeleton className="h-1 w-8" />
                            </div>
                          </div>
                          
                          {/* Description */}
                          <div className="max-w-2xl mx-auto">
                            <div className="relative group">
                              <div className="relative bg-card/60 backdrop-blur-md rounded-2xl p-6 border border-border/30 shadow-xl">
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-3/4 mx-auto" />
                                  <Skeleton className="h-4 w-5/6 mx-auto" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Interactive Elements */}
                          <div className="flex items-center justify-center pt-6">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="w-3 h-3 rounded-full" />
                              <Skeleton className="w-2 h-2 rounded-full" />
                              <Skeleton className="w-3 h-3 rounded-full" />
                              <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Last Updated Info */}
                    <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Member List - Left Side */}
            <div className="col-span-4 order-1 space-y-4">
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
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="p-4 rounded-3xl border-2 border-dashed border-emerald-300/50 dark:border-emerald-600/50 bg-white/50 dark:bg-gray-800/50">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyBuilderNewSkeleton;
