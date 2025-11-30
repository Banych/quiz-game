import type { QuestionDTO as QuestionDTOType } from '@application/dtos/question.dto';
import { mapQuestionToDTO } from '@application/mappers/quiz-mapper';
import type { IQuizRepository } from '@domain/repositories/quiz-repository';

export class AdvanceQuestionUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute(quizId: string): Promise<QuestionDTOType | null> {
    const quizAggregate = await this.quizRepository.findById(quizId);

    if (!quizAggregate) {
      throw new Error(`Quiz with ID ${quizId} not found.`);
    }

    const nextQuestion = quizAggregate.nextQuestion();
    await this.quizRepository.save(quizAggregate);

    return nextQuestion ? mapQuestionToDTO(nextQuestion) : null;
  }
}
