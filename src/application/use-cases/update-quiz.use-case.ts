import { QuizRepository } from '@domain/repositories/quiz-repository';
import type { UpdateQuizDTO } from '@application/dtos/quiz-admin.dto';

export class UpdateQuizUseCase {
  constructor(private readonly quizRepository: QuizRepository) {}

  async execute(quizId: string, data: UpdateQuizDTO): Promise<void> {
    const quiz = await this.quizRepository.findEntityById(quizId);
    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    // Only allow updates to pending quizzes for simplicity (MVP)
    if (quiz.status !== 'Pending') {
      throw new Error('Can only update quizzes in Pending status');
    }

    if (data.title !== undefined) {
      quiz.title = data.title;
    }

    if (data.timePerQuestion !== undefined) {
      quiz.settings.timePerQuestion = data.timePerQuestion;
    }

    if (data.allowSkipping !== undefined) {
      quiz.settings.allowSkipping = data.allowSkipping;
    }

    await this.quizRepository.update(quiz);
  }
}
