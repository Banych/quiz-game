import type { RealtimeClient, RealtimeUnsubscribe } from './realtime-client';

class NoopRealtimeClient implements RealtimeClient {
  subscribe(): RealtimeUnsubscribe {
    return () => undefined;
  }

  async emit(): Promise<void> {
    return undefined;
  }

  disconnect(): void {
    // no-op
  }
}

export const createNoopRealtimeClient = (): RealtimeClient =>
  new NoopRealtimeClient();
