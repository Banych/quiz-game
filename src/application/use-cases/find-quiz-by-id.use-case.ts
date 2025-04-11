import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { IQuizRepository } from '@domain/repositories/quiz-repository';

export class FindQuizByIdUseCase {
  constructor(private quizRepository: IQuizRepository) {}

  async execute(quizId: string): Promise<QuizSessionAggregate | null> {
    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz || quiz === null) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    return quiz;
  }
}
