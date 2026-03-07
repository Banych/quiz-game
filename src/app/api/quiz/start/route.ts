import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';
import { broadcastQuizState } from '@infrastructure/realtime/broadcast-quiz-state';

const StartQuizBodySchema = z.object({
  quizId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = StartQuizBodySchema.parse(body);

    const { quizService } = getServices();
    await quizService.startQuiz(parsed.quizId);
    const quizState = await quizService.getQuizState(parsed.quizId);
    try {
      await broadcastQuizState(parsed.quizId, quizState);
    } catch (broadcastError) {
      console.warn('Failed to broadcast quiz state after start', {
        quizId: parsed.quizId,
        error: broadcastError,
      });
    }

    return NextResponse.json(quizState);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start quiz.';
    const status = /not found/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
