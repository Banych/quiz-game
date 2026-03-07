import type { QuizDTO } from '@application/dtos/quiz.dto';
import { broadcastPool } from './broadcast-channel-pool';
import { getSupabaseServerClient } from './supabase-server-client';

export const broadcastQuizState = async (
  quizId: string,
  quizState: QuizDTO
): Promise<void> => {
  const client = getSupabaseServerClient();

  if (!client) {
    return;
  }

  await broadcastPool.send(client, `quiz:${quizId}`, 'state:update', quizState);
};
