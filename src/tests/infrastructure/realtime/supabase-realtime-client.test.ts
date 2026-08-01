import type {
  RealtimeClient,
  RealtimeEventHandler,
} from '@infrastructure/realtime/realtime-client';
import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Test implementation of SupabaseRealtimeClient's channel tracking logic.
 * We test the behavior (channel reuse, listener counting, closing flag)
 * without needing actual Supabase connections.
 */

type TrackedChannel = {
  listenerCount: number;
  handlers: Array<{ event: string; handler: RealtimeEventHandler }>;
  subscribed: boolean;
  unsubscribed: boolean;
};

class TestableRealtimeClient implements RealtimeClient {
  readonly trackedChannels = new Map<string, TrackedChannel>();
  private readonly closingChannels = new Set<string>();
  readonly errorLog: Array<{
    message: string;
    details: Record<string, unknown>;
  }> = [];

  subscribe<TPayload = unknown>(
    channelName: string,
    event: string,
    handler: RealtimeEventHandler<TPayload>
  ): () => void {
    const existing = this.trackedChannels.get(channelName);

    if (existing) {
      existing.handlers.push({
        event,
        handler: handler as RealtimeEventHandler,
      });
      existing.listenerCount++;
      return () => this.removeListener(channelName);
    }

    const tracked: TrackedChannel = {
      listenerCount: 1,
      handlers: [{ event, handler: handler as RealtimeEventHandler }],
      subscribed: true,
      unsubscribed: false,
    };
    this.trackedChannels.set(channelName, tracked);

    return () => this.removeListener(channelName);
  }

  private removeListener(channelName: string): void {
    const tracked = this.trackedChannels.get(channelName);
    if (!tracked) return;

    tracked.listenerCount--;

    if (tracked.listenerCount <= 0) {
      this.closingChannels.add(channelName);
      tracked.unsubscribed = true;
      this.trackedChannels.delete(channelName);
      this.closingChannels.delete(channelName);
    }
  }

  isClosing(channelName: string): boolean {
    return this.closingChannels.has(channelName);
  }

  async emit<TPayload = unknown>(): Promise<void> {
    // Not tested here
  }

  disconnect(): void {
    this.trackedChannels.clear();
    this.closingChannels.clear();
  }

  // Test helper: simulate receiving a broadcast
  simulateBroadcast(
    channelName: string,
    event: string,
    payload: unknown
  ): void {
    const tracked = this.trackedChannels.get(channelName);
    if (!tracked) return;

    for (const h of tracked.handlers) {
      if (h.event === event) {
        h.handler(payload);
      }
    }
  }
}

describe('SupabaseRealtimeClient channel tracking', () => {
  let client: TestableRealtimeClient;

  beforeEach(() => {
    client = new TestableRealtimeClient();
  });

  describe('channel reuse', () => {
    it('should create a single channel for multiple subscriptions to the same channel', () => {
      client.subscribe('quiz:123', 'state:update', vi.fn());
      client.subscribe('quiz:123', 'leaderboard:update', vi.fn());

      expect(client.trackedChannels.size).toBe(1);
      const tracked = client.trackedChannels.get('quiz:123');
      expect(tracked?.listenerCount).toBe(2);
      expect(tracked?.handlers).toHaveLength(2);
    });

    it('should create separate channels for different channel names', () => {
      client.subscribe('quiz:123', 'state:update', vi.fn());
      client.subscribe('quiz:456', 'state:update', vi.fn());

      expect(client.trackedChannels.size).toBe(2);
    });

    it('should deliver events to all handlers on the same channel', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.subscribe('quiz:123', 'state:update', handler1);
      client.subscribe('quiz:123', 'state:update', handler2);

      client.simulateBroadcast('quiz:123', 'state:update', { foo: 'bar' });

      expect(handler1).toHaveBeenCalledWith({ foo: 'bar' });
      expect(handler2).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('should only deliver events to matching event handlers', () => {
      const stateHandler = vi.fn();
      const leaderboardHandler = vi.fn();

      client.subscribe('quiz:123', 'state:update', stateHandler);
      client.subscribe('quiz:123', 'leaderboard:update', leaderboardHandler);

      client.simulateBroadcast('quiz:123', 'state:update', { state: 'active' });

      expect(stateHandler).toHaveBeenCalledWith({ state: 'active' });
      expect(leaderboardHandler).not.toHaveBeenCalled();
    });
  });

  describe('listener counting', () => {
    it('should not unsubscribe channel when some listeners remain', () => {
      const unsub1 = client.subscribe('quiz:123', 'state:update', vi.fn());
      client.subscribe('quiz:123', 'leaderboard:update', vi.fn());

      unsub1();

      // Channel should still exist with 1 listener
      expect(client.trackedChannels.has('quiz:123')).toBe(true);
      expect(client.trackedChannels.get('quiz:123')?.listenerCount).toBe(1);
    });

    it('should unsubscribe channel when last listener is removed', () => {
      const unsub1 = client.subscribe('quiz:123', 'state:update', vi.fn());
      const unsub2 = client.subscribe(
        'quiz:123',
        'leaderboard:update',
        vi.fn()
      );

      unsub1();
      unsub2();

      expect(client.trackedChannels.has('quiz:123')).toBe(false);
    });

    it('should handle multiple unsubscribe calls gracefully', () => {
      const unsub = client.subscribe('quiz:123', 'state:update', vi.fn());

      unsub();
      unsub(); // Should not throw

      expect(client.trackedChannels.has('quiz:123')).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should clear all tracked channels', () => {
      client.subscribe('quiz:123', 'state:update', vi.fn());
      client.subscribe('quiz:456', 'state:update', vi.fn());

      client.disconnect();

      expect(client.trackedChannels.size).toBe(0);
    });
  });

  describe('subscribe returns unsubscribe function', () => {
    it('should return a function', () => {
      const unsub = client.subscribe('quiz:123', 'state:update', vi.fn());
      expect(typeof unsub).toBe('function');
    });
  });
});

import { SupabaseRealtimeClient } from '@infrastructure/realtime/supabase-realtime-client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Supabase channel/client for testing SupabaseRealtimeClient's real
 * dispatcher-registry logic (not a stand-in fake -- this exercises the
 * actual class, mocking only the Supabase client boundary).
 */
type MockChannel = {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  emit: (event: string, payload: unknown) => void;
};

const createMockChannel = (): MockChannel => {
  const listeners = new Map<string, (payload: { payload: unknown }) => void>();

  return {
    on: vi.fn(
      (
        _type: string,
        filter: { event: string },
        callback: (payload: { payload: unknown }) => void
      ) => {
        listeners.set(filter.event, callback);
      }
    ),
    subscribe: vi.fn((callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
    }),
    unsubscribe: vi.fn().mockResolvedValue('ok'),
    emit: (event, payload) => {
      listeners.get(event)?.({ payload });
    },
  };
};

const createMockClient = () => {
  const channelsByName = new Map<string, MockChannel>();
  const channel = vi.fn((name: string) => {
    const mockChannel = createMockChannel();
    channelsByName.set(name, mockChannel);
    return mockChannel;
  });
  return {
    client: { channel } as unknown as SupabaseClient,
    channelsByName,
    channelFn: channel,
  };
};

describe('SupabaseRealtimeClient (real class)', () => {
  it('binds the real channel.on listener only once per (channel, event) pair', () => {
    const { client, channelsByName } = createMockClient();
    const realtimeClient = new SupabaseRealtimeClient(client);

    realtimeClient.subscribe('quiz:123', 'answer:ack', vi.fn());
    realtimeClient.subscribe('quiz:123', 'answer:ack', vi.fn());
    realtimeClient.subscribe('quiz:123', 'answer:ack', vi.fn());

    const channel = channelsByName.get('quiz:123')!;
    expect(channel.on).toHaveBeenCalledTimes(1);
  });

  it('stops delivering to a handler after its unsubscribe is called, without affecting others', () => {
    const { client, channelsByName } = createMockClient();
    const realtimeClient = new SupabaseRealtimeClient(client);

    const handlerA = vi.fn();
    const unsubscribeA = realtimeClient.subscribe(
      'quiz:123',
      'answer:ack',
      handlerA
    );
    const handlerB = vi.fn();
    realtimeClient.subscribe('quiz:123', 'answer:ack', handlerB);

    unsubscribeA();

    const channel = channelsByName.get('quiz:123')!;
    channel.emit('answer:ack', { answerId: 'a1' });

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledWith({ answerId: 'a1' });
  });

  it('regression: repeated subscribe/unsubscribe churn on the same (channel, event) -- as happens every second while a countdown timer re-renders a component -- never accumulates duplicate deliveries', () => {
    const { client, channelsByName } = createMockClient();
    const realtimeClient = new SupabaseRealtimeClient(client);

    // Simulate 5 renders' worth of effect teardown+resubscribe, each with a
    // brand-new closure (exactly what a non-memoized effect dependency causes).
    let lastHandler = vi.fn();
    let unsubscribe = realtimeClient.subscribe(
      'quiz:123',
      'answer:ack',
      lastHandler
    );
    for (let i = 0; i < 4; i++) {
      unsubscribe();
      lastHandler = vi.fn();
      unsubscribe = realtimeClient.subscribe(
        'quiz:123',
        'answer:ack',
        lastHandler
      );
    }

    const channel = channelsByName.get('quiz:123')!;
    channel.emit('answer:ack', { answerId: 'a1' });

    expect(lastHandler).toHaveBeenCalledTimes(1);
    expect(channel.on).toHaveBeenCalledTimes(1);
  });

  it('tears down the real channel once the last listener across all events is removed', () => {
    const { client, channelsByName } = createMockClient();
    const realtimeClient = new SupabaseRealtimeClient(client);

    const unsubscribe1 = realtimeClient.subscribe(
      'quiz:123',
      'state:update:player',
      vi.fn()
    );
    const unsubscribe2 = realtimeClient.subscribe(
      'quiz:123',
      'answer:ack',
      vi.fn()
    );

    unsubscribe1();
    const channel = channelsByName.get('quiz:123')!;
    expect(channel.unsubscribe).not.toHaveBeenCalled();

    unsubscribe2();
    expect(channel.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('supports multiple distinct events on the same channel independently', () => {
    const { client, channelsByName } = createMockClient();
    const realtimeClient = new SupabaseRealtimeClient(client);

    const stateHandler = vi.fn();
    const ackHandler = vi.fn();
    realtimeClient.subscribe('quiz:123', 'state:update:player', stateHandler);
    realtimeClient.subscribe('quiz:123', 'answer:ack', ackHandler);

    const channel = channelsByName.get('quiz:123')!;
    expect(channel.on).toHaveBeenCalledTimes(2);

    channel.emit('answer:ack', { answerId: 'a1' });
    expect(ackHandler).toHaveBeenCalledTimes(1);
    expect(stateHandler).not.toHaveBeenCalled();
  });
});
