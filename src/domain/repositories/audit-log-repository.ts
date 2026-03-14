import type { AuditLog } from '@domain/entities/audit-log';

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
  findByQuizId(quizId: string, limit?: number): Promise<AuditLog[]>;
  findRecent(limit?: number): Promise<AuditLog[]>;
}
