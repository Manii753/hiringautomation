import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const CandidateDetailSkeleton = () => {
  return (
    <div className="h-[calc(100dvh-57px)] sm:h-[calc(100dvh-65px)] overflow-hidden flex flex-col bg-background">
      {/* Top bar */}
      <header className="shrink-0 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 border-b">
        <Skeleton className="h-8 w-8 sm:w-28 rounded-md" />
        <span className="text-muted-foreground/30 hidden sm:inline">/</span>
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="hidden md:block h-4 w-32" />
        <Skeleton className="h-6 w-16 rounded-md" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="hidden md:block h-4 w-24" />
          <Skeleton className="h-8 w-8 sm:w-28 rounded-md" />
          <Skeleton className="h-8 w-8 sm:w-28 rounded-md" />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left rail */}
        <aside className="w-full lg:w-80 lg:shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Identity */}
            <div className="flex flex-col items-center text-center pb-4 border-b">
              <Skeleton className="h-16 w-16 rounded-full mb-3" />
              <Skeleton className="h-5 w-40 mb-1.5" />
              <Skeleton className="h-3 w-32 mt-1" />
              <div className="mt-3 flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-5 rounded-md" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Interview */}
            <div className="border-t pt-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>

            {/* Job */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-5 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>

            {/* Manatal */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-3 rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Slack */}
            <div className="border-t pt-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Tabs strip */}
          <div className="shrink-0 flex items-center gap-1 px-3 sm:px-5 border-b h-11">
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2 px-3">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="h-full flex flex-col">
              {/* Tab header */}
              <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-md shrink-0" />
              </div>

              {/* Tab body */}
              <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 overflow-hidden">
                {/* Featured callout */}
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-6 w-3/4" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  </div>
                </div>

                {/* Content card */}
                <div className="rounded-lg border p-5 space-y-5">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-9/12" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateDetailSkeleton;
