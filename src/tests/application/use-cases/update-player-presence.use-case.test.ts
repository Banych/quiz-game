import { UpdatePlayerPresenceUseCase } from '@application/use-cases/update-player-presence.use-case';
import { Player } from '@domain/entities/player';
import type { IPlayerRepository } from '@domain/repositories/player-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('UpdatePlayerPresenceUseCase', () => {
  let useCase: UpdatePlayerPresenceUseCase;
  let mockPlayerRepository: IPlayerRepository;
  let mockPlayer: Player;

  beforeEach(() => {
    mockPlayer = new Player('player-1', 'Alice', 'quiz-1');

    mockPlayerRepository = {
      findById: vi.fn().mockResolvedValue(mockPlayer),
      listByQuizId: vi.fn(),
      findByQuizIdAndName: vi.fn(),
      save: vi.fn(),
      updateStatus: vi.fn(),
      updateScore: vi.fn(),
      updateLastSeenAt: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };

    useCase = new UpdatePlayerPresenceUseCase(mockPlayerRepository);
  });

  it('should update lastSeenAt with current time when no timestamp provided', async () => {
    const before = new Date();
    const result = await useCase.execute({ playerId: 'player-1' });
    const after = new Date();

    expect(result.success).toBe(true);
    expect(result.lastSeenAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
    expect(result.lastSeenAt.getTime()).toBeLessThanOrEqual(after.getTime());

    expect(mockPlayerRepository.findById).toHaveBeenCalledWith('player-1');
    expect(mockPlayerRepository.updateLastSeenAt).toHaveBeenCalledWith(
      'player-1',
      expect.any(Date)
    );
  });

  it('should update lastSeenAt with provided timestamp', async () => {
    const specificTime = new Date('2024-06-15T12:00:00Z');

    const result = await useCase.execute({
      playerId: 'player-1',
      timestamp: specificTime,
    });

    expect(result.success).toBe(true);
    expect(result.lastSeenAt).toEqual(specificTime);

    expect(mockPlayerRepository.updateLastSeenAt).toHaveBeenCalledWith(
      'player-1',
      specificTime
    );
  });

  it('should throw error when player not found', async () => {
    vi.mocked(mockPlayerRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ playerId: 'unknown-player' })
    ).rejects.toThrow('Player not found');

    expect(mockPlayerRepository.updateLastSeenAt).not.toHaveBeenCalled();
  });

  it('should update player entity lastSeenAt', async () => {
    const specificTime = new Date('2024-06-15T12:00:00Z');

    await useCase.execute({
      playerId: 'player-1',
      timestamp: specificTime,
    });

    expect(mockPlayer.lastSeenAt).toEqual(specificTime);
  });
});
