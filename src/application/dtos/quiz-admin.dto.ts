import { z } from 'zod';

/**
 * DTO for creating a new quiz (admin)
 */
export const CreateQuizDTO = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  timePerQuestion: z.number().int().positive().default(30),
  allowSkipping: z.boolean().default(false),
});

export type CreateQuizDTO = z.infer<typeof CreateQuizDTO>;

/**
 * DTO for updating an existing quiz (admin)
 */
export const UpdateQuizDTO = z.object({
  title: z.string().min(1).max(200).optional(),
  timePerQuestion: z.number().int().positive().optional(),
  allowSkipping: z.boolean().optional(),
});

export type UpdateQuizDTO = z.infer<typeof UpdateQuizDTO>;

/**
 * DTO for quiz list item (admin dashboard)
 */
export const QuizListItemDTO = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['Pending', 'Active', 'Completed']),
  questionCount: z.number().int().nonnegative(),
  playerCount: z.number().int().nonnegative(),
  timePerQuestion: z.number().int().positive(),
  allowSkipping: z.boolean(),
  joinCode: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type QuizListItemDTO = z.infer<typeof QuizListItemDTO>;
