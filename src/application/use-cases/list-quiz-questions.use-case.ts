import type { IQuestionRepository } from '@domain/repositories/question-repository';
import type { QuestionListItemDTO } from '@application/dtos/question-admin.dto';

/**
 * Use case: List all questions for a quiz (admin view)
 * Returns lightweight DTOs suitable for table displays
 */
export class ListQuizQuestionsUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(quizId: string): Promise<QuestionListItemDTO[]> {
    const questions = await this.questionRepository.listByQuizId(quizId);

    return questions.map(
      (question): QuestionListItemDTO => ({
        id: question.id,
        text: question.text,
        type: question.type,
        points: question.points,
        orderIndex: question.orderIndex ?? 0,
        hasCorrectAnswers: question.correctAnswers.length > 0,
        mediaUrl: question.media ?? null,
      })
    );
  }
}
