import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { SnapshotLeaderboardUseCase } from '@application/use-cases/snapshot-leaderboard.use-case';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { Quiz } from '@domain/entities/quiz';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Question } from '@domain/entities/question';

const buildAggregate = () => {
  const question = new Question('q1', '2+2?', ['4'], 'text', 10);
  const quiz = new Quiz('quiz-1', 'Math', [question], {
    allowSkipping: false,
    timePerQuestion: 30,
  });
  const aggregate = new QuizSessionAggregate(quiz, 30);
  aggregate.addPlayer('p1');
  aggregate.addPlayer('p2');
  aggregate.startQuiz();
  aggregate.submitAnswer('p1', 'q1', '4');
  aggregate.submitAnswer('p2', 'q1', '5');
  return aggregate;
};

describe('SnapshotLeaderboardUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let useCase: SnapshotLeaderboardUseCase;

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

    useCase = new SnapshotLeaderboardUseCase(quizRepository);
  });

  it('returns a leaderboard snapshot and persists ranks', async () => {
    const aggregate = buildAggregate();
    quizRepository.findById.mockResolvedValue(aggregate);

    const result = await useCase.execute('quiz-1');

    expect(result).toEqual([
      { playerId: 'p1', score: 10 },
      { playerId: 'p2', score: 0 },
    ]);
    expect(quizRepository.updateLeaderboard).toHaveBeenCalledWith('quiz-1', [
      { playerId: 'p1', score: 10 },
      { playerId: 'p2', score: 0 },
    ]);
  });

  it('throws when the quiz is missing', async () => {
    quizRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(
      'Quiz with ID missing not found.'
    );
  });
});
