import { SubmitAnswerUseCase } from '@application/useCases/submit-answer.use-case';

export class AnswerService {
  constructor(private readonly submitAnswerUseCase: SubmitAnswerUseCase) {}

  async submitAnswer(
    quizId: string,
    playerId: string,
    questionId: string,
    answer: string
  ): Promise<void> {
    await this.submitAnswerUseCase.execute(
      quizId,
      playerId,
      questionId,
      answer
    );
  }
}
