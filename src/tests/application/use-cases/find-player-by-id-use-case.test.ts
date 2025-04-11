import { FindPlayerByIdUseCase } from '@application/use-cases/find-player-by-id.use-case';
import { Player } from '@domain/entities/player';
import { IPlayerRepository } from '@domain/repositories/player-repository';
import { describe, expect, it, vi } from 'vitest';

describe('FindPlayerByIdUseCase', () => {
  const mockPlayerRepository: IPlayerRepository = {
    findById: vi.fn(),
    delete: vi.fn(),
    save: vi.fn(),
  };

  const findPlayerByIdUseCase = new FindPlayerByIdUseCase(mockPlayerRepository);

  it('should throw an error if playerId is not provided', async () => {
    await expect(findPlayerByIdUseCase.execute('')).rejects.toThrow(
      'Player ID is required'
    );
  });

  it('should throw an error if player is not found', async () => {
    vi.spyOn(mockPlayerRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      findPlayerByIdUseCase.execute('non-existent-id')
    ).rejects.toThrow('Player with ID non-existent-id not found');
  });

  it('should return the player if found', async () => {
    const mockPlayer = new Player('player-id', 'player-name');
    vi.spyOn(mockPlayerRepository, 'findById').mockResolvedValueOnce(
      mockPlayer
    );

    const result = await findPlayerByIdUseCase.execute('player-id');

    expect(result).toEqual(mockPlayer);
    expect(mockPlayerRepository.findById).toHaveBeenCalledWith('player-id');
  });
});
