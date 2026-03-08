export interface AuditLogDTO {
  id: string;
  quizId?: string;
  eventType: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
