import { AuditLog, AuditEventType } from '@domain/entities/audit-log';
import type { IAuditLogRepository } from '@domain/repositories/audit-log-repository';
import { randomUUID } from 'crypto';

export type LogEventParams = {
  eventType: AuditEventType;
  quizId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
};

export class LogEventUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(params: LogEventParams): Promise<void> {
    const log = new AuditLog(randomUUID(), params.eventType, {
      quizId: params.quizId,
      actorId: params.actorId,
      metadata: params.metadata,
    });
    await this.auditLogRepository.save(log);
  }
}
