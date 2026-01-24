import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';
import { getSupabaseServerClient } from './supabase-server-client';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

/**
 * Broadcasts round summary to all quiz participants after question is locked.
 * Sends via Supabase Realtime on `quiz:{quizId}` channel with event `question:locked`.
 */
export const broadcastRoundSummary = async (
  quizId: string,
  roundSummary: RoundSummaryDTO
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
      event: 'question:locked',
      payload: roundSummary,
    });
  } finally {
    await channel.unsubscribe();
  }
};
