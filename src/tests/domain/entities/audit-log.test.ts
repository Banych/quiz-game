import { describe, it, expect } from 'vitest';
import { AuditLog, AuditEventType } from '@domain/entities/audit-log';

const makeLog = (eventType = AuditEventType.QuizCreated) =>
  new AuditLog('log-1', eventType);

describe('AuditLog entity', () => {
  it('creates a log with required fields', () => {
    const log = makeLog();
    expect(log.id).toBe('log-1');
    expect(log.eventType).toBe(AuditEventType.QuizCreated);
    expect(log.metadata).toEqual({});
    expect(log.createdAt).toBeInstanceOf(Date);
  });

  it('stores optional quizId and actorId', () => {
    const log = new AuditLog('log-2', AuditEventType.QuizStarted, {
      quizId: 'quiz-abc',
      actorId: 'user-xyz',
    });
    expect(log.quizId).toBe('quiz-abc');
    expect(log.actorId).toBe('user-xyz');
  });

  it('stores metadata', () => {
    const log = new AuditLog('log-3', AuditEventType.QuestionAdvanced, {
      metadata: { questionIndex: 2 },
    });
    expect(log.metadata).toEqual({ questionIndex: 2 });
  });

  it('uses provided createdAt date', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const log = new AuditLog('log-4', AuditEventType.QuestionLocked, {
      createdAt: date,
    });
    expect(log.createdAt).toBe(date);
  });

  it('all AuditEventType values are defined', () => {
    expect(AuditEventType.QuizCreated).toBe('quiz_created');
    expect(AuditEventType.QuizStarted).toBe('quiz_started');
    expect(AuditEventType.QuestionAdvanced).toBe('question_advanced');
    expect(AuditEventType.QuestionLocked).toBe('question_locked');
  });
});
