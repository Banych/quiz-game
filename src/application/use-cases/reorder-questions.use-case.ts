import type { IQuestionRepository } from '@domain/repositories/question-repository';
import type { ReorderQuestionsDTO } from '@application/dtos/question-admin.dto';

/**
 * Use case: Reorder questions via drag-drop
 * Business rules:
 * - All question IDs must exist and belong to the same quiz
 * - Updates orderIndex for all provided questions atomically
 * - Repository handles transaction to ensure consistency
 */
export class ReorderQuestionsUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(dto: ReorderQuestionsDTO): Promise<void> {
    if (dto.questions.length === 0) {
      return; // Nothing to reorder
    }

    // Verify all questions exist and belong to same quiz
    const firstQuestion = await this.questionRepository.findById(
      dto.questions[0].id
    );
    if (!firstQuestion) {
      throw new Error(`Question not found: ${dto.questions[0].id}`);
    }

    const quizId = firstQuestion.quizId;
    if (!quizId) {
      throw new Error('Question must belong to a quiz to be reordered');
    }

    // Validate remaining questions
    for (const { id } of dto.questions.slice(1)) {
      const question = await this.questionRepository.findById(id);
      if (!question) {
        throw new Error(`Question not found: ${id}`);
      }
      if (question.quizId !== quizId) {
        throw new Error(
          `All questions must belong to the same quiz (expected ${quizId}, got ${question.quizId})`
        );
      }
    }

    // Update order via repository (handles transaction)
    // Map DTO to repository format (id -> questionId)
    const orderUpdates = dto.questions.map((q) => ({
      questionId: q.id,
      orderIndex: q.orderIndex,
    }));

    await this.questionRepository.updateOrder(orderUpdates);
  }
}
