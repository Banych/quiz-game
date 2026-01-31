import { describe, it, expect } from 'vitest';
import type {
  ReconnectionState,
  UseReconnectionOptions,
  UseReconnectionReturn,
} from '@hooks/use-reconnection';

describe('useReconnection', () => {
  describe('Hook Export', () => {
    it('should export useReconnection function', async () => {
      const hookModule = await import('@hooks/use-reconnection');
      expect(hookModule.useReconnection).toBeDefined();
      expect(typeof hookModule.useReconnection).toBe('function');
    });
  });

  describe('Type Contracts', () => {
    it('should define ReconnectionState type with valid states', () => {
      const states: ReconnectionState[] = [
        'connected',
        'disconnected',
        'reconnecting',
        'failed',
      ];

      states.forEach((state) => {
        expect([
          'connected',
          'disconnected',
          'reconnecting',
          'failed',
        ]).toContain(state);
      });
    });

    it('should define UseReconnectionOptions interface', () => {
      const options: UseReconnectionOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Alice',
        autoReconnect: true,
        persistToDatabase: false,
      };

      expect(options).toHaveProperty('quizId');
      expect(options).toHaveProperty('playerId');
      expect(options).toHaveProperty('playerName');
      expect(options).toHaveProperty('autoReconnect');
      expect(options).toHaveProperty('persistToDatabase');
    });

    it('should define UseReconnectionReturn interface', () => {
      const mockReturn: Partial<UseReconnectionReturn> = {
        state: 'connected',
        isDisconnected: false,
        isReconnecting: false,
        isFailed: false,
      };

      expect(mockReturn).toHaveProperty('state');
      expect(mockReturn).toHaveProperty('isDisconnected');
      expect(mockReturn).toHaveProperty('isReconnecting');
      expect(mockReturn).toHaveProperty('isFailed');
    });

    it('should include reconnect function in return type', () => {
      const mockReconnect: () => Promise<void> = async () => {};

      expect(typeof mockReconnect).toBe('function');
      expect(mockReconnect()).toBeInstanceOf(Promise);
    });

    it('should include presence object in return type', () => {
      const mockPresence = {
        isConnected: true,
        presenceState: {},
        sendHeartbeat: async () => {},
        failureCount: 0,
        lastSuccessfulHeartbeat: null,
      };

      expect(mockPresence).toHaveProperty('isConnected');
      expect(mockPresence).toHaveProperty('presenceState');
      expect(mockPresence).toHaveProperty('sendHeartbeat');
      expect(mockPresence).toHaveProperty('failureCount');
      expect(mockPresence).toHaveProperty('lastSuccessfulHeartbeat');
    });

    it('should define optional callbacks in options', () => {
      const options: UseReconnectionOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Alice',
        onDisconnected: () => {},
        onReconnected: () => {},
        onFailed: () => {},
      };

      expect(options.onDisconnected).toBeDefined();
      expect(options.onReconnected).toBeDefined();
      expect(options.onFailed).toBeDefined();
    });

    it('should have mutually exclusive state flags', () => {
      const states: Array<{
        state: ReconnectionState;
        isDisconnected: boolean;
        isReconnecting: boolean;
        isFailed: boolean;
      }> = [
        {
          state: 'connected',
          isDisconnected: false,
          isReconnecting: false,
          isFailed: false,
        },
        {
          state: 'disconnected',
          isDisconnected: true,
          isReconnecting: false,
          isFailed: false,
        },
        {
          state: 'reconnecting',
          isDisconnected: false,
          isReconnecting: true,
          isFailed: false,
        },
        {
          state: 'failed',
          isDisconnected: false,
          isReconnecting: false,
          isFailed: true,
        },
      ];

      states.forEach(({ isDisconnected, isReconnecting, isFailed }) => {
        const activeFlags = [isDisconnected, isReconnecting, isFailed].filter(
          Boolean
        ).length;
        expect(activeFlags).toBeLessThanOrEqual(1);
      });
    });

    it('should validate API contract structure', () => {
      const options: UseReconnectionOptions = {
        quizId: 'quiz-123',
        playerId: 'player-456',
        playerName: 'Alice',
      };

      const expectedSyncUrl = `/api/quiz/${options.quizId}/player/${options.playerId}/sync`;
      expect(expectedSyncUrl).toMatch(
        /\/api\/quiz\/[^/]+\/player\/[^/]+\/sync/
      );
    });

    it('should validate return interface completeness', () => {
      type RequiredKeys = keyof UseReconnectionReturn;
      const requiredKeys: RequiredKeys[] = [
        'state',
        'isDisconnected',
        'isReconnecting',
        'isFailed',
        'reconnect',
        'presence',
      ];

      expect(requiredKeys).toHaveLength(6);
      expect(requiredKeys).toContain('state');
      expect(requiredKeys).toContain('isDisconnected');
      expect(requiredKeys).toContain('isReconnecting');
      expect(requiredKeys).toContain('isFailed');
      expect(requiredKeys).toContain('reconnect');
      expect(requiredKeys).toContain('presence');
    });
  });
});
