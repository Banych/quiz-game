import { StartQuizUseCase } from '@application/use-cases/start-quiz.use-case';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';
import { Quiz, QuizStatus } from '@domain/entities/quiz';
import { IQuizRepository } from '@domain/repositories/quiz-repository';
import type { IAuditLogRepository } from '@domain/repositories/audit-log-repository';
import { AuditEventType } from '@domain/entities/audit-log';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('StartQuizUseCase', () => {
  let quizRepository: Mocked<IQuizRepository>;
  let startQuizUseCase: StartQuizUseCase;

  beforeEach(() => {
    quizRepository = {
      findById: vi.fn(),
      findByJoinCode: vi.fn(),
      listByStatus: vi.fn(),
      save: vi.fn(),
      updateCurrentQuestion: vi.fn(),
      updateLeaderboard: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<IQuizRepository>;
    startQuizUseCase = new StartQuizUseCase(quizRepository);
  });

  it('should start a quiz and update its status to Active', async () => {
    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);

    await startQuizUseCase.execute('quiz1');

    expect(quizRepository.findById).toHaveBeenCalledWith('quiz1');
    expect(quiz.quizStatus).toBe(QuizStatus.Active);
    expect(quiz.timerStartTime).toBeDefined();
    expect(quizRepository.save).toHaveBeenCalledWith(quiz);
  });

  it('should throw an error if the quiz is not found', async () => {
    quizRepository.findById.mockResolvedValue(null);

    await expect(startQuizUseCase.execute('invalidQuizId')).rejects.toThrow(
      'Quiz not found.'
    );
    expect(quizRepository.findById).toHaveBeenCalledWith('invalidQuizId');
    expect(quizRepository.save).not.toHaveBeenCalled();
  });

  it('emits QuizStarted audit log when audit repository is provided', async () => {
    const auditLogRepository: Mocked<IAuditLogRepository> = {
      save: vi.fn().mockResolvedValue(undefined),
      findByQuizId: vi.fn(),
      findRecent: vi.fn(),
    };

    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);

    const useCaseWithAudit = new StartQuizUseCase(
      quizRepository,
      auditLogRepository
    );
    await useCaseWithAudit.execute('quiz1');

    await Promise.resolve();
    expect(auditLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AuditEventType.QuizStarted })
    );
  });

  it('does not throw when audit log save fails', async () => {
    const auditLogRepository: Mocked<IAuditLogRepository> = {
      save: vi.fn().mockRejectedValue(new Error('DB error')),
      findByQuizId: vi.fn(),
      findRecent: vi.fn(),
    };

    const quiz = new QuizSessionAggregate(
      new Quiz('quiz1', 'Sample Quiz', [], {
        timePerQuestion: 30,
        allowSkipping: true,
      }),
      30
    );
    quizRepository.findById.mockResolvedValue(quiz);

    const useCaseWithAudit = new StartQuizUseCase(
      quizRepository,
      auditLogRepository
    );
    await expect(useCaseWithAudit.execute('quiz1')).resolves.not.toThrow();
  });
});
