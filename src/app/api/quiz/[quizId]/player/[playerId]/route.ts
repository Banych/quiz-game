import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServices } from '@application/services/factories';
import type { PlayerSessionDTO } from '@application/dtos/player-session.dto';

const ParamsSchema = z.object({
  quizId: z.string().min(1),
  playerId: z.string().min(1),
});

type ErrorResponse = {
  error: string;
};

type RouteContext = {
  params: Promise<z.infer<typeof ParamsSchema>>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { quizId, playerId } = ParamsSchema.parse(await params);
    const { playerService } = getServices();
    const playerSession = await playerService.getPlayerSession(
      quizId,
      playerId
    );

    return NextResponse.json(playerSession satisfies PlayerSessionDTO);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load player session.';

    const status = /not found|player/i.test(message) ? 404 : 400;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
