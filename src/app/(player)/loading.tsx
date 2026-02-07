import { Skeleton } from '@/components/ui/skeleton';

export default function PlayerLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Logo/title skeleton */}
        <Skeleton className="mx-auto h-10 w-32 bg-white/10" />

        {/* Form card skeleton */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <Skeleton className="mx-auto h-6 w-48 bg-white/10" />
          <Skeleton className="mx-auto mt-2 h-4 w-64 bg-white/10" />

          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
            <Skeleton className="h-12 w-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
