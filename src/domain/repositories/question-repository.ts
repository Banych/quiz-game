import { Question } from '@domain/entities/question';

export type QuestionOrderUpdate = {
  questionId: string;
  orderIndex: number;
};

export interface IQuestionRepository {
  findById(id: string): Promise<Question | null>;
  listByQuizId(quizId: string): Promise<Question[]>;
  listPublishedByQuizId(quizId: string): Promise<Question[]>;
  updatePublishState(questionId: string, isPublished: boolean): Promise<void>;
  updateOrder(order: QuestionOrderUpdate[]): Promise<void>;
  save(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
}
