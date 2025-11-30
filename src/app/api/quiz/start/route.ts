import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';

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

    return NextResponse.json({ status: 'started' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start quiz.';
    const status = /not found/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
