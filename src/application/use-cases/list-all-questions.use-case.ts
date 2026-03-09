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

    const quizList = quizzes as NonNullable<(typeof quizzes)[number]>[];

    const questionsByQuiz = await Promise.all(
      quizList.map((quiz) => this.questionRepo.listByQuizId(quiz.id))
    );

    const results: QuestionListItemDTO[] = [];

    for (let i = 0; i < quizList.length; i++) {
      const quiz = quizList[i];
      const questions = questionsByQuiz[i];
      for (const q of questions) {
        if (type && q.type !== type) continue;
        results.push({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          orderIndex: q.orderIndex ?? 0,
          hasCorrectAnswers: q.correctAnswers.length > 0,
          mediaUrl: q.media ?? null,
          quizId: quiz.id,
          quizTitle: quiz.title,
        });
      }
    }

    return results;
  }
}
