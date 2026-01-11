import type { LeaderboardEntryDTO } from '@application/dtos/quiz.dto';
import { getSupabaseServerClient } from './supabase-server-client';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

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

  const channelName = `quiz:${quizId}`;
  const channel = client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

  try {
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'leaderboard:update',
      payload: { leaderboard },
    });
  } finally {
    await channel.unsubscribe();
  }
};
