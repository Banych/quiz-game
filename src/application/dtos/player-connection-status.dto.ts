import { z } from 'zod';

/**
 * PlayerConnectionStatusDTO
 *
 * Used by hosts to view player connection status during a quiz session.
 * Includes player identification, connection status, and timing info.
 */
export const PlayerConnectionStatusSchema = z.object({
  playerId: z.string(),
  name: z.string(),
  connectionStatus: z.enum(['connected', 'away', 'disconnected']),
  lastSeenAt: z.string().datetime().nullable(),
});

export type PlayerConnectionStatusDTO = z.infer<
  typeof PlayerConnectionStatusSchema
>;
