import { UpdatePlayerStatusUseCase } from '@application/use-cases/update-player-status.use-case';
import { Player, PlayerStatus } from '@domain/entities/player';
import { IPlayerRepository } from '@domain/repositories/player-repository';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('UpdatePlayerStatusUseCase', () => {
  let playerRepository: Mocked<IPlayerRepository>;
  let updatePlayerStatusUseCase: UpdatePlayerStatusUseCase;

  beforeEach(() => {
    playerRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    updatePlayerStatusUseCase = new UpdatePlayerStatusUseCase(playerRepository);
  });

  it('should update the player status', async () => {
    const player = new Player('p1', 'Player 1');
    playerRepository.findById.mockResolvedValue(player);

    await updatePlayerStatusUseCase.execute('p1', PlayerStatus.Disconnected);

    expect(playerRepository.findById).toHaveBeenCalledWith('p1');
    expect(player.status).toBe(PlayerStatus.Disconnected);
    expect(playerRepository.save).toHaveBeenCalledWith(player);
  });

  it('should throw an error if the player is not found', async () => {
    playerRepository.findById.mockResolvedValue(null);

    await expect(
      updatePlayerStatusUseCase.execute('p1', PlayerStatus.Disconnected)
    ).rejects.toThrow('Player not found.');
    expect(playerRepository.save).not.toHaveBeenCalled();
  });
});
