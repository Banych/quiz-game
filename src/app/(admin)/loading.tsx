import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-2 h-4 w-40" />
            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Quick start section skeleton */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-32" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>
    </div>
  );
}
