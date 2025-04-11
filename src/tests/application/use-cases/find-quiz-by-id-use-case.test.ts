import { describe, it, expect, vi } from 'vitest';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { FindQuizByIdUseCase } from '@application/use-cases/find-quiz-by-id.use-case';

describe('FindQuizByIdUseCase', () => {
  const mockQuizRepository: IQuizRepository = {
    findById: vi.fn(),
    delete: vi.fn(),
    save: vi.fn(),
  };

  const findQuizByIdUseCase = new FindQuizByIdUseCase(mockQuizRepository);

  it('should throw an error if quizId is not provided', async () => {
    await expect(findQuizByIdUseCase.execute('')).rejects.toThrow(
      'Quiz ID is required'
    );
  });

  it('should throw an error if quiz is not found', async () => {
    vi.spyOn(mockQuizRepository, 'findById').mockResolvedValueOnce(null);

    await expect(
      findQuizByIdUseCase.execute('non-existent-id')
    ).rejects.toThrow('Quiz with ID non-existent-id not found');
  });

  it('should return the quiz if found', async () => {
    const mockQuiz = {} as QuizSessionAggregate;
    vi.spyOn(mockQuizRepository, 'findById').mockResolvedValueOnce(mockQuiz);

    const result = await findQuizByIdUseCase.execute('existing-id');

    expect(result).toBe(mockQuiz);
    expect(mockQuizRepository.findById).toHaveBeenCalledWith('existing-id');
  });
});
