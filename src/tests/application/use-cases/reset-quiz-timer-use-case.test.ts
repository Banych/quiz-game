import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ResetQuizTimerUseCase } from '@application/use-cases/reset-quiz-timer.use-case';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { Quiz } from '@domain/entities/quiz';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';

const buildAggregate = () => {
  const quiz = new Quiz('quiz-1', 'General Knowledge', [], {
    allowSkipping: false,
    timePerQuestion: 30,
  });
  const aggregate = new QuizSessionAggregate(quiz, 30);
  aggregate.startQuiz();
  return aggregate;
};

describe('ResetQuizTimerUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let useCase: ResetQuizTimerUseCase;

  beforeEach(() => {
    quizRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      findByJoinCode: vi.fn(),
      listByStatus: vi.fn(),
      updateCurrentQuestion: vi.fn(),
      updateLeaderboard: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<IQuizRepository>;

    useCase = new ResetQuizTimerUseCase(quizRepository);
  });

  it('resets the timer with an override duration', async () => {
    const aggregate = buildAggregate();
    quizRepository.findById.mockResolvedValue(aggregate);

    const result = await useCase.execute({ quizId: 'quiz-1', durationSeconds: 45 });

    expect(result.duration).toBe(45);
    expect(result.remainingSeconds).toBeLessThanOrEqual(45);
    expect(result.startTime).toMatch(/T/);
    expect(quizRepository.save).toHaveBeenCalledWith(aggregate);
  });

  it('throws when quiz does not exist', async () => {
    quizRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ quizId: 'missing' })
    ).rejects.toThrow('Quiz with ID missing not found.');
  });

  it('throws when quiz is not active', async () => {
    const aggregate = buildAggregate();
    aggregate.endQuiz();
    quizRepository.findById.mockResolvedValue(aggregate);

    await expect(
      useCase.execute({ quizId: 'quiz-1' })
    ).rejects.toThrow('Timer can only be controlled while the quiz is active.');
  });

  it('validates duration inputs', async () => {
    const aggregate = buildAggregate();
    quizRepository.findById.mockResolvedValue(aggregate);

    await expect(
      useCase.execute({ quizId: 'quiz-1', durationSeconds: 0 })
    ).rejects.toThrow('Timer duration must be greater than zero.');
  });
});
