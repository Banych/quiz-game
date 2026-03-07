import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';
import { broadcastQuizState } from '@infrastructure/realtime/broadcast-quiz-state';
import { broadcastLeaderboard } from '@infrastructure/realtime/broadcast-leaderboard';
import { getGlobalBroadcaster } from '@lib/debounce-broadcast';

const ParamsSchema = z.object({
  quizId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

type RouteContext = {
  params: Promise<z.infer<typeof ParamsSchema>>;
};

// Initialize debounced broadcaster (shared with answer route)
const leaderboardBroadcaster = getGlobalBroadcaster(async (quizId: string) => {
  const { quizService } = getServices();
  const quizState = await quizService.getQuizState(quizId);
  await broadcastLeaderboard(quizId, quizState.leaderboard);
});

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { quizId } = ParamsSchema.parse(await params);
    const { quizService } = getServices();

    // Flush any pending leaderboard broadcasts before advancing
    await leaderboardBroadcaster.flush();

    await quizService.advanceToNextQuestion(quizId);
    const quizState = await quizService.getQuizState(quizId);

    try {
      await broadcastQuizState(quizId, quizState);
    } catch (broadcastError) {
      console.warn('Failed to broadcast quiz state after advance', {
        quizId,
        error: broadcastError,
      });
    }

    return NextResponse.json(quizState);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to advance to the next question.';
    const status = /not found/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
