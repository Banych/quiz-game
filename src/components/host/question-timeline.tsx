'use client';

import { cn } from '@/lib/utils';

interface QuestionTimelineProps {
  questions: Array<{
    id: string;
    text: string;
    points: number;
  }>;
  /**
   * ID of the currently active question
   */
  activeQuestionId: string | null;
  /**
   * Current question index (0-based)
   */
  currentQuestionIndex: number;
  /**
   * Compact mode shows minimal info
   */
  compact?: boolean;
}

export function QuestionTimeline({
  questions,
  activeQuestionId,
  currentQuestionIndex,
  compact = false,
}: QuestionTimelineProps) {
  const totalQuestions = questions.length;
  const progressPercentage =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Header with progress */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Questions</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              currentQuestionIndex === totalQuestions - 1
                ? 'bg-blue-500/15 text-blue-500'
                : 'bg-primary/15 text-primary'
            )}
          >
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question list */}
      <ol className="space-y-3">
        {questions.map((question, index) => {
          const isActive = question.id === activeQuestionId;
          const isCompleted = index < currentQuestionIndex;
          const isUpcoming = index > currentQuestionIndex;

          return (
            <li
              key={question.id}
              className={cn(
                'relative rounded-lg border px-4 py-3 transition-all duration-300',
                isActive &&
                  'border-primary bg-primary/10 ring-2 ring-primary/20',
                isCompleted && 'border-green-500/50 bg-green-500/5',
                isUpcoming && 'border-transparent bg-muted/40 opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-green-500 text-white',
                    isUpcoming && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                {/* Question content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">
                    Question {index + 1}
                    {isActive && (
                      <span className="ml-2 text-primary">• Active</span>
                    )}
                    {isCompleted && (
                      <span className="ml-2 text-green-600">• Completed</span>
                    )}
                  </p>
                  {!compact && (
                    <p
                      className={cn(
                        'text-base font-medium',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {question.text}
                    </p>
                  )}
                </div>

                {/* Points badge */}
                <div
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-sm font-mono',
                    isActive && 'bg-primary/20 text-primary',
                    isCompleted && 'bg-green-500/20 text-green-600',
                    isUpcoming && 'bg-muted text-muted-foreground'
                  )}
                >
                  {question.points} pts
                </div>
              </div>

              {/* Completion indicator line */}
              {isCompleted && (
                <div className="absolute bottom-0 left-0 h-1 w-full bg-green-500/50" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Summary footer */}
      {!compact && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
          <span>
            Completed: {currentQuestionIndex} / {totalQuestions}
          </span>
          <span>
            Remaining: {Math.max(0, totalQuestions - currentQuestionIndex - 1)}
          </span>
        </div>
      )}
    </div>
  );
}
