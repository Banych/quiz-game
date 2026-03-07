import { Skeleton } from '@/components/ui/skeleton';

export default function HostLoading() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-6 w-40" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
