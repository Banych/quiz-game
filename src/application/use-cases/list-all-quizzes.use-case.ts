import type { IQuizRepository } from '@domain/repositories/quiz-repository';
import type { QuizListItemDTO } from '@application/dtos/quiz-admin.dto';

export class ListAllQuizzesUseCase {
  constructor(private readonly quizRepository: IQuizRepository) {}

  async execute(): Promise<QuizListItemDTO[]> {
    const quizzes = await this.quizRepository.findAll();

    return quizzes.map(
      (quiz): QuizListItemDTO => ({
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        questionCount: quiz.questions.length,
        playerCount: quiz.players.size,
        timePerQuestion: quiz.settings.timePerQuestion,
        allowSkipping: quiz.settings.allowSkipping,
        joinCode: quiz.joinCode || null,
        createdAt: new Date().toISOString(), // Will be populated from DB
        updatedAt: new Date().toISOString(), // Will be populated from DB
      })
    );
  }
}
