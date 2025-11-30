import type { PlayerDTO as PlayerDTOType } from '@application/dtos/player.dto';
import type { PlayerSessionDTO as PlayerSessionDTOType } from '@application/dtos/player-session.dto';
import { AddPlayerUseCase } from '@application/use-cases/add-player.use-case';
import { FindPlayerByIdUseCase } from '@application/use-cases/find-player-by-id.use-case';
import { UpdatePlayerStatusUseCase } from '@application/use-cases/update-player-status.use-case';
import { ListQuizPlayersUseCase } from '@application/use-cases/list-quiz-players.use-case';
import { GetPlayerSessionUseCase } from '@application/use-cases/get-player-session.use-case';
import { Player, PlayerStatus } from '@domain/entities/player';

export class PlayerService {
  constructor(
    private readonly addPlayerUseCase: AddPlayerUseCase,
    private readonly updatePlayerStatusUseCase: UpdatePlayerStatusUseCase,
    private readonly findPlayerByIdUseCase: FindPlayerByIdUseCase,
    private readonly listQuizPlayersUseCase: ListQuizPlayersUseCase,
    private readonly getPlayerSessionUseCase: GetPlayerSessionUseCase
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

  async listPlayersForQuiz(quizId: string): Promise<PlayerDTOType[]> {
    return this.listQuizPlayersUseCase.execute(quizId);
  }

  async getPlayerSession(
    quizId: string,
    playerId: string
  ): Promise<PlayerSessionDTOType> {
    return this.getPlayerSessionUseCase.execute(quizId, playerId);
  }
}
