'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';
import { Badge } from '@ui/badge';
import type { AuditLogDTO } from '@application/dtos/audit-log.dto';
import type { QuizListItemDTO } from '@application/dtos/quiz-admin.dto';

const EVENT_BADGE_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  quiz_created: 'secondary',
  quiz_started: 'default',
  question_advanced: 'outline',
  question_locked: 'outline',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function AuditLogTable() {
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');

  const { data: quizzes = [], error: quizzesError } = useQuery<
    QuizListItemDTO[]
  >({
    queryKey: ['admin', 'quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/quizzes');
      if (!res.ok) throw new Error('Failed to load quizzes');
      return res.json();
    },
    staleTime: 30_000,
  });

  const {
    data: logs = [],
    isLoading,
    error: logsError,
  } = useQuery<AuditLogDTO[]>({
    queryKey: ['admin', 'audit', selectedQuizId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedQuizId !== 'all') params.set('quizId', selectedQuizId);
      const res = await fetch(`/api/admin/audit?${params}`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      return res.json();
    },
    staleTime: 10_000,
  });

  if (quizzesError || logsError) {
    return (
      <div className="text-center py-8 text-sm text-destructive">
        {quizzesError
          ? 'Failed to load quizzes.'
          : 'Failed to load audit logs.'}{' '}
        Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by quiz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All quizzes</SelectItem>
            {quizzes.map((q) => (
              <SelectItem key={q.id} value={q.id}>
                {q.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {logs.length} event{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Quiz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No audit events found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const quiz = quizzes.find((q) => q.id === log.quizId);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          EVENT_BADGE_VARIANT[log.eventType] ?? 'outline'
                        }
                      >
                        {log.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.summary}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {quiz?.title ?? log.quizId ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
