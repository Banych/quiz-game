import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';
import { broadcastPool } from './broadcast-channel-pool';
import { getSupabaseServerClient } from './supabase-server-client';

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

  await broadcastPool.send(
    client,
    `quiz:${quizId}`,
    'question:locked',
    roundSummary
  );
};
