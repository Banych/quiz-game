import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js';
import type {
  RealtimeClient,
  RealtimeEventHandler,
  RealtimeUnsubscribe,
} from './realtime-client';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

const logChannelIssue = (
  level: 'warn' | 'error',
  message: string,
  details: Record<string, unknown>
) => {
  if (level === 'error') {
    console.error(message, details);
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(message, details);
  }
};

type TrackedChannel = {
  channel: RealtimeChannel;
  listenerCount: number;
};

class SupabaseRealtimeClient implements RealtimeClient {
  private readonly client: SupabaseClient;
  private readonly channels = new Map<string, TrackedChannel>();
  private readonly closingChannels = new Set<string>();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  subscribe<TPayload = unknown>(
    channelName: string,
    event: string,
    handler: RealtimeEventHandler<TPayload>
  ): RealtimeUnsubscribe {
    const existing = this.channels.get(channelName);

    if (existing) {
      // Reuse existing channel — just add the event listener
      existing.channel.on('broadcast', { event }, (payload) => {
        handler(payload.payload as TPayload);
      });
      existing.listenerCount++;

      return () => {
        this.removeListener(channelName);
      };
    }

    // Create new channel
    const channel = this.client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

    channel.on('broadcast', { event }, (payload) => {
      handler(payload.payload as TPayload);
    });

    this.channels.set(channelName, { channel, listenerCount: 1 });

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logChannelIssue('error', 'Supabase subscription error', {
          channelName,
          event,
          status,
        });
      } else if (
        status === 'CLOSED' &&
        !this.closingChannels.has(channelName)
      ) {
        // Only log CLOSED as error when it's unexpected (not intentional unsubscribe)
        logChannelIssue('error', 'Supabase subscription error', {
          channelName,
          event,
          status,
        });
      }
    });

    return () => {
      this.removeListener(channelName);
    };
  }

  private removeListener(channelName: string): void {
    const tracked = this.channels.get(channelName);
    if (!tracked) return;

    tracked.listenerCount--;

    if (tracked.listenerCount <= 0) {
      this.closingChannels.add(channelName);
      this.channels.delete(channelName);

      void tracked.channel
        .unsubscribe()
        .catch((error: unknown) => {
          logChannelIssue(
            'warn',
            'Failed to unsubscribe from Supabase channel',
            {
              channelName,
              error,
            }
          );
        })
        .finally(() => {
          this.closingChannels.delete(channelName);
        });
    }
  }

  async emit<TPayload = unknown>(
    channelName: string,
    event: string,
    payload: TPayload
  ): Promise<void> {
    const channel = this.client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.send({
              type: 'broadcast',
              event,
              payload,
            });

            resolve();
          } catch (sendError) {
            reject(sendError);
          } finally {
            try {
              await channel.unsubscribe();
            } catch (error) {
              logChannelIssue(
                'warn',
                'Failed to unsubscribe from Supabase channel',
                { channelName, event, action: 'emit', error }
              );
            }
          }
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          try {
            await channel.unsubscribe();
          } catch (error) {
            logChannelIssue(
              'warn',
              'Failed to unsubscribe from Supabase channel',
              { channelName, event, action: 'emit-error', error }
            );
          }
          reject(
            new Error(
              `Supabase channel ${channelName} failed with status ${status}`
            )
          );
        }
      });
    });
  }

  disconnect(): void {
    this.client.removeAllChannels();
    this.channels.clear();
    this.closingChannels.clear();
  }
}

const getClientEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey } as const;
};

export const createSupabaseRealtimeClient = (): RealtimeClient | null => {
  const { url, anonKey } = getClientEnv();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase realtime env vars missing; falling back to no-op');
    }
    return null;
  }

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 3,
      },
    },
  });

  return new SupabaseRealtimeClient(client);
};
