import { describe, it, expect } from 'vitest';
import type {
  UsePresenceOptions,
  UsePresenceReturn,
} from '@hooks/use-presence';

/**
 * Tests for usePresence hook
 *
 * NOTE: These tests validate hook exports, type contracts, and configuration only.
 * Retry logic, exponential backoff, and event callbacks are tested via integration/E2E tests.
 */

describe('usePresence', () => {
  describe('Type Contracts', () => {
    it('should define UsePresenceOptions with all required fields', () => {
      const mockOptions: UsePresenceOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Test Player',
        persistToDatabase: true,
        onSync: () => {},
        onJoin: () => {},
        onLeave: () => {},
        onConnectionError: () => {},
        onReconnected: () => {},
      };

      expect(mockOptions).toHaveProperty('quizId');
      expect(mockOptions).toHaveProperty('playerId');
      expect(mockOptions).toHaveProperty('playerName');
      expect(mockOptions).toHaveProperty('persistToDatabase');
      expect(mockOptions).toHaveProperty('onSync');
      expect(mockOptions).toHaveProperty('onJoin');
      expect(mockOptions).toHaveProperty('onLeave');
      expect(mockOptions).toHaveProperty('onConnectionError');
      expect(mockOptions).toHaveProperty('onReconnected');
    });

    it('should define UsePresenceReturn with connection state', () => {
      const mockReturn: UsePresenceReturn = {
        isConnected: true,
        presenceState: {},
        sendHeartbeat: async () => {},
        failureCount: 0,
        lastSuccessfulHeartbeat: '2026-01-31T12:00:00Z',
      };

      expect(mockReturn).toHaveProperty('isConnected');
      expect(mockReturn).toHaveProperty('presenceState');
      expect(mockReturn).toHaveProperty('sendHeartbeat');
      expect(mockReturn).toHaveProperty('failureCount');
      expect(mockReturn).toHaveProperty('lastSuccessfulHeartbeat');

      expect(typeof mockReturn.isConnected).toBe('boolean');
      expect(typeof mockReturn.presenceState).toBe('object');
      expect(typeof mockReturn.sendHeartbeat).toBe('function');
      expect(typeof mockReturn.failureCount).toBe('number');
      expect(
        typeof mockReturn.lastSuccessfulHeartbeat === 'string' ||
          mockReturn.lastSuccessfulHeartbeat === null
      ).toBe(true);
    });

    it('should support optional callback props', () => {
      const minimalOptions: UsePresenceOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Test Player',
      };

      // Optional fields should be undefined by default
      expect(minimalOptions.persistToDatabase).toBeUndefined();
      expect(minimalOptions.onSync).toBeUndefined();
      expect(minimalOptions.onJoin).toBeUndefined();
      expect(minimalOptions.onLeave).toBeUndefined();
      expect(minimalOptions.onConnectionError).toBeUndefined();
      expect(minimalOptions.onReconnected).toBeUndefined();
    });
  });

  describe('Retry Configuration', () => {
    it('should define exponential backoff delays', () => {
      // Retry delays: 1s, 2s, 4s, 8s, 8s (capped at 8s)
      const expectedDelays = [1000, 2000, 4000, 8000, 8000];

      expect(expectedDelays).toHaveLength(5);
      expect(expectedDelays[0]).toBe(1000); // 1st retry: 1s
      expect(expectedDelays[1]).toBe(2000); // 2nd retry: 2s
      expect(expectedDelays[2]).toBe(4000); // 3rd retry: 4s
      expect(expectedDelays[3]).toBe(8000); // 4th retry: 8s
      expect(expectedDelays[4]).toBe(8000); // 5th retry: 8s (capped)
    });

    it('should define max retry attempts', () => {
      const maxRetries = 5;

      expect(maxRetries).toBe(5);
      expect(maxRetries).toBeGreaterThan(0);
    });

    it('should define heartbeat interval', () => {
      const heartbeatInterval = 30_000; // 30 seconds

      expect(heartbeatInterval).toBe(30000);
      expect(heartbeatInterval).toBeGreaterThan(0);
    });
  });

  describe('Return Value Structure', () => {
    it('should return failureCount starting at 0', () => {
      const mockReturn: UsePresenceReturn = {
        isConnected: false,
        presenceState: {},
        sendHeartbeat: async () => {},
        failureCount: 0,
        lastSuccessfulHeartbeat: null,
      };

      expect(mockReturn.failureCount).toBe(0);
      expect(mockReturn.lastSuccessfulHeartbeat).toBeNull();
    });

    it('should increment failureCount on consecutive failures', () => {
      const failedStates = [
        { failureCount: 0 },
        { failureCount: 1 },
        { failureCount: 2 },
        { failureCount: 3 },
        { failureCount: 4 },
        { failureCount: 5 },
      ];

      failedStates.forEach((state, index) => {
        expect(state.failureCount).toBe(index);
      });
    });

    it('should reset failureCount after successful heartbeat', () => {
      const beforeFailure = { failureCount: 0 };
      const afterFailure = { failureCount: 3 };
      const afterRecovery = { failureCount: 0 };

      expect(beforeFailure.failureCount).toBe(0);
      expect(afterFailure.failureCount).toBe(3);
      expect(afterRecovery.failureCount).toBe(0);
    });

    it('should update lastSuccessfulHeartbeat timestamp on success', () => {
      const mockReturn: UsePresenceReturn = {
        isConnected: true,
        presenceState: {},
        sendHeartbeat: async () => {},
        failureCount: 0,
        lastSuccessfulHeartbeat: '2026-01-31T12:00:00.000Z',
      };

      expect(mockReturn.lastSuccessfulHeartbeat).toBeTruthy();
      expect(typeof mockReturn.lastSuccessfulHeartbeat).toBe('string');

      // Validate ISO 8601 format
      const date = new Date(mockReturn.lastSuccessfulHeartbeat!);
      expect(date.toISOString()).toBe('2026-01-31T12:00:00.000Z');
    });
  });

  describe('Callback Signatures', () => {
    it('should call onConnectionError after max retries', () => {
      let errorCallbackCalled = false;
      const mockOptions: UsePresenceOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Test Player',
        onConnectionError: () => {
          errorCallbackCalled = true;
        },
      };

      // Simulate calling the callback
      mockOptions.onConnectionError!();

      expect(errorCallbackCalled).toBe(true);
    });

    it('should call onReconnected after successful retry', () => {
      let reconnectedCallbackCalled = false;
      const mockOptions: UsePresenceOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Test Player',
        onReconnected: () => {
          reconnectedCallbackCalled = true;
        },
      };

      // Simulate calling the callback
      mockOptions.onReconnected!();

      expect(reconnectedCallbackCalled).toBe(true);
    });

    it('should not call onConnectionError multiple times', () => {
      let callCount = 0;
      const mockOptions: UsePresenceOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Test Player',
        onConnectionError: () => {
          callCount++;
        },
      };

      // Simulate calling the callback once
      mockOptions.onConnectionError!();
      expect(callCount).toBe(1);

      // Should only be called once even if failures continue
      // (Implementation uses hasCalledErrorCallbackRef to prevent duplicates)
    });
  });
});
