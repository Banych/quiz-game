import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';

const SubmitAnswerBodySchema = z.object({
  quizId: z.string().min(1),
  playerId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = SubmitAnswerBodySchema.parse(payload);

    const { answerService } = getServices();
    await answerService.submitAnswer(
      parsed.quizId,
      parsed.playerId,
      parsed.questionId,
      parsed.answer
    );

    return NextResponse.json({ status: 'submitted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to submit answer.';
    const status = /not found|inactive/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
