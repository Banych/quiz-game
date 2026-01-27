import type { PlayerDTO as PlayerDTOType } from '@application/dtos/player.dto';
import type { LeaderboardScore } from '@domain/types/leaderboard-score';
import type { Player } from '@domain/entities/player';

export type LeaderboardMeta = Map<string, { score: number; rank: number }>;

export type MapPlayerOptions = {
  leaderboardMeta?: LeaderboardMeta;
  includeConnectionStatus?: boolean;
  now?: Date;
};

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
  options?: LeaderboardMeta | MapPlayerOptions
): PlayerDTOType => {
  // Support both old signature (LeaderboardMeta) and new options object
  const opts: MapPlayerOptions =
    options instanceof Map ? { leaderboardMeta: options } : (options ?? {});

  const { leaderboardMeta, includeConnectionStatus = false, now } = opts;
  const meta = leaderboardMeta?.get(player.id);

  const dto: PlayerDTOType = {
    id: player.id,
    name: player.name,
    status: player.status,
    score: meta?.score ?? player.score,
    rank: meta?.rank ?? player.rank,
  };

  if (includeConnectionStatus) {
    dto.connectionStatus = player.getConnectionStatusType(now);
    dto.lastSeenAt = player.lastSeenAt?.toISOString() ?? null;
  }

  return dto;
};
