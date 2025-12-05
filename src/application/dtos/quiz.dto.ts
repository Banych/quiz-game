import { z } from 'zod';
import { PlayerDTO } from './player.dto';
import { QuestionDTO } from './question.dto';
import { AnswerDTO } from './answer.dto';

export const QuizStatusDTO = z.enum(['Pending', 'Active', 'Completed']);

export const QuizSettingsDTO = z.object({
  timePerQuestion: z.number().int().positive(),
  allowSkipping: z.boolean(),
});

export const LeaderboardEntryDTO = z.object({
  playerId: z.string(),
  score: z.number().nonnegative(),
});

export const QuizTimerDTO = z.object({
  duration: z.number().int().positive(),
  remainingSeconds: z.number().int().nonnegative().nullable(),
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
});

export const QuizDTO = z.object({
  id: z.string(),
  title: z.string(),
  status: QuizStatusDTO,
  currentQuestionIndex: z.number().int().nonnegative(),
  settings: QuizSettingsDTO,
  questions: z.array(QuestionDTO),
  players: z.array(PlayerDTO),
  answers: z.record(z.string(), z.array(AnswerDTO)).optional(),
  leaderboard: z.array(LeaderboardEntryDTO).default([]),
  activeQuestionId: z.string().nullable(),
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  joinCode: z.string().min(1).nullable().optional(),
  timer: QuizTimerDTO,
});

export type QuizDTO = z.infer<typeof QuizDTO>;
export type QuizSettingsDTO = z.infer<typeof QuizSettingsDTO>;
export type LeaderboardEntryDTO = z.infer<typeof LeaderboardEntryDTO>;
export type QuizTimerDTO = z.infer<typeof QuizTimerDTO>;
