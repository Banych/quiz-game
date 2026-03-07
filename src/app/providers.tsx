'use client';

import { ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { RealtimeClientProvider } from '@hooks/use-realtime-client';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then(
      (mod) => mod.ReactQueryDevtools
    ),
  { ssr: false }
);
import { createNoopRealtimeClient } from '@infrastructure/realtime/noop-realtime-client';
import { createSupabaseRealtimeClient } from '@infrastructure/realtime/supabase-realtime-client';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  });

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const realtimeClient = useMemo(() => {
    return createSupabaseRealtimeClient() ?? createNoopRealtimeClient();
  }, []);

  return (
    <RealtimeClientProvider client={realtimeClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV !== 'production' && (
          <ReactQueryDevtools buttonPosition="bottom-left" />
        )}
      </QueryClientProvider>
    </RealtimeClientProvider>
  );
}
