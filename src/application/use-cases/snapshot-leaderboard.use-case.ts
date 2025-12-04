import type { LeaderboardEntryDTO as LeaderboardEntryDTOType } from '@application/dtos/quiz.dto';
import type { IQuizRepository } from '@domain/repositories/quiz-repository';

export class SnapshotLeaderboardUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute(quizId: string): Promise<LeaderboardEntryDTOType[]> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found.`);
    }

    const leaderboard = quiz.getLeaderboard();

    await this.quizRepository.updateLeaderboard(quizId, leaderboard);

    return leaderboard.map((entry) => ({
      playerId: entry.playerId,
      score: entry.score,
    }));
  }
}
