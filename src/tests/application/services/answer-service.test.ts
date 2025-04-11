import { AnswerService } from '@application/services/answer-service';
import { SubmitAnswerUseCase } from '@application/use-cases/submit-answer.use-case';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('AnswerService', () => {
  let submitAnswerUseCase: Mocked<SubmitAnswerUseCase>;
  let answerService: AnswerService;

  beforeEach(() => {
    submitAnswerUseCase = {
      execute: vi.fn(),
    } as unknown as Mocked<SubmitAnswerUseCase>;

    answerService = new AnswerService(submitAnswerUseCase);
  });

  it('should submit an answer for a player', async () => {
    await answerService.submitAnswer('quiz1', 'p1', 'q1', 'Answer');
    expect(submitAnswerUseCase.execute).toHaveBeenCalledWith(
      'quiz1',
      'p1',
      'q1',
      'Answer'
    );
  });
});
