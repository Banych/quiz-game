import { StartQuizUseCase } from '@application/useCases/start-quiz.use-case';
import { EndQuizUseCase } from '@application/useCases/end-quiz.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';

export class QuizService {
  constructor(
    private readonly startQuizUseCase: StartQuizUseCase,
    private readonly endQuizUseCase: EndQuizUseCase
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
    return this.startQuizUseCase.quizRepository.findById(quizId);
  }
}
