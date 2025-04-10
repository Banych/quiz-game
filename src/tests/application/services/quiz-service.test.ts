import { QuizService } from '@application/services/quiz-service';
import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('QuizService', () => {
  let startQuizUseCase: Mocked<StartQuizUseCase>;
  let endQuizUseCase: Mocked<EndQuizUseCase>;
  let quizService: QuizService;

  beforeEach(() => {
    startQuizUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<StartQuizUseCase>;

    endQuizUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<EndQuizUseCase>;

    quizService = new QuizService(startQuizUseCase, endQuizUseCase);
  });

  it('should start a quiz', async () => {
    await quizService.startQuiz('quiz1');
    expect(startQuizUseCase.execute).toHaveBeenCalledWith('quiz1');
  });

  it('should end a quiz and return the leaderboard', async () => {
    const leaderboard = [{ playerId: 'p1', score: 10 }];
    endQuizUseCase.execute.mockResolvedValue(leaderboard);

    const result = await quizService.endQuiz('quiz1');
    expect(endQuizUseCase.execute).toHaveBeenCalledWith('quiz1');
    expect(result).toEqual(leaderboard);
  });
});
