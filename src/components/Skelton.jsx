import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

const CandidateListSkeleton = () => {
  return (
    <div className="h-full space-y-3 sm:space-y-6">
      {/* Search and Filter Controls Skeleton */}
      <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-9 w-full md:max-w-sm" />
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <Skeleton className="h-9 flex-1 sm:flex-none sm:w-33" />
          <Skeleton className="h-9 flex-1 sm:flex-none sm:w-33" />
          <Skeleton className="h-9 flex-1 sm:flex-none sm:w-33" />
          <Skeleton className="h-9 w-32 sm:w-70" />
          <Button variant="outline" size="sm"><RefreshCcw className="h-4 w-4 animate-spin" /></Button>
        </div>
      </div>

      {/* Mobile card list skeleton */}
      <div className="md:hidden">
        <ScrollArea className="h-[calc(100vh-260px)] w-full">
          <div className="space-y-2">
            {[...Array(8)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop / tablet table skeleton */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-243px)] w-full overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Interview Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {[...Array(12)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-28" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateListSkeleton;
