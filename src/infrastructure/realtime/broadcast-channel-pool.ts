import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

const IDLE_TIMEOUT_MS = 30_000;

type PooledChannel = {
  channel: RealtimeChannel;
  idleTimer: ReturnType<typeof setTimeout> | null;
  ready: Promise<void>;
};

/**
 * Server-side channel pool for broadcast operations.
 * Reuses channels across multiple broadcasts to the same channel name,
 * with automatic cleanup after idle timeout.
 */
class BroadcastChannelPool {
  private readonly channels = new Map<string, PooledChannel>();

  async send(
    client: SupabaseClient,
    channelName: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    const pooled = this.getOrCreate(client, channelName);

    // Reset idle timer on each send
    this.resetIdleTimer(channelName);

    // Wait for channel to be subscribed
    await pooled.ready;

    await pooled.channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  private getOrCreate(
    client: SupabaseClient,
    channelName: string
  ): PooledChannel {
    const existing = this.channels.get(channelName);
    if (existing) return existing;

    const channel = client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

    const ready = new Promise<void>((resolve, reject) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve();
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          this.channels.delete(channelName);
          reject(
            new Error(
              `Broadcast channel ${channelName} failed with status ${status}`
            )
          );
        }
      });
    });

    const pooled: PooledChannel = { channel, idleTimer: null, ready };
    this.channels.set(channelName, pooled);
    this.resetIdleTimer(channelName);

    return pooled;
  }

  private resetIdleTimer(channelName: string): void {
    const pooled = this.channels.get(channelName);
    if (!pooled) return;

    if (pooled.idleTimer !== null) {
      clearTimeout(pooled.idleTimer);
    }

    pooled.idleTimer = setTimeout(() => {
      this.remove(channelName);
    }, IDLE_TIMEOUT_MS);
  }

  private remove(channelName: string): void {
    const pooled = this.channels.get(channelName);
    if (!pooled) return;

    if (pooled.idleTimer !== null) {
      clearTimeout(pooled.idleTimer);
    }

    this.channels.delete(channelName);

    void pooled.channel.unsubscribe().catch(() => {
      // Ignore unsubscribe errors during cleanup
    });
  }

  /** Remove all pooled channels. */
  clear(): void {
    for (const channelName of [...this.channels.keys()]) {
      this.remove(channelName);
    }
  }
}

/** Singleton pool instance for server-side broadcasts. */
export const broadcastPool = new BroadcastChannelPool();
