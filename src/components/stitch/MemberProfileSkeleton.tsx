import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lightweight skeleton that matches the StitchMemberProfile layout.
 * Shown briefly when opening a member profile to give an instant
 * "loading" feel even when the data is already cached locally.
 */
const StitchMemberProfileSkeleton: React.FC = () => {
  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-4 sm:p-6 md:p-8 custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Avatar */}
            <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full shrink-0" />

            {/* Name + meta */}
            <div className="flex-1 w-full space-y-3 text-center md:text-start">
              <Skeleton className="h-7 w-3/4 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-1/2 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-1/3 mx-auto md:mx-0" />
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 px-6 py-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
              >
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Side column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StitchMemberProfileSkeleton;