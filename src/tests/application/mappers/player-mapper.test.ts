import {
  buildLeaderboardMeta,
  mapPlayerToDTO,
} from '@application/mappers/player-mapper';
import { Player, PlayerStatus } from '@domain/entities/player';
import { describe, expect, it } from 'vitest';

describe('player-mapper', () => {
  describe('mapPlayerToDTO', () => {
    it('should map basic player fields', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');
      player.updateScore(100);
      player.updateRank(1);

      const dto = mapPlayerToDTO(player);

      expect(dto.id).toBe('player-1');
      expect(dto.name).toBe('Alice');
      expect(dto.status).toBe(PlayerStatus.Active);
      expect(dto.score).toBe(100);
      expect(dto.rank).toBe(1);
    });

    it('should use leaderboard meta when provided as Map (backwards compat)', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');
      player.updateScore(50);
      player.updateRank(3);

      const leaderboardMeta = buildLeaderboardMeta([
        { playerId: 'player-1', score: 200 },
        { playerId: 'player-2', score: 150 },
      ]);

      const dto = mapPlayerToDTO(player, leaderboardMeta);

      expect(dto.score).toBe(200);
      expect(dto.rank).toBe(1);
    });

    it('should use leaderboard meta when provided in options', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');

      const leaderboardMeta = buildLeaderboardMeta([
        { playerId: 'player-2', score: 200 },
        { playerId: 'player-1', score: 150 },
      ]);

      const dto = mapPlayerToDTO(player, { leaderboardMeta });

      expect(dto.score).toBe(150);
      expect(dto.rank).toBe(2);
    });

    it('should not include connection status by default', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');

      const dto = mapPlayerToDTO(player);

      expect(dto.connectionStatus).toBeUndefined();
      expect(dto.lastSeenAt).toBeUndefined();
    });

    it('should include connection status when requested', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');
      const now = new Date();

      const dto = mapPlayerToDTO(player, {
        includeConnectionStatus: true,
        now,
      });

      expect(dto.connectionStatus).toBe('connected');
      expect(dto.lastSeenAt).toBeDefined();
      expect(typeof dto.lastSeenAt).toBe('string');
    });

    it('should return correct connection status based on lastSeenAt', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');
      const now = new Date();

      // Recently seen - connected
      player.lastSeenAt = new Date(now.getTime() - 10_000); // 10s ago
      let dto = mapPlayerToDTO(player, { includeConnectionStatus: true, now });
      expect(dto.connectionStatus).toBe('connected');

      // Somewhat old - away
      player.lastSeenAt = new Date(now.getTime() - 60_000); // 1 min ago
      dto = mapPlayerToDTO(player, { includeConnectionStatus: true, now });
      expect(dto.connectionStatus).toBe('away');

      // Very old - disconnected
      player.lastSeenAt = new Date(now.getTime() - 180_000); // 3 min ago
      dto = mapPlayerToDTO(player, { includeConnectionStatus: true, now });
      expect(dto.connectionStatus).toBe('disconnected');
    });

    it('should handle null lastSeenAt', () => {
      const player = new Player('player-1', 'Alice', 'quiz-1');
      player.lastSeenAt = null;

      const dto = mapPlayerToDTO(player, { includeConnectionStatus: true });

      expect(dto.connectionStatus).toBe('disconnected');
      expect(dto.lastSeenAt).toBeNull();
    });
  });

  describe('buildLeaderboardMeta', () => {
    it('should create meta map with scores and ranks', () => {
      const leaderboard = [
        { playerId: 'p1', score: 300 },
        { playerId: 'p2', score: 200 },
        { playerId: 'p3', score: 100 },
      ];

      const meta = buildLeaderboardMeta(leaderboard);

      expect(meta.get('p1')).toEqual({ score: 300, rank: 1 });
      expect(meta.get('p2')).toEqual({ score: 200, rank: 2 });
      expect(meta.get('p3')).toEqual({ score: 100, rank: 3 });
    });

    it('should handle empty leaderboard', () => {
      const meta = buildLeaderboardMeta([]);

      expect(meta.size).toBe(0);
    });
  });
});
