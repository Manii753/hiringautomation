'use client';

import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderSkeleton() {
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Left side: title and subtitle */}
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-5 w-48" /> {/* Title placeholder */}
            <Skeleton className="h-3 w-32" /> {/* Subtitle placeholder */}
          </div>

          {/* Right side: profile / buttons / dropdown */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle placeholder */}
            <Skeleton className="h-6 w-6 rounded-full" />

            {/* User name badge placeholder */}
            <Skeleton className="h-6 w-20 rounded-full" />

            {/* User image placeholder */}
            <Skeleton className="h-8 w-8 rounded-full" />

            {/* Menu icon placeholder */}
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
        </div>
      </div>
    </header>
  );
}
