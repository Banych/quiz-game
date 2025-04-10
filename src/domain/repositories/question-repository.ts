import { Question } from '@domain/entities/question';

export interface IQuestionRepository {
  findById(id: string): Promise<Question | null>;
  save(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
}
