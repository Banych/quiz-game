import { IPlayerRepository } from '@domain/repositories/player-repository';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { Player } from '@domain/entities/player';

export class AddPlayerUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly playerRepository: IPlayerRepository
  ) {}

  async execute(
    quizId: string,
    playerId: string,
    playerName: string
  ): Promise<void> {
    const quizSession = await this.quizRepository.findById(quizId);
    if (!quizSession) {
      throw new Error('Quiz not found.');
    }

    const existingPlayer = await this.playerRepository.findById(playerId);
    if (existingPlayer) {
      throw new Error('Player already exists.');
    }

    const newPlayer = new Player(playerId, playerName);
    quizSession.addPlayer(newPlayer.id);

    await this.playerRepository.save(newPlayer);
    await this.quizRepository.save(quizSession);
  }
}
