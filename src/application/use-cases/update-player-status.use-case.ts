import { IPlayerRepository } from '@domain/repositories/player-repository';
import { PlayerStatus } from '@domain/entities/player';

export class UpdatePlayerStatusUseCase {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async execute(playerId: string, status: PlayerStatus): Promise<void> {
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    player.updateStatus(status);
    await this.playerRepository.save(player);
  }
}
