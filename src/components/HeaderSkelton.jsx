'use client';

import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderSkeleton() {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">

          {/* Left side: title and subtitle */}
          <div className="flex flex-col space-y-1 min-w-0">
            <Skeleton className="h-5 w-24 sm:w-48" />
            <Skeleton className="hidden sm:block h-3 w-32" />
          </div>

          {/* Right side: profile / buttons / dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="hidden sm:block h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
        </div>
      </div>
    </header>
  );
}
