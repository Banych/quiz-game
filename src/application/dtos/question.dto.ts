import { z } from 'zod';

export const QuestionMediaTypeDTO = z.enum(['image', 'video', 'audio']);
export const QuestionTypeDTO = z.enum([
  'multiple-choice',
  'text',
  'true/false',
]);

export const QuestionDTO = z.object({
  id: z.string(),
  text: z.string(),
  media: z.string().optional(),
  mediaType: QuestionMediaTypeDTO.optional(),
  options: z.array(z.string()).optional(),
  type: QuestionTypeDTO,
  points: z.number().nonnegative(),
  orderIndex: z.number().int().nonnegative().optional(),
  answersLockedAt: z.string().datetime().nullable().optional(),
});

export type QuestionDTO = z.infer<typeof QuestionDTO>;
