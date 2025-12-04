import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import type {
  QuizDTO as QuizDTOType,
  QuizTimerDTO as QuizTimerDTOType,
  LeaderboardEntryDTO as LeaderboardEntryDTOType,
} from '@application/dtos/quiz.dto';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { FindQuizByIdUseCase } from '@application/use-cases/find-quiz-by-id.use-case';
import { GetQuizStateUseCase } from '@application/use-cases/get-quiz-state.use-case';
import {
  AdvanceQuestionUseCase,
  type AdvanceQuestionResult,
} from '@application/use-cases/advance-question.use-case';
import { ResetQuizTimerUseCase } from '@application/use-cases/reset-quiz-timer.use-case';
import { SnapshotLeaderboardUseCase } from '@application/use-cases/snapshot-leaderboard.use-case';

export class QuizService {
  constructor(
    private readonly startQuizUseCase: StartQuizUseCase,
    private readonly endQuizUseCase: EndQuizUseCase,
    private readonly findQuizByIdUseCase: FindQuizByIdUseCase,
    private readonly getQuizStateUseCase: GetQuizStateUseCase,
    private readonly advanceQuestionUseCase: AdvanceQuestionUseCase,
    private readonly resetQuizTimerUseCase: ResetQuizTimerUseCase,
    private readonly snapshotLeaderboardUseCase: SnapshotLeaderboardUseCase
  ) {}

  async startQuiz(quizId: string): Promise<void> {
    await this.startQuizUseCase.execute(quizId);
  }

  async endQuiz(
    quizId: string
  ): Promise<{ playerId: string; score: number }[]> {
    return this.endQuizUseCase.execute(quizId);
  }

  async getQuizDetails(quizId: string): Promise<QuizSessionAggregate | null> {
    return this.findQuizByIdUseCase.execute(quizId);
  }

  async getQuizState(quizId: string): Promise<QuizDTOType> {
    return this.getQuizStateUseCase.execute(quizId);
  }

  async advanceToNextQuestion(quizId: string): Promise<AdvanceQuestionResult> {
    return this.advanceQuestionUseCase.execute(quizId);
  }

  async resetTimer(
    quizId: string,
    durationSeconds?: number
  ): Promise<QuizTimerDTOType> {
    return this.resetQuizTimerUseCase.execute({ quizId, durationSeconds });
  }

  async snapshotLeaderboard(
    quizId: string
  ): Promise<LeaderboardEntryDTOType[]> {
    return this.snapshotLeaderboardUseCase.execute(quizId);
  }
}
