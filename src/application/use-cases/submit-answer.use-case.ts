import { QuizStatus } from '@domain/entities/quiz';
import { IPlayerRepository } from '@domain/repositories/player-repository';
import { IQuizRepository } from '@domain/repositories/quiz-repository';

export class SubmitAnswerUseCase {
  constructor(
    private readonly quizRepository: IQuizRepository,
    private readonly playerRepository: IPlayerRepository
  ) {}

  async execute(
    quizId: string,
    playerId: string,
    questionId: string,
    answer: string
  ): Promise<void> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz || quiz.quizStatus !== QuizStatus.Active) {
      throw new Error('Quiz is not active or does not exist.');
    }

    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new Error('Player not found.');
    }

    quiz.submitAnswer(playerId, questionId, answer);

    await this.quizRepository.save(quiz);
    await this.playerRepository.save(player);
  }
}
