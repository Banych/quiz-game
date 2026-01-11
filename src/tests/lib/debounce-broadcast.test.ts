import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDebouncedBroadcaster,
  getGlobalBroadcaster,
  resetGlobalBroadcaster,
} from '@lib/debounce-broadcast';

describe('debounce-broadcast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetGlobalBroadcaster();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDebouncedBroadcaster', () => {
    it('should debounce multiple rapid broadcasts into one', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      // Schedule 3 rapid broadcasts
      broadcaster.schedule('quiz-1');
      broadcaster.schedule('quiz-1');
      broadcaster.schedule('quiz-1');

      // No broadcast yet
      expect(mockBroadcast).not.toHaveBeenCalled();

      // Fast-forward 500ms
      await vi.advanceTimersByTimeAsync(500);

      // Should have called broadcast only once
      expect(mockBroadcast).toHaveBeenCalledTimes(1);
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-1');
    });

    it('should handle multiple different quiz IDs independently', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      broadcaster.schedule('quiz-1');
      broadcaster.schedule('quiz-2');
      broadcaster.schedule('quiz-3');

      await vi.advanceTimersByTimeAsync(500);

      expect(mockBroadcast).toHaveBeenCalledTimes(3);
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-1');
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-2');
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-3');
    });

    it('should reset timer when scheduling same quiz again', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      broadcaster.schedule('quiz-1');

      // Wait 300ms
      await vi.advanceTimersByTimeAsync(300);
      expect(mockBroadcast).not.toHaveBeenCalled();

      // Schedule again (resets timer)
      broadcaster.schedule('quiz-1');

      // Wait another 300ms (total 600ms from first schedule)
      await vi.advanceTimersByTimeAsync(300);

      // Still no broadcast yet (timer was reset)
      expect(mockBroadcast).not.toHaveBeenCalled();

      // Wait final 200ms to complete 500ms from second schedule
      await vi.advanceTimersByTimeAsync(200);

      // Now broadcast should have happened
      expect(mockBroadcast).toHaveBeenCalledTimes(1);
    });

    it('should flush all pending broadcasts immediately', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      broadcaster.schedule('quiz-1');
      broadcaster.schedule('quiz-2');

      // No broadcasts yet
      expect(mockBroadcast).not.toHaveBeenCalled();

      // Flush immediately
      await broadcaster.flush();

      // Should have broadcast both quizzes immediately
      expect(mockBroadcast).toHaveBeenCalledTimes(2);
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-1');
      expect(mockBroadcast).toHaveBeenCalledWith('quiz-2');

      // Wait 500ms
      await vi.advanceTimersByTimeAsync(500);

      // No additional broadcasts (timers were cleared)
      expect(mockBroadcast).toHaveBeenCalledTimes(2);
    });

    it('should handle broadcast errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockBroadcast = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      broadcaster.schedule('quiz-1');

      await vi.advanceTimersByTimeAsync(500);

      // Should have attempted broadcast
      expect(mockBroadcast).toHaveBeenCalledTimes(1);

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to broadcast leaderboard'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle flush errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockBroadcast = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 500);

      broadcaster.schedule('quiz-1');

      await broadcaster.flush();

      // Should have attempted broadcast
      expect(mockBroadcast).toHaveBeenCalledTimes(1);

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to flush broadcast'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should allow custom debounce duration', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = createDebouncedBroadcaster(mockBroadcast, 1000);

      broadcaster.schedule('quiz-1');

      // Wait 500ms (default duration)
      await vi.advanceTimersByTimeAsync(500);
      expect(mockBroadcast).not.toHaveBeenCalled();

      // Wait another 500ms to reach 1000ms
      await vi.advanceTimersByTimeAsync(500);
      expect(mockBroadcast).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGlobalBroadcaster', () => {
    it('should return singleton instance', () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);

      const broadcaster1 = getGlobalBroadcaster(mockBroadcast);
      const broadcaster2 = getGlobalBroadcaster(mockBroadcast);

      expect(broadcaster1).toBe(broadcaster2);
    });

    it('should reuse first broadcast function', async () => {
      const mockBroadcast1 = vi.fn().mockResolvedValue(undefined);
      const mockBroadcast2 = vi.fn().mockResolvedValue(undefined);

      const broadcaster1 = getGlobalBroadcaster(mockBroadcast1);
      // Second call should return same instance
      getGlobalBroadcaster(mockBroadcast2);

      broadcaster1.schedule('quiz-1');
      await vi.advanceTimersByTimeAsync(500);

      // Should use first broadcast function
      expect(mockBroadcast1).toHaveBeenCalledTimes(1);
      expect(mockBroadcast2).not.toHaveBeenCalled();
    });
  });

  describe('resetGlobalBroadcaster', () => {
    it('should flush pending broadcasts before resetting', async () => {
      const mockBroadcast = vi.fn().mockResolvedValue(undefined);
      const broadcaster = getGlobalBroadcaster(mockBroadcast);

      broadcaster.schedule('quiz-1');

      resetGlobalBroadcaster();

      // Should have flushed pending broadcast
      expect(mockBroadcast).toHaveBeenCalledTimes(1);

      // Next call should create new instance
      const mockBroadcast2 = vi.fn().mockResolvedValue(undefined);
      const newBroadcaster = getGlobalBroadcaster(mockBroadcast2);

      newBroadcaster.schedule('quiz-2');
      await vi.advanceTimersByTimeAsync(500);

      expect(mockBroadcast2).toHaveBeenCalledTimes(1);
    });

    it('should handle reset errors gracefully', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockBroadcast = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const broadcaster = getGlobalBroadcaster(mockBroadcast);

      broadcaster.schedule('quiz-1');

      // Should not throw
      expect(() => resetGlobalBroadcaster()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
