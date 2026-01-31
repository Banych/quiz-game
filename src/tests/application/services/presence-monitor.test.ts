import { PresenceMonitor } from '@application/services/presence-monitor';
import type { PlayerDTO } from '@application/dtos/player.dto';
import { describe, expect, it } from 'vitest';

describe('PresenceMonitor', () => {
  const presenceMonitor = new PresenceMonitor();
  const baseTime = new Date('2026-01-27T12:00:00Z');

  describe('getPlayerConnectionStatus', () => {
    it('should return "connected" if lastSeenAt is within 30 seconds', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'connected',
        lastSeenAt: new Date(baseTime.getTime() - 10_000).toISOString(), // 10 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('connected');
    });

    it('should return "connected" if lastSeenAt is exactly at 30 second boundary', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'connected',
        lastSeenAt: new Date(baseTime.getTime() - 30_000).toISOString(), // 30 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('connected');
    });

    it('should return "away" if lastSeenAt is between 30 and 120 seconds', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'away',
        lastSeenAt: new Date(baseTime.getTime() - 60_000).toISOString(), // 60 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('away');
    });

    it('should return "away" if lastSeenAt is 31 seconds ago', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'away',
        lastSeenAt: new Date(baseTime.getTime() - 31_000).toISOString(), // 31 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('away');
    });

    it('should return "away" if lastSeenAt is exactly at 120 second boundary', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'away',
        lastSeenAt: new Date(baseTime.getTime() - 120_000).toISOString(), // 120 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('away');
    });

    it('should return "disconnected" if lastSeenAt is beyond 120 seconds', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'disconnected',
        lastSeenAt: new Date(baseTime.getTime() - 150_000).toISOString(), // 150 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('disconnected');
    });

    it('should return "disconnected" if lastSeenAt is 121 seconds ago', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'disconnected',
        lastSeenAt: new Date(baseTime.getTime() - 121_000).toISOString(), // 121 seconds ago
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('disconnected');
    });

    it('should return "disconnected" if lastSeenAt is null', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
        connectionStatus: 'disconnected',
        lastSeenAt: null,
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('disconnected');
    });

    it('should return "disconnected" if lastSeenAt is undefined', () => {
      const player: PlayerDTO = {
        id: 'p1',
        name: 'Player 1',
        status: 'Active',
      };

      const status = presenceMonitor.getPlayerConnectionStatus(
        player,
        baseTime
      );

      expect(status).toBe('disconnected');
    });
  });

  describe('aggregatePlayerStatus', () => {
    it('should aggregate status for multiple players with mixed statuses', () => {
      const players: PlayerDTO[] = [
        {
          id: 'p1',
          name: 'Player 1',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 5_000).toISOString(), // connected
        },
        {
          id: 'p2',
          name: 'Player 2',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 60_000).toISOString(), // away
        },
        {
          id: 'p3',
          name: 'Player 3',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 150_000).toISOString(), // disconnected
        },
      ];

      const statuses = presenceMonitor.aggregatePlayerStatus(players, baseTime);

      expect(statuses.get('p1')).toBe('connected');
      expect(statuses.get('p2')).toBe('away');
      expect(statuses.get('p3')).toBe('disconnected');
    });

    it('should handle empty player list', () => {
      const players: PlayerDTO[] = [];

      const statuses = presenceMonitor.aggregatePlayerStatus(players, baseTime);

      expect(statuses.size).toBe(0);
    });

    it('should handle single player', () => {
      const players: PlayerDTO[] = [
        {
          id: 'p1',
          name: 'Player 1',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 10_000).toISOString(),
        },
      ];

      const statuses = presenceMonitor.aggregatePlayerStatus(players, baseTime);

      expect(statuses.size).toBe(1);
      expect(statuses.get('p1')).toBe('connected');
    });
  });

  describe('getStatusSummary', () => {
    it('should count connected, away, and disconnected players', () => {
      const players: PlayerDTO[] = [
        {
          id: 'p1',
          name: 'Player 1',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 5_000).toISOString(), // connected
        },
        {
          id: 'p2',
          name: 'Player 2',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 10_000).toISOString(), // connected
        },
        {
          id: 'p3',
          name: 'Player 3',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 60_000).toISOString(), // away
        },
        {
          id: 'p4',
          name: 'Player 4',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 150_000).toISOString(), // disconnected
        },
        {
          id: 'p5',
          name: 'Player 5',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 200_000).toISOString(), // disconnected
        },
      ];

      const summary = presenceMonitor.getStatusSummary(players, baseTime);

      expect(summary.connected).toBe(2);
      expect(summary.away).toBe(1);
      expect(summary.disconnected).toBe(2);
    });

    it('should return zeros for empty player list', () => {
      const players: PlayerDTO[] = [];

      const summary = presenceMonitor.getStatusSummary(players, baseTime);

      expect(summary.connected).toBe(0);
      expect(summary.away).toBe(0);
      expect(summary.disconnected).toBe(0);
    });

    it('should handle all players with same status', () => {
      const players: PlayerDTO[] = [
        {
          id: 'p1',
          name: 'Player 1',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 5_000).toISOString(), // connected
        },
        {
          id: 'p2',
          name: 'Player 2',
          status: 'Active',
          lastSeenAt: new Date(baseTime.getTime() - 10_000).toISOString(), // connected
        },
      ];

      const summary = presenceMonitor.getStatusSummary(players, baseTime);

      expect(summary.connected).toBe(2);
      expect(summary.away).toBe(0);
      expect(summary.disconnected).toBe(0);
    });
  });
});
