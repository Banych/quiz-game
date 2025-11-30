import { z } from 'zod';

export const AnswerDTO = z.object({
  playerId: z.string(),
  questionId: z.string(),
  value: z.string(),
  timestamp: z.string().datetime(),
  isCorrect: z.boolean().optional(),
  points: z.number().optional(),
  timeTaken: z.number().optional(),
});

export type AnswerDTO = z.infer<typeof AnswerDTO>;
