import type { IQuizRepository } from '@domain/repositories/quiz-repository';
import type { IQuestionRepository } from '@domain/repositories/question-repository';
import type { QuestionListItemDTO } from '@application/dtos/question-admin.dto';

export class ListAllQuestionsUseCase {
  constructor(
    private readonly quizRepo: IQuizRepository,
    private readonly questionRepo: IQuestionRepository
  ) {}

  async execute(params: {
    quizId?: string;
    type?: string;
  }): Promise<QuestionListItemDTO[]> {
    const { quizId, type } = params;

    const quizzes = quizId
      ? [await this.quizRepo.findEntityById(quizId)].filter(Boolean)
      : await this.quizRepo.findAll();

    const allResults = await Promise.all(
      (quizzes as NonNullable<(typeof quizzes)[number]>[]).map(async (quiz) => {
        const questions = await this.questionRepo.listByQuizId(quiz.id);
        return questions
          .filter((q) => !type || q.type === type)
          .map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            points: q.points,
            orderIndex: q.orderIndex ?? 0,
            hasCorrectAnswers: q.correctAnswers.length > 0,
            mediaUrl: q.media ?? null,
            quizId: quiz.id,
            quizTitle: quiz.title,
          }));
      })
    );

    return allResults.flat();
  }
}
