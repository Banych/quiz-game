'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScoringSettings } from '@/components/admin/scoring-settings';
import type { UpdateQuizDTO } from '@application/dtos/quiz-admin.dto';
import type { QuizListItemDTO } from '@application/dtos/quiz-admin.dto';
import type { ScoringAlgorithmType } from '@lib/scoring-preview';

type EditQuizDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: QuizListItemDTO;
};

export function EditQuizDialog({
  open,
  onOpenChange,
  quiz,
}: EditQuizDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(quiz.title);
  const [timePerQuestion, setTimePerQuestion] = useState(quiz.timePerQuestion);
  const [allowSkipping, setAllowSkipping] = useState(quiz.allowSkipping);
  const [scoringAlgorithm, setScoringAlgorithm] =
    useState<ScoringAlgorithmType>(
      quiz.scoringAlgorithm || 'EXPONENTIAL_DECAY'
    );
  const [scoringDecayRate, setScoringDecayRate] = useState<number | undefined>(
    quiz.scoringDecayRate || 2.0
  );

  // Reset form when quiz changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(quiz.title);
      setTimePerQuestion(quiz.timePerQuestion);
      setAllowSkipping(quiz.allowSkipping);
      setScoringAlgorithm(quiz.scoringAlgorithm || 'EXPONENTIAL_DECAY');
      setScoringDecayRate(quiz.scoringDecayRate || 2.0);
    }
  }, [open, quiz]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateQuizDTO) => {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update quiz');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quizzes'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title,
      timePerQuestion,
      allowSkipping,
      scoringAlgorithm,
      scoringDecayRate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Quiz</DialogTitle>
          <DialogDescription>
            Update quiz settings. Only available for quizzes in Pending status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Quiz Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-timePerQuestion">
              Time Per Question (seconds)
            </Label>
            <Input
              id="edit-timePerQuestion"
              type="number"
              min={5}
              max={300}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              required
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-allowSkipping"
              checked={allowSkipping}
              onCheckedChange={(checked) => setAllowSkipping(checked === true)}
              disabled={updateMutation.isPending}
            />
            <Label htmlFor="edit-allowSkipping" className="font-normal">
              Allow players to skip questions
            </Label>
          </div>

          <ScoringSettings
            timePerQuestion={timePerQuestion}
            scoringAlgorithm={scoringAlgorithm}
            scoringDecayRate={scoringDecayRate}
            onScoringAlgorithmChange={setScoringAlgorithm}
            onScoringDecayRateChange={setScoringDecayRate}
            disabled={updateMutation.isPending}
          />

          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              {updateMutation.error.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
