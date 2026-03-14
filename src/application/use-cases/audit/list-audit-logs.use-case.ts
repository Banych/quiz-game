import type { IAuditLogRepository } from '@domain/repositories/audit-log-repository';
import type { AuditLogDTO } from '@application/dtos/audit-log.dto';
import type { AuditLog } from '@domain/entities/audit-log';

const SUMMARY_MAP: Record<string, string> = {
  quiz_created: 'Quiz created',
  quiz_started: 'Quiz started',
  question_advanced: 'Question advanced',
  question_locked: 'Question locked',
};

const mapToDTO = (log: AuditLog): AuditLogDTO => ({
  id: log.id,
  quizId: log.quizId,
  eventType: log.eventType,
  summary: SUMMARY_MAP[log.eventType] ?? log.eventType,
  metadata: log.metadata,
  createdAt: log.createdAt.toISOString(),
});

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(params: {
    quizId?: string;
    limit?: number;
  }): Promise<AuditLogDTO[]> {
    const limit = params.limit ?? 100;
    const logs = params.quizId
      ? await this.auditLogRepository.findByQuizId(params.quizId, limit)
      : await this.auditLogRepository.findRecent(limit);
    return logs.map(mapToDTO);
  }
}
