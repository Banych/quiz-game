import { z } from 'zod';

/**
 * Represents a player's result for a specific question
 */
export const PlayerResultSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  answerSubmitted: z.boolean(),
  correct: z.boolean(),
  timeTaken: z.number().nullable(),
  pointsEarned: z.number(),
});

export type PlayerResult = z.infer<typeof PlayerResultSchema>;

/**
 * Represents a player's rank change after a question
 */
export const LeaderboardDeltaSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  previousRank: z.number().nullable(),
  currentRank: z.number(),
  rankChange: z.number(), // positive = moved up, negative = moved down
  previousScore: z.number().nullable(),
  currentScore: z.number(),
});

export type LeaderboardDelta = z.infer<typeof LeaderboardDeltaSchema>;

/**
 * Comprehensive summary of a question round after it's been locked
 */
export const RoundSummarySchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  correctAnswer: z.string(),
  questionIndex: z.number(),
  playerResults: z.array(PlayerResultSchema),
  averageTime: z.number().nullable(),
  correctCount: z.number(),
  totalPlayers: z.number(),
  leaderboardDeltas: z.array(LeaderboardDeltaSchema),
  lockedAt: z.string().datetime(),
});

export type RoundSummaryDTO = z.infer<typeof RoundSummarySchema>;
