import { PlayerService } from '@application/services/player-service';
import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';
import { UpdatePlayerStatusUseCase } from '@application/use-cases/update-player-status.use-case';
import { Player, PlayerStatus } from '@domain/entities/player';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('PlayerService', () => {
  let addPlayerUseCase: Mocked<AddPlayerUseCase>;
  let updatePlayerStatusUseCase: Mocked<UpdatePlayerStatusUseCase>;
  let playerService: PlayerService;

  beforeEach(() => {
    addPlayerUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<AddPlayerUseCase>;

    updatePlayerStatusUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<UpdatePlayerStatusUseCase>;

    playerService = new PlayerService(
      addPlayerUseCase,
      updatePlayerStatusUseCase
    );
  });

  it('should add a player to a quiz', async () => {
    await playerService.addPlayer('quiz1', 'p1', 'Player 1');
    expect(addPlayerUseCase.execute).toHaveBeenCalledWith(
      'quiz1',
      'p1',
      'Player 1'
    );
  });

  it('should update the status of a player', async () => {
    await playerService.updatePlayerStatus('p1', PlayerStatus.Disconnected);
    expect(updatePlayerStatusUseCase.execute).toHaveBeenCalledWith(
      'p1',
      PlayerStatus.Disconnected
    );
  });

  it('should fetch player details', async () => {
    const player = new Player('p1', 'Player 1');
    addPlayerUseCase.playerRepository = {
      findById: vi.fn().mockResolvedValue(player),
    } as unknown as Mocked<typeof addPlayerUseCase.playerRepository>;

    const result = await playerService.getPlayerDetails('p1');
    expect(addPlayerUseCase.playerRepository.findById).toHaveBeenCalledWith(
      'p1'
    );
    expect(result).toEqual(player);
  });
});
