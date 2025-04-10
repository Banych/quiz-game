import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('StartQuizUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let startQuizUseCase: StartQuizUseCase;

  beforeEach(() => {
    quizRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    startQuizUseCase = new StartQuizUseCase(quizRepository);
  });

  it('should start a quiz and update its status to Active', async () => {
    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);

    await startQuizUseCase.execute('quiz1');

    expect(quizRepository.findById).toHaveBeenCalledWith('quiz1');
    expect(quiz.quizStatus).toBe(QuizStatus.Active);
    expect(quiz.timerStartTime).toBeDefined();
    expect(quizRepository.save).toHaveBeenCalledWith(quiz);
  });

  it('should throw an error if the quiz is not found', async () => {
    quizRepository.findById.mockResolvedValue(null);

    await expect(startQuizUseCase.execute('invalidQuizId')).rejects.toThrow(
      'Quiz not found.'
    );
    expect(quizRepository.findById).toHaveBeenCalledWith('invalidQuizId');
    expect(quizRepository.save).not.toHaveBeenCalled();
  });
});
