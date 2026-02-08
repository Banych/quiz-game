import type { LeaderboardEntryDTO } from '@application/dtos/quiz.dto';
import { broadcastPool } from './broadcast-channel-pool';
import { getSupabaseServerClient } from './supabase-server-client';

/**
 * Broadcast leaderboard update to quiz channel.
 * Used by debounced broadcaster to batch score updates.
 *
 * @param quizId - The quiz ID
 * @param leaderboard - Current leaderboard entries
 */
export const broadcastLeaderboard = async (
  quizId: string,
  leaderboard: LeaderboardEntryDTO[]
): Promise<void> => {
  const client = getSupabaseServerClient();

  if (!client) {
    return;
  }

  await broadcastPool.send(client, `quiz:${quizId}`, 'leaderboard:update', {
    leaderboard,
  });
};
