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
    if (!quiz) {
      throw new Error('Quiz not found.');
    }

    quiz.submitAnswer(playerId, questionId, answer);

    await this.quizRepository.save(quiz);

    const player = quiz.quiz.players.find((p) => p.id === playerId);
    if (player) {
      await this.playerRepository.save(player);
    }
  }
}
