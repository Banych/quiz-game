import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';

export interface IQuizRepository {
  findById(id: string): Promise<QuizSessionAggregate | null>;
  save(quiz: QuizSessionAggregate): Promise<void>;
  delete(id: string): Promise<void>;
}
