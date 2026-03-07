'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui/dialog';
import { Button } from '@ui/button';
import type { QuestionListItemDTO } from '@application/dtos/question-admin.dto';

interface DeleteQuestionDialogProps {
  quizId: string;
  question: QuestionListItemDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteQuestionDialog({
  quizId,
  question,
  open,
  onOpenChange,
}: DeleteQuestionDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/admin/quizzes/${quizId}/questions/${question.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete question');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] }); // Update question count
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Question</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm font-medium line-clamp-2">{question.text}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              Type: {question.type}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              Points: {question.points}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
