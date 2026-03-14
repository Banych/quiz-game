import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListAuditLogsUseCase } from '@application/use-cases/audit/list-audit-logs.use-case';
import type { IAuditLogRepository } from '@domain/repositories/audit-log-repository';
import { AuditLog, AuditEventType } from '@domain/entities/audit-log';

const makeLog = (id: string, eventType: AuditEventType, quizId?: string) =>
  new AuditLog(id, eventType, { quizId, createdAt: new Date('2026-01-01') });

const mockAuditRepo: IAuditLogRepository = {
  save: vi.fn(),
  findByQuizId: vi.fn(),
  findRecent: vi.fn(),
};

describe('ListAuditLogsUseCase', () => {
  let useCase: ListAuditLogsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListAuditLogsUseCase(mockAuditRepo);
  });

  it('returns recent logs when no quizId provided', async () => {
    vi.mocked(mockAuditRepo.findRecent).mockResolvedValueOnce([
      makeLog('l-1', AuditEventType.QuizCreated, 'q-1'),
      makeLog('l-2', AuditEventType.QuizStarted, 'q-1'),
    ]);

    const result = await useCase.execute({});

    expect(mockAuditRepo.findRecent).toHaveBeenCalledWith(100);
    expect(mockAuditRepo.findByQuizId).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('uses findByQuizId when quizId is provided', async () => {
    vi.mocked(mockAuditRepo.findByQuizId).mockResolvedValueOnce([
      makeLog('l-1', AuditEventType.QuizCreated, 'q-1'),
    ]);

    const result = await useCase.execute({ quizId: 'q-1' });

    expect(mockAuditRepo.findByQuizId).toHaveBeenCalledWith('q-1', 100);
    expect(result).toHaveLength(1);
    expect(result[0].quizId).toBe('q-1');
  });

  it('maps event types to human-readable summaries', async () => {
    vi.mocked(mockAuditRepo.findRecent).mockResolvedValueOnce([
      makeLog('l-1', AuditEventType.QuizCreated),
      makeLog('l-2', AuditEventType.QuizStarted),
      makeLog('l-3', AuditEventType.QuestionAdvanced),
      makeLog('l-4', AuditEventType.QuestionLocked),
    ]);

    const result = await useCase.execute({});

    expect(result[0].summary).toBe('Quiz created');
    expect(result[1].summary).toBe('Quiz started');
    expect(result[2].summary).toBe('Question advanced');
    expect(result[3].summary).toBe('Question locked');
  });

  it('respects custom limit', async () => {
    vi.mocked(mockAuditRepo.findRecent).mockResolvedValueOnce([]);

    await useCase.execute({ limit: 25 });

    expect(mockAuditRepo.findRecent).toHaveBeenCalledWith(25);
  });

  it('returns empty array when no logs exist', async () => {
    vi.mocked(mockAuditRepo.findRecent).mockResolvedValueOnce([]);

    const result = await useCase.execute({});

    expect(result).toHaveLength(0);
  });

  it('maps DTOs with correct shape', async () => {
    const date = new Date('2026-01-01T00:00:00Z');
    vi.mocked(mockAuditRepo.findRecent).mockResolvedValueOnce([
      new AuditLog('l-1', AuditEventType.QuizCreated, {
        quizId: 'q-1',
        metadata: { title: 'My Quiz' },
        createdAt: date,
      }),
    ]);

    const result = await useCase.execute({});

    expect(result[0]).toMatchObject({
      id: 'l-1',
      quizId: 'q-1',
      eventType: 'quiz_created',
      summary: 'Quiz created',
      metadata: { title: 'My Quiz' },
      createdAt: date.toISOString(),
    });
  });
});
