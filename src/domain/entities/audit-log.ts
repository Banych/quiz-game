export enum AuditEventType {
  QuizCreated = 'quiz_created',
  QuizStarted = 'quiz_started',
  QuestionAdvanced = 'question_advanced',
  QuestionLocked = 'question_locked',
}

export class AuditLog {
  id: string;
  eventType: AuditEventType;
  quizId?: string;
  actorId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;

  constructor(
    id: string,
    eventType: AuditEventType,
    options?: {
      quizId?: string;
      actorId?: string;
      metadata?: Record<string, unknown>;
      createdAt?: Date;
    }
  ) {
    this.id = id;
    this.eventType = eventType;
    this.quizId = options?.quizId;
    this.actorId = options?.actorId;
    this.metadata = options?.metadata ?? {};
    this.createdAt = options?.createdAt ?? new Date();
  }
}
