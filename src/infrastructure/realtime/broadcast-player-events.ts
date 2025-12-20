import type { PlayerSessionDTO } from '@application/dtos/player-session.dto';
import { getSupabaseServerClient } from './supabase-server-client';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

/**
 * Broadcasts player-specific event to a player's private channel.
 * Used for answer acknowledgments and personal scoring updates.
 */
export const broadcastPlayerEvent = async <TPayload = unknown>(
  quizId: string,
  playerId: string,
  event: string,
  payload: TPayload
): Promise<void> => {
  const client = getSupabaseServerClient();

  if (!client) {
    return;
  }

  const channelName = `player:${quizId}:${playerId}`;
  const channel = client.channel(channelName, DEFAULT_CHANNEL_CONFIG);

  try {
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  } finally {
    await channel.unsubscribe();
  }
};

/**
 * Broadcasts answer acknowledgment to a specific player.
 */
export const broadcastAnswerAck = async (
  quizId: string,
  playerId: string,
  answerId: string,
  isCorrect: boolean | null
): Promise<void> => {
  await broadcastPlayerEvent(quizId, playerId, 'answer:ack', {
    answerId,
    isCorrect,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Broadcasts updated player session data.
 */
export const broadcastPlayerUpdate = async (
  quizId: string,
  playerId: string,
  session: PlayerSessionDTO
): Promise<void> => {
  await broadcastPlayerEvent(quizId, playerId, 'player:update', session);
};
