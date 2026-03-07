import { z } from 'zod';
import { QuizDTO } from './quiz.dto';
import { PlayerDTO } from './player.dto';

export const PlayerSessionDTO = z.object({
  quiz: QuizDTO,
  player: PlayerDTO,
});

export type PlayerSessionDTO = z.infer<typeof PlayerSessionDTO>;
