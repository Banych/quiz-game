'use client';

import { useMemo, useState } from 'react';
import type { QuizDTO } from '@application/dtos/quiz.dto';
import { useHostQuizState } from '@/hooks/use-host-quiz-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HostQuizDashboardProps {
  quizId: string;
  initialQuiz: QuizDTO;
}

const formatSeconds = (value: number | null | undefined) => {
  if (typeof value !== 'number') {
    return '—';
  }
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export function HostQuizDashboard({
  quizId,
  initialQuiz,
}: HostQuizDashboardProps) {
  const {
    data,
    isPending,
    isFetching,
    error,
    refetch,
    startQuiz,
    isStartingQuiz,
    advanceQuestion,
    isAdvancingQuestion,
    resetTimer,
    isResettingTimer,
    snapshotLeaderboard,
    isSnapshottingLeaderboard,
  } = useHostQuizState({
    quizId,
    initialData: initialQuiz,
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = (action: () => Promise<unknown>) => {
    setActionError(null);
    action().catch((actionErr) => {
      setActionError(
        actionErr instanceof Error
          ? actionErr.message
          : 'Something went wrong. Please try again.'
      );
    });
  };

  const quiz = data ?? initialQuiz;

  const activeQuestion = useMemo(() => {
    return quiz.questions[quiz.currentQuestionIndex] ?? null;
  }, [quiz]);

  const leaderboard = quiz.leaderboard ?? [];
  const isMutating =
    isStartingQuiz ||
    isAdvancingQuestion ||
    isResettingTimer ||
    isSnapshottingLeaderboard;
  const canControlTimer = quiz.status === 'Active';
  const canAdvance = quiz.status === 'Active' && quiz.questions.length > 0;
  const startButtonLabel =
    quiz.status === 'Pending' ? 'Start quiz' : 'Resume quiz';
  const hasActiveTimer = typeof quiz.timer.remainingSeconds === 'number';

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Host Dashboard
            </p>
            <h1 className="text-3xl font-semibold">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              Join code:{' '}
              <span className="font-mono text-base">
                {quiz.joinCode ?? '—'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-full px-4 py-1 text-sm font-medium capitalize',
                quiz.status === 'Active' && 'bg-green-600/15 text-green-600',
                quiz.status === 'Pending' && 'bg-amber-500/15 text-amber-500',
                quiz.status === 'Completed' && 'bg-blue-600/15 text-blue-600'
              )}
            >
              {quiz.status}
            </span>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isPending || isMutating}
            >
              Sync now {isFetching ? '…' : ''}
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error instanceof Error
              ? error.message
              : 'Unable to load quiz state.'}
          </div>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Controls</h2>
            {isMutating ? (
              <span className="text-xs uppercase text-muted-foreground">
                Updating…
              </span>
            ) : null}
          </header>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={isStartingQuiz}
              onClick={() => runAction(() => startQuiz())}
            >
              {isStartingQuiz ? 'Starting…' : startButtonLabel}
            </Button>
            <Button
              variant="secondary"
              disabled={!canAdvance || isAdvancingQuestion}
              onClick={() => runAction(() => advanceQuestion())}
            >
              {isAdvancingQuestion ? 'Advancing…' : 'Next question'}
            </Button>
            <Button
              variant="outline"
              disabled={!canControlTimer || isResettingTimer}
              onClick={() => runAction(() => resetTimer(undefined))}
            >
              {isResettingTimer ? 'Resetting…' : 'Reset timer'}
            </Button>
            <Button
              variant="ghost"
              disabled={isSnapshottingLeaderboard}
              onClick={() => runAction(() => snapshotLeaderboard())}
            >
              {isSnapshottingLeaderboard ? 'Saving…' : 'Snapshot leaderboard'}
            </Button>
          </div>
          {actionError ? (
            <p className="mt-3 text-sm text-destructive">{actionError}</p>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Timer</h2>
              <span className="text-xs uppercase text-muted-foreground">
                Duration: {quiz.timer.duration}s
              </span>
            </header>
            <p className="mt-6 text-5xl font-mono">
              {formatSeconds(quiz.timer.remainingSeconds)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Started:{' '}
              {quiz.timer.startTime
                ? new Date(quiz.timer.startTime).toLocaleTimeString()
                : '—'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Current question:{' '}
              {activeQuestion ? activeQuestion.text : 'No active question'}
            </p>
            {!hasActiveTimer && canControlTimer ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Timer paused — reset to restart countdown.
              </p>
            ) : null}
          </article>

          <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Leaderboard</h2>
              <span className="text-xs uppercase text-muted-foreground">
                {leaderboard.length} players
              </span>
            </header>
            <ul className="mt-4 space-y-2">
              {leaderboard.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No scores yet.
                </li>
              ) : (
                leaderboard.map((entry, index) => (
                  <li
                    key={entry.playerId}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span className="font-semibold">#{index + 1}</span>
                    <span className="flex-1 px-3 text-sm text-muted-foreground">
                      {quiz.players.find(
                        (player) => player.id === entry.playerId
                      )?.name ?? entry.playerId}
                    </span>
                    <span className="font-mono text-lg">{entry.score}</span>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions</h2>
            <p className="text-sm text-muted-foreground">
              Showing {quiz.questions.length} total questions
            </p>
          </header>
          <ol className="space-y-3">
            {quiz.questions.map((question, index) => {
              const isActive = question.id === quiz.activeQuestionId;
              return (
                <li
                  key={question.id}
                  className={cn(
                    'rounded-lg border px-4 py-3 transition-colors',
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase text-muted-foreground">
                        Question {index + 1}
                      </p>
                      <p className="text-base font-medium">{question.text}</p>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">
                      {question.points} pts
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Players</h2>
            <p className="text-sm text-muted-foreground">
              {quiz.players.length} connected
            </p>
          </header>
          <div className="grid gap-3 md:grid-cols-2">
            {quiz.players.map((player) => (
              <div
                key={player.id}
                className="rounded-lg border border-border/80 px-3 py-2"
              >
                <p className="font-medium">{player.name}</p>
                <p className="text-xs uppercase text-muted-foreground">
                  {player.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
