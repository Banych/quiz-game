import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';
import type { PlayerDTO } from '@application/dtos/player.dto';

const ParamsSchema = z.object({
  quizId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

type SuccessResponse = {
  quizId: string;
  players: PlayerDTO[];
};

export async function GET(
  _request: Request,
  { params }: { params: z.infer<typeof ParamsSchema> }
) {
  try {
    const { quizId } = ParamsSchema.parse(params);
    const { playerService } = getServices();
    const players = await playerService.listPlayersForQuiz(quizId);

    return NextResponse.json({ quizId, players } satisfies SuccessResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load quiz players.';

    const status = /not found/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
