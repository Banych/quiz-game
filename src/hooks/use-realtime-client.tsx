'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { RealtimeClient } from '@infrastructure/realtime/realtime-client';

const RealtimeClientContext = createContext<RealtimeClient | null>(null);

export type RealtimeClientProviderProps = {
  client: RealtimeClient;
  children: ReactNode;
};

export const RealtimeClientProvider = ({
  client,
  children,
}: RealtimeClientProviderProps) => (
  <RealtimeClientContext.Provider value={client}>
    {children}
  </RealtimeClientContext.Provider>
);

export const useRealtimeClient = (): RealtimeClient => {
  const client = useContext(RealtimeClientContext);

  if (!client) {
    throw new Error(
      'RealtimeClientProvider is missing from the component tree.'
    );
  }

  return client;
};
