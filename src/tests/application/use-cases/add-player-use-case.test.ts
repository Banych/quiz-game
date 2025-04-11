import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz } from '@domain/entities/quiz';
import { Player } from '@domain/entities/player';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { IPlayerRepository } from '@domain/repositories/player-repository';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('AddPlayerUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let playerRepository: Mocked<IPlayerRepository>;
  let addPlayerUseCase: AddPlayerUseCase;

  beforeEach(() => {
    quizRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    playerRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    addPlayerUseCase = new AddPlayerUseCase(quizRepository, playerRepository);
  });

  it('should add a player to the quiz', async () => {
    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);
    playerRepository.findById.mockResolvedValue(null);

    await addPlayerUseCase.execute('quiz1', 'p1', 'Player 1');

    expect(quizRepository.findById).toHaveBeenCalledWith('quiz1');
    expect(playerRepository.findById).toHaveBeenCalledWith('p1');
    expect(quiz.hasPlayer('p1')).toBe(true);
    expect(playerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', name: 'Player 1' })
    );
    expect(quizRepository.save).toHaveBeenCalledWith(quiz);
  });

  it('should throw an error if the player already exists', async () => {
    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);
    playerRepository.findById.mockResolvedValue(new Player('p1', 'Player 1'));

    await expect(
      addPlayerUseCase.execute('quiz1', 'p1', 'Player 1')
    ).rejects.toThrow('Player already exists.');
    expect(playerRepository.save).not.toHaveBeenCalled();
    expect(quizRepository.save).not.toHaveBeenCalled();
  });
});
