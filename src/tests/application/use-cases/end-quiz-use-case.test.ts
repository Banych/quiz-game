import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('EndQuizUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let endQuizUseCase: EndQuizUseCase;

  beforeEach(() => {
    quizRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    endQuizUseCase = new EndQuizUseCase(quizRepository);
  });

  it('should end the quiz and generate a leaderboard', async () => {
    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quiz.startQuiz();
    quizRepository.findById.mockResolvedValue(quiz);

    const leaderboard = await endQuizUseCase.execute('quiz1');

    expect(quizRepository.findById).toHaveBeenCalledWith('quiz1');
    expect(quiz.quizStatus).toBe(QuizStatus.Completed);
    expect(leaderboard).toEqual([]);
    expect(quizRepository.save).toHaveBeenCalledWith(quiz);
  });

  it('should throw an error if the quiz is not found', async () => {
    quizRepository.findById.mockResolvedValue(null);

    await expect(endQuizUseCase.execute('invalidQuizId')).rejects.toThrow(
      'Quiz not found.'
    );
    expect(quizRepository.findById).toHaveBeenCalledWith('invalidQuizId');
    expect(quizRepository.save).not.toHaveBeenCalled();
  });
});
