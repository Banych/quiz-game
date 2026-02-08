import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * Test the broadcast channel pool logic: channel reuse, idle cleanup.
 * Uses a mock SupabaseClient to avoid real connections.
 */

type MockChannel = {
  sendCalls: Array<{ type: string; event: string; payload: unknown }>;
  unsubscribed: boolean;
};

const createMockClient = () => {
  const channelMocks = new Map<string, MockChannel>();

  return {
    channelMocks,
    channel: vi.fn((name: string) => {
      let mock = channelMocks.get(name);
      if (!mock) {
        mock = { sendCalls: [], unsubscribed: false };
        channelMocks.set(name, mock);
      }
      const mockRef = mock;
      return {
        subscribe: (cb?: (status: string) => void) => {
          // Resolve synchronously so tests don't deadlock with fake timers
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        },
        send: vi.fn(
          async (msg: { type: string; event: string; payload: unknown }) => {
            mockRef.sendCalls.push(msg);
          }
        ),
        unsubscribe: vi.fn(async () => {
          mockRef.unsubscribed = true;
        }),
      };
    }),
  };
};

// Inline pool implementation for testing (avoids importing singleton)
class TestBroadcastChannelPool {
  private readonly channels = new Map<
    string,
    {
      channel: ReturnType<ReturnType<typeof createMockClient>['channel']>;
      idleTimer: ReturnType<typeof setTimeout> | null;
      ready: Promise<void>;
    }
  >();

  async send(
    client: ReturnType<typeof createMockClient>,
    channelName: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    const pooled = this.getOrCreate(client, channelName);
    this.resetIdleTimer(channelName);
    await pooled.ready;
    await pooled.channel.send({ type: 'broadcast', event, payload });
  }

  private getOrCreate(
    client: ReturnType<typeof createMockClient>,
    channelName: string
  ) {
    const existing = this.channels.get(channelName);
    if (existing) return existing;

    const channel = client.channel(channelName);

    const ready = new Promise<void>((resolve, reject) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') resolve();
        else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          this.channels.delete(channelName);
          reject(new Error(`Channel ${channelName} failed: ${status}`));
        }
      });
    });

    const pooled = {
      channel,
      idleTimer: null as ReturnType<typeof setTimeout> | null,
      ready,
    };
    this.channels.set(channelName, pooled);
    this.resetIdleTimer(channelName);
    return pooled;
  }

  private resetIdleTimer(channelName: string): void {
    const pooled = this.channels.get(channelName);
    if (!pooled) return;

    if (pooled.idleTimer !== null) clearTimeout(pooled.idleTimer);

    pooled.idleTimer = setTimeout(() => {
      this.remove(channelName);
    }, 30_000);
  }

  private remove(channelName: string): void {
    const pooled = this.channels.get(channelName);
    if (!pooled) return;

    if (pooled.idleTimer !== null) clearTimeout(pooled.idleTimer);
    this.channels.delete(channelName);
    void pooled.channel.unsubscribe();
  }

  get size(): number {
    return this.channels.size;
  }

  clear(): void {
    for (const channelName of [...this.channels.keys()]) {
      this.remove(channelName);
    }
  }
}

describe('BroadcastChannelPool', () => {
  let pool: TestBroadcastChannelPool;

  beforeEach(() => {
    vi.useFakeTimers();
    pool = new TestBroadcastChannelPool();
  });

  afterEach(() => {
    pool.clear();
    vi.useRealTimers();
  });

  describe('channel reuse', () => {
    it('should create only one channel for multiple sends to the same channel', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', { data: 1 });
      await pool.send(client, 'quiz:123', 'state:update', { data: 2 });

      expect(client.channel).toHaveBeenCalledTimes(1);
      expect(pool.size).toBe(1);
    });

    it('should create separate channels for different channel names', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', { data: 1 });
      await pool.send(client, 'quiz:456', 'state:update', { data: 2 });

      expect(client.channel).toHaveBeenCalledTimes(2);
      expect(pool.size).toBe(2);
    });

    it('should send data through reused channels', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', { round: 1 });
      await pool.send(client, 'quiz:123', 'leaderboard:update', {
        scores: [],
      });

      const mock = client.channelMocks.get('quiz:123');
      expect(mock?.sendCalls).toHaveLength(2);
      expect(mock?.sendCalls[0]).toEqual({
        type: 'broadcast',
        event: 'state:update',
        payload: { round: 1 },
      });
      expect(mock?.sendCalls[1]).toEqual({
        type: 'broadcast',
        event: 'leaderboard:update',
        payload: { scores: [] },
      });
    });
  });

  describe('idle cleanup', () => {
    it('should remove channel after idle timeout', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', {});

      expect(pool.size).toBe(1);

      vi.advanceTimersByTime(30_001);

      expect(pool.size).toBe(0);
    });

    it('should reset idle timer on subsequent sends', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', {});

      vi.advanceTimersByTime(20_000);
      expect(pool.size).toBe(1);

      await pool.send(client, 'quiz:123', 'state:update', {});

      vi.advanceTimersByTime(20_000);
      expect(pool.size).toBe(1);

      vi.advanceTimersByTime(11_000);
      expect(pool.size).toBe(0);
    });

    it('should unsubscribe channel on idle cleanup', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', {});

      const mock = client.channelMocks.get('quiz:123');
      expect(mock?.unsubscribed).toBe(false);

      vi.advanceTimersByTime(30_001);

      expect(mock?.unsubscribed).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all pooled channels', async () => {
      const client = createMockClient();

      await pool.send(client, 'quiz:123', 'state:update', {});
      await pool.send(client, 'quiz:456', 'state:update', {});

      expect(pool.size).toBe(2);

      pool.clear();

      expect(pool.size).toBe(0);
    });
  });
});
