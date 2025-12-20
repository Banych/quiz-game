import { QuizRepository } from '@domain/repositories/quiz-repository';

export class DeleteQuizUseCase {
  constructor(private readonly quizRepository: QuizRepository) {}

  async execute(quizId: string): Promise<void> {
    const quiz = await this.quizRepository.findEntityById(quizId);
    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    // Only allow deletion of pending/completed quizzes (not active)
    if (quiz.status === 'Active') {
      throw new Error('Cannot delete an active quiz');
    }

    await this.quizRepository.delete(quizId);
  }
}
