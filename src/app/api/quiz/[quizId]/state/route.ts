import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';

const ParamsSchema = z.object({
  quizId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

export async function GET(
  _request: Request,
  { params }: { params: z.infer<typeof ParamsSchema> }
) {
  try {
    const { quizId } = ParamsSchema.parse(params);
    const { quizService } = getServices();
    const quizState = await quizService.getQuizState(quizId);

    return NextResponse.json(quizState);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load quiz state.';

    const status = /not found/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
