export type RealtimeEventHandler<TPayload = unknown> = (
  payload: TPayload
) => void;

export type RealtimeUnsubscribe = () => void;

/**
 * Generic transport contract so we can swap between Socket.IO, Supabase, etc.
 */
export interface RealtimeClient {
  subscribe<TPayload = unknown>(
    channel: string,
    event: string,
    handler: RealtimeEventHandler<TPayload>
  ): RealtimeUnsubscribe;

  emit<TPayload = unknown>(
    channel: string,
    event: string,
    payload: TPayload
  ): Promise<void> | void;

  disconnect(): void;
}
