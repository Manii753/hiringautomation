import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CandidateDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Hiring Manager Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Powered by n8n Automation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </Link>
          </div>

          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-8 w-24 mt-2" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-56" />
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 h-96 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-10/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-9/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-[150px] w-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDetailSkeleton;