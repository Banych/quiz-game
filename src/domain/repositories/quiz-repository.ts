import { Quiz } from '@/domain/entities/quiz';

export interface IQuizRepository {
  findById(id: string): Promise<Quiz | null>;
  save(quiz: Quiz): Promise<void>;
  delete(id: string): Promise<void>;
}
