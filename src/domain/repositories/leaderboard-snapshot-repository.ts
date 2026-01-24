export type LeaderboardSnapshot = {
  id?: string;
  quizId: string;
  questionIndex: number;
  playerId: string;
  score: number;
  rank: number;
  capturedAt: Date;
};

export interface ILeaderboardSnapshotRepository {
  /**
   * Save multiple leaderboard snapshots for a specific question
   */
  saveSnapshots(
    quizId: string,
    questionIndex: number,
    leaderboard: Array<{ playerId: string; score: number }>
  ): Promise<void>;

  /**
   * Retrieve all snapshots for a specific question
   */
  findByQuizAndQuestion(
    quizId: string,
    questionIndex: number
  ): Promise<LeaderboardSnapshot[]>;

  /**
   * Retrieve all snapshots for a specific player in a quiz
   */
  findByQuizAndPlayer(
    quizId: string,
    playerId: string
  ): Promise<LeaderboardSnapshot[]>;

  /**
   * Retrieve all snapshots for a quiz (for analytics/replay)
   */
  findByQuiz(quizId: string): Promise<LeaderboardSnapshot[]>;

  /**
   * Delete all snapshots for a quiz
   */
  deleteByQuiz(quizId: string): Promise<void>;
}
