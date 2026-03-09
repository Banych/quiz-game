import { z } from 'zod';

export const AuditLogDTO = z.object({
  id: z.string(),
  quizId: z.string().optional(),
  eventType: z.string(),
  summary: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.string(),
});

export type AuditLogDTO = z.infer<typeof AuditLogDTO>;
