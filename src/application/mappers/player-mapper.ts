import type { PlayerDTO as PlayerDTOType } from '@application/dtos/player.dto';
import type { LeaderboardScore } from '@domain/types/leaderboard-score';
import type { Player } from '@domain/entities/player';

export type LeaderboardMeta = Map<string, { score: number; rank: number }>;

export const buildLeaderboardMeta = (
  leaderboard: LeaderboardScore[]
): LeaderboardMeta => {
  return new Map(
    leaderboard.map((entry, index) => [
      entry.playerId,
      { score: entry.score, rank: index + 1 },
    ])
  );
};

export const mapPlayerToDTO = (
  player: Player,
  leaderboardMeta?: LeaderboardMeta
): PlayerDTOType => {
  const meta = leaderboardMeta?.get(player.id);

  return {
    id: player.id,
    name: player.name,
    status: player.status,
    score: meta?.score ?? player.score,
    rank: meta?.rank ?? player.rank,
  };
};
