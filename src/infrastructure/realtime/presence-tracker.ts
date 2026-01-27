import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from '@supabase/supabase-js';

/**
 * Presence state tracked for each player.
 */
export type PresenceState = {
  playerId: string;
  playerName: string;
  joinedAt: string;
};

/**
 * Callback for presence events.
 */
export type PresenceEventHandler = (presences: PresenceState[]) => void;

/**
 * Callback for presence sync events with full state.
 */
export type PresenceSyncHandler = (
  state: Record<string, PresenceState[]>
) => void;

/**
 * Options for presence subscription.
 */
export type PresenceSubscribeOptions = {
  onSync?: PresenceSyncHandler;
  onJoin?: PresenceEventHandler;
  onLeave?: PresenceEventHandler;
};

/**
 * Interface for presence tracking operations.
 */
export interface IPresenceTracker {
  /**
   * Subscribe to presence events for a quiz.
   * Returns an unsubscribe function.
   */
  subscribe(
    quizId: string,
    playerId: string,
    options: PresenceSubscribeOptions
  ): () => void;

  /**
   * Track player presence (call after subscribe).
   */
  track(quizId: string, state: PresenceState): Promise<void>;

  /**
   * Untrack player presence (call before unsubscribe or on disconnect).
   */
  untrack(quizId: string): Promise<void>;

  /**
   * Get current presence state for a quiz.
   */
  getPresenceState(quizId: string): Record<string, PresenceState[]>;

  /**
   * Disconnect all presence channels.
   */
  disconnect(): void;
}

const PRESENCE_CHANNEL_PREFIX = 'presence:quiz:';

const getChannelName = (quizId: string): string =>
  `${PRESENCE_CHANNEL_PREFIX}${quizId}`;

const logPresenceIssue = (
  level: 'warn' | 'error',
  message: string,
  details: Record<string, unknown>
) => {
  if (level === 'error') {
    console.error(`[PresenceTracker] ${message}`, details);
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[PresenceTracker] ${message}`, details);
  }
};

/**
 * Supabase Presence Tracker implementation.
 * Uses Supabase Realtime Presence API to track player connections.
 */
class SupabasePresenceTracker implements IPresenceTracker {
  private readonly client: SupabaseClient;
  private readonly channels: Map<string, RealtimeChannel> = new Map();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  subscribe(
    quizId: string,
    playerId: string,
    options: PresenceSubscribeOptions
  ): () => void {
    const channelName = getChannelName(quizId);

    // Reuse existing channel if already subscribed
    let channel = this.channels.get(quizId);
    if (!channel) {
      channel = this.client.channel(channelName, {
        config: {
          presence: {
            key: playerId,
          },
        },
      });
      this.channels.set(quizId, channel);
    }

    // Set up presence event handlers
    if (options.onSync) {
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel!.presenceState<PresenceState>();
        options.onSync!(state);
      });
    }

    if (options.onJoin) {
      channel.on(
        'presence',
        { event: 'join' },
        ({ newPresences }: { newPresences: PresenceState[] }) => {
          options.onJoin!(newPresences);
        }
      );
    }

    if (options.onLeave) {
      channel.on(
        'presence',
        { event: 'leave' },
        ({ leftPresences }: { leftPresences: PresenceState[] }) => {
          options.onLeave!(leftPresences);
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        logPresenceIssue('warn', 'Presence subscription status changed', {
          quizId,
          playerId,
          status,
        });
      }
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(quizId);
    };
  }

  async track(quizId: string, state: PresenceState): Promise<void> {
    const channel = this.channels.get(quizId);
    if (!channel) {
      logPresenceIssue('warn', 'Cannot track: channel not found', { quizId });
      return;
    }

    try {
      await channel.track(state);
    } catch (error) {
      logPresenceIssue('error', 'Failed to track presence', {
        quizId,
        state,
        error,
      });
    }
  }

  async untrack(quizId: string): Promise<void> {
    const channel = this.channels.get(quizId);
    if (!channel) {
      return;
    }

    try {
      await channel.untrack();
    } catch (error) {
      logPresenceIssue('warn', 'Failed to untrack presence', { quizId, error });
    }
  }

  getPresenceState(quizId: string): Record<string, PresenceState[]> {
    const channel = this.channels.get(quizId);
    if (!channel) {
      return {};
    }
    return channel.presenceState<PresenceState>();
  }

  private async unsubscribe(quizId: string): Promise<void> {
    const channel = this.channels.get(quizId);
    if (!channel) {
      return;
    }

    try {
      await channel.untrack();
      await channel.unsubscribe();
    } catch (error) {
      logPresenceIssue('warn', 'Failed to unsubscribe from presence channel', {
        quizId,
        error,
      });
    } finally {
      this.channels.delete(quizId);
    }
  }

  disconnect(): void {
    for (const quizId of this.channels.keys()) {
      void this.unsubscribe(quizId);
    }
  }
}

/**
 * No-op presence tracker for when Supabase is not configured.
 */
class NoopPresenceTracker implements IPresenceTracker {
  subscribe(): () => void {
    return () => {};
  }

  async track(): Promise<void> {}

  async untrack(): Promise<void> {}

  getPresenceState(): Record<string, PresenceState[]> {
    return {};
  }

  disconnect(): void {}
}

const getClientEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey } as const;
};

let cachedTracker: IPresenceTracker | null = null;

/**
 * Creates or returns a cached presence tracker instance.
 * Uses Supabase Presence API when credentials are available,
 * otherwise returns a no-op tracker.
 */
export const getPresenceTracker = (): IPresenceTracker => {
  if (cachedTracker) {
    return cachedTracker;
  }

  const { url, anonKey } = getClientEnv();

  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[PresenceTracker] Supabase env vars missing; using no-op tracker'
      );
    }
    cachedTracker = new NoopPresenceTracker();
    return cachedTracker;
  }

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  cachedTracker = new SupabasePresenceTracker(client);
  return cachedTracker;
};

/**
 * Resets the cached tracker (useful for testing).
 */
export const resetPresenceTracker = (): void => {
  if (cachedTracker) {
    cachedTracker.disconnect();
    cachedTracker = null;
  }
};
