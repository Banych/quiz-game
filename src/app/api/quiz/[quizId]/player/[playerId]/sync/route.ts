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

/**
 * POST /api/quiz/[quizId]/player/[playerId]/sync
 *
 * Syncs player session after reconnection.
 * - Updates player.lastSeenAt to mark as reconnected
 * - Returns full PlayerSessionDTO (quiz state + player data)
 *
 * Used by useReconnection hook to restore session state after network disruptions.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { quizId, playerId } = ParamsSchema.parse(await params);
    const { playerService } = getServices();

    // Update lastSeenAt to mark player as reconnected
    await playerService.updatePresence(playerId, new Date());

    // Fetch and return full session data
    const playerSession = await playerService.getPlayerSession(
      quizId,
      playerId
    );

    return NextResponse.json(playerSession satisfies PlayerSessionDTO);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to sync session';

    const status = /not found|player/i.test(message) ? 404 : 500;

    return NextResponse.json({ error: message } satisfies ErrorResponse, {
      status,
    });
  }
}
