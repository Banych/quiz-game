import {
  SubmitAnswerUseCase,
  type SubmitAnswerResult,
} from '@application/use-cases/submit-answer.use-case';

export class AnswerService {
  constructor(private readonly submitAnswerUseCase: SubmitAnswerUseCase) {}

  async submitAnswer(
    quizId: string,
    playerId: string,
    questionId: string,
    answer: string
  ): Promise<SubmitAnswerResult> {
    return await this.submitAnswerUseCase.execute(
      quizId,
      playerId,
      questionId,
      answer
    );
  }
}
