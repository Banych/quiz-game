import type { QuizDTO } from '@application/dtos/quiz.dto';
import { getSupabaseServerClient } from './supabase-server-client';

const DEFAULT_CHANNEL_CONFIG = {
  config: {
    broadcast: { ack: true },
  },
} as const;

export const broadcastQuizState = async (
  quizId: string,
  quizState: QuizDTO
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
      event: 'state:update',
      payload: quizState,
    });
  } finally {
    await channel.unsubscribe();
  }
};
