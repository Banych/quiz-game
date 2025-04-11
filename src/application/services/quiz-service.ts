import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/use-cases/end-quiz.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { FindQuizByIdUseCase } from '@application/use-cases/find-quiz-by-id.use-case';

export class QuizService {
  constructor(
    private readonly startQuizUseCase: StartQuizUseCase,
    private readonly endQuizUseCase: EndQuizUseCase,
    private readonly findQuizByIdUseCase: FindQuizByIdUseCase
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
}
