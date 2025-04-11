import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';
import { FindPlayerByIdUseCase } from '@application/use-cases/find-player-by-id.use-case';
import { UpdatePlayerStatusUseCase } from '@application/use-cases/update-player-status.use-case';
import { Player, PlayerStatus } from '@domain/entities/player';

export class PlayerService {
  constructor(
    private readonly addPlayerUseCase: AddPlayerUseCase,
    private readonly updatePlayerStatusUseCase: UpdatePlayerStatusUseCase,
    private readonly findPlayerByIdUseCase: FindPlayerByIdUseCase
  ) {}

  async addPlayer(
    quizId: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
    await this.addPlayerUseCase.execute(quizId, playerId, playerName);
  }

  async updatePlayerStatus(
    playerId: string,
    status: PlayerStatus
  ): Promise<void> {
    await this.updatePlayerStatusUseCase.execute(playerId, status);
  }

  async getPlayerDetails(playerId: string): Promise<Player | null> {
    return this.findPlayerByIdUseCase.execute(playerId);
  }
}
