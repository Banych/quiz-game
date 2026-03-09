'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@ui/button';
import { Badge } from '@ui/badge';
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
import { CreateQuestionDialog } from '@components/admin/create-question-dialog';
import { EditQuestionDialog } from '@components/admin/edit-question-dialog';
import { DeleteQuestionDialog } from '@components/admin/delete-question-dialog';
import type { QuestionListItemDTO } from '@application/dtos/question-admin.dto';
import type { QuizListItemDTO } from '@application/dtos/quiz-admin.dto';

export function AllQuestionsView() {
  const queryClient = useQueryClient();
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');
  const [editingQuestion, setEditingQuestion] =
    useState<QuestionListItemDTO | null>(null);
  const [deletingQuestion, setDeletingQuestion] =
    useState<QuestionListItemDTO | null>(null);

  const { data: quizzes } = useQuery({
    queryKey: ['admin', 'quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/quizzes');
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json() as Promise<QuizListItemDTO[]>;
    },
  });

  const {
    data: questions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['all-questions', selectedQuizId],
    queryFn: async () => {
      const url =
        selectedQuizId === 'all'
          ? '/api/admin/questions'
          : `/api/admin/questions?quizId=${selectedQuizId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json() as Promise<QuestionListItemDTO[]>;
    },
  });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['all-questions'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All quizzes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All quizzes</SelectItem>
            {quizzes?.map((quiz) => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedQuizId !== 'all' && (
          <CreateQuestionDialog quizId={selectedQuizId} />
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Loading questions...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-sm text-destructive">
          Failed to load questions. Please try again.
        </div>
      )}

      {!isLoading && !error && (!questions || questions.length === 0) && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No questions found.
        </div>
      )}

      {questions && questions.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Points</TableHead>
                <TableHead className="hidden sm:table-cell">Answers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {question.quizTitle ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {question.orderIndex + 1}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="line-clamp-2">{question.text}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{question.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {question.points}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {question.hasCorrectAnswers ? (
                      <Badge variant="secondary">Set</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit"
                      aria-label="Edit question"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Delete"
                      aria-label="Delete question"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingQuestion(question)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingQuestion && editingQuestion.quizId && (
        <EditQuestionDialog
          quizId={editingQuestion.quizId}
          question={editingQuestion}
          open={!!editingQuestion}
          onOpenChange={(open) => {
            if (!open) {
              setEditingQuestion(null);
              handleMutationSuccess();
            }
          }}
        />
      )}

      {deletingQuestion && deletingQuestion.quizId && (
        <DeleteQuestionDialog
          quizId={deletingQuestion.quizId}
          question={deletingQuestion}
          open={!!deletingQuestion}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingQuestion(null);
              handleMutationSuccess();
            }
          }}
        />
      )}
    </div>
  );
}
