'use client';

import { ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RealtimeClientProvider } from '@hooks/use-realtime-client';
import { createNoopRealtimeClient } from '@infrastructure/realtime/noop-realtime-client';

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
  const realtimeClient = useMemo(createNoopRealtimeClient, []);

  return (
    <RealtimeClientProvider client={realtimeClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV !== 'production' ? (
          <ReactQueryDevtools buttonPosition="bottom-left" />
        ) : null}
      </QueryClientProvider>
    </RealtimeClientProvider>
  );
}
