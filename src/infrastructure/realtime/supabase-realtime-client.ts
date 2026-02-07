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

const safeUnsubscribe = async (
  channel: RealtimeChannel,
  context: Record<string, unknown>
) => {
  try {
    await channel.unsubscribe();
  } catch (error) {
    logChannelIssue('warn', 'Failed to unsubscribe from Supabase channel', {
      ...context,
      error,
    });
  }
};

class SupabaseRealtimeClient implements RealtimeClient {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  subscribe<TPayload = unknown>(
    channelName: string,
    event: string,
    handler: RealtimeEventHandler<TPayload>
  ): RealtimeUnsubscribe {
    const channel = this.client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

    channel.on('broadcast', { event }, (payload) => {
      handler(payload.payload as TPayload);
    });

    channel.subscribe((status) => {
      // Only log actual errors, not intermediate states like 'SUBSCRIBING'
      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        logChannelIssue('error', 'Supabase subscription error', {
          channelName,
          event,
          status,
        });
      }
    });

    return () => {
      void safeUnsubscribe(channel, { channelName, event, action: 'client' });
    };
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
            await safeUnsubscribe(channel, {
              channelName,
              event,
              action: 'emit',
            });
          }
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          // Only reject on actual error states, not intermediate states like 'SUBSCRIBING'
          await safeUnsubscribe(channel, {
            channelName,
            event,
            action: 'emit-error',
          });
          reject(
            new Error(
              `Supabase channel ${channelName} failed with status ${status}`
            )
          );
        }
        // Ignore intermediate states like 'SUBSCRIBING' - wait for final state
      });
    });
  }

  disconnect(): void {
    this.client.removeAllChannels();
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
