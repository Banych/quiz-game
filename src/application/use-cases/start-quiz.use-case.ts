import { IQuizRepository } from '@domain/repositories/quiz-repository';

export class StartQuizUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute(quizId: string): Promise<void> {
    const quiz = await this.quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found.');
    }

    quiz.startQuiz();

    await this.quizRepository.save(quiz);
  }
}
