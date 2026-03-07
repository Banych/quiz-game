import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';
import { broadcastRoundSummary } from '@infrastructure/realtime/broadcast-round-summary';

const ParamsSchema = z.object({
  quizId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

type RouteContext = {
  params: Promise<z.infer<typeof ParamsSchema>>;
};

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { quizId } = ParamsSchema.parse(await params);
    const { lockQuestionUseCase } = getServices();

    const roundSummary = await lockQuestionUseCase.execute(quizId);

    // Broadcast to all quiz participants
    await broadcastRoundSummary(quizId, roundSummary);

    return NextResponse.json(roundSummary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to lock question.';

    const status = /not found|not active/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
