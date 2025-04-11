import { Player } from '@domain/entities/player';
import { IPlayerRepository } from '@domain/repositories/player-repository';

export class FindPlayerByIdUseCase {
  constructor(private playerRepository: IPlayerRepository) {}

  async execute(playerId: string): Promise<Player | null> {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    return player;
  }
}
