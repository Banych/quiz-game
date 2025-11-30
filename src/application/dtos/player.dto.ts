import { z } from 'zod';

export const PlayerStatusDTO = z.enum(['Active', 'Disconnected', 'Finished']);

export const PlayerDTO = z.object({
  id: z.string(),
  name: z.string(),
  status: PlayerStatusDTO,
  score: z.number().nonnegative().optional(),
  rank: z.number().int().positive().optional(),
});

export type PlayerDTO = z.infer<typeof PlayerDTO>;
