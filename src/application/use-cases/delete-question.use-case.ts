import type { IQuestionRepository } from '@domain/repositories/question-repository';

/**
 * Use case: Delete a question
 * Business rules:
 * - Question must exist
 * - Deleting a question doesn't reorder remaining questions (gaps in orderIndex are acceptable)
 * - Cascade deletes handled by Prisma schema (answers deleted automatically)
 */
export class DeleteQuestionUseCase {
  constructor(private readonly questionRepository: IQuestionRepository) {}

  async execute(questionId: string): Promise<void> {
    // Verify question exists
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    // Delete
    await this.questionRepository.delete(questionId);
  }
}
