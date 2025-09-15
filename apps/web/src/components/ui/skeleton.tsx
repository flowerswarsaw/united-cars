import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)}
      {...props}
    />
  );
}

export function DealCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "group relative rounded-lg border bg-gradient-to-br from-card to-card/95 shadow-sm border-slate-200/60 dark:border-slate-700/60 p-2.5 sm:p-3 mb-1.5 sm:mb-2 animate-pulse",
      className
    )}>
      <div className="space-y-2 relative">
        {/* Header with title and time */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        {/* Amount and probability */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        
        {/* Organisation and Contact links */}
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-2/3 rounded-md" />
        </div>
        
        {/* Tasks Section placeholder */}
        <div className="p-2.5 bg-slate-50/60 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3.5 w-3.5" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-6 rounded-full" />
              <Skeleton className="h-4 w-6 rounded-full" />
              <Skeleton className="h-3 w-3" />
            </div>
          </div>
        </div>
        
        {/* Bottom actions and info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          <Skeleton className="h-6 w-20 rounded-md" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function KanbanStageSkeleton({ dealCount = 3, className }: { dealCount?: number; className?: string }) {
  return (
    <div className={cn(
      "flex-none w-64 sm:w-72 md:w-80 lg:w-84 xl:w-88 max-w-full h-full animate-in fade-in-0 slide-in-from-bottom-4",
      className
    )}>
      {/* Stage Header Skeleton */}
      <div className="mb-2">
        <div className="bg-gradient-to-r from-card/90 via-card to-card/90 backdrop-blur-md rounded-xl shadow-md shadow-slate-200/40 dark:shadow-slate-900/40 border border-slate-200/70 dark:border-slate-700/70 p-3.5 flex items-center justify-between min-h-[3rem] animate-pulse">
          <div className="flex items-center min-w-0 flex-1 gap-3">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-8 rounded-md" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>

      {/* Stage Column Content Skeleton */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="w-full h-full max-w-full overflow-hidden bg-gradient-to-br from-card/80 via-card/90 to-muted/20 border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3 flex flex-col relative h-full animate-pulse">
          
          {/* Scrollable deals container skeleton */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <div className="space-y-2 pb-2">
              {Array.from({ length: dealCount }).map((_, index) => (
                <DealCardSkeleton key={index} />
              ))}
            </div>
          </div>
          
          {/* Add Deal button skeleton */}
          <div className="flex-shrink-0 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 w-full">
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}