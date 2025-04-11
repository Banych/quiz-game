import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { LeaderboardScore } from '@domain/types/leaderboard-score';

export class EndQuizUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute(quizId: string): Promise<LeaderboardScore[]> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found.');
    }

    quiz.endQuiz();

    const leaderboard = quiz.getLeaderboard();

    await this.quizRepository.save(quiz);

    return leaderboard;
  }
}
