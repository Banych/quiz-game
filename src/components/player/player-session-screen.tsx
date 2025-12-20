'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { PlayerSessionDTO } from '@application/dtos/player-session.dto';
import { usePlayerSession } from '@hooks/use-player-session';
import { useCountdownTimer } from '@hooks/use-countdown-timer';
import { Button } from '@/components/ui/button';

interface PlayerSessionScreenProps {
  quizId: string;
  playerId: string;
  initialSession: PlayerSessionDTO;
}

const formatSeconds = (value: number | null | undefined) => {
  if (typeof value !== 'number') {
    return '00:00';
  }

  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
};

export function PlayerSessionScreen({
  quizId,
  playerId,
  initialSession,
}: PlayerSessionScreenProps) {
  const {
    data,
    error,
    isFetching,
    isPending,
    refetch,
    submitAnswer,
    isSubmittingAnswer,
  } = usePlayerSession({
    quizId,
    playerId,
    initialData: initialSession,
  });

  const session = data ?? initialSession;
  const [answerValue, setAnswerValue] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );

  // Client-side countdown for smooth timer updates
  const currentRemaining = useCountdownTimer({
    remainingSeconds: session.quiz.timer.remainingSeconds,
    startTime: session.quiz.timer.startTime,
    duration: session.quiz.timer.duration,
    isActive:
      session.quiz.status === 'Active' && !!session.quiz.timer.startTime,
  });

  const activeQuestionId = useMemo(() => {
    return (
      session.quiz.activeQuestionId ??
      session.quiz.questions[session.quiz.currentQuestionIndex]?.id ??
      null
    );
  }, [session.quiz]);

  const questionCount = session.quiz.questions.length;
  const currentQuestionNumber =
    questionCount > 0
      ? Math.min(session.quiz.currentQuestionIndex + 1, questionCount)
      : 0;

  const leaderboardEntry = useMemo(() => {
    return session.quiz.leaderboard?.find(
      (entry) => entry.playerId === session.player.id
    );
  }, [session.player.id, session.quiz.leaderboard]);

  const playerScore = leaderboardEntry?.score ?? session.player.score ?? 0;

  const handleSubmit = async () => {
    if (!activeQuestionId) {
      setSubmissionMessage(
        'Hang tight — the host will start the next round soon.'
      );
      return;
    }

    const trimmed = answerValue.trim();
    if (!trimmed) {
      setSubmissionMessage('Enter an answer before submitting.');
      return;
    }

    setSubmissionMessage(null);

    try {
      await submitAnswer({ questionId: activeQuestionId, answer: trimmed });
      setAnswerValue('');
      setSubmissionMessage(
        'Answer received! You can adjust until the host locks it in.'
      );
    } catch (submitError) {
      setSubmissionMessage(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to send your answer. Please try again.'
      );
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  const waitingForQuestion =
    !activeQuestionId && session.quiz.status !== 'Completed';
  const canSubmit = Boolean(activeQuestionId) && Boolean(answerValue.trim());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
        <header className="text-center">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Joined as
          </p>
          <h1 className="text-3xl font-semibold">{session.player.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quiz: {session.quiz.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Status:{' '}
            <span className="font-semibold">{session.player.status}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Score: <span className="font-mono text-base">{playerScore}</span>
          </p>
        </header>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : 'Unable to sync with the quiz. Try refreshing.'}
          </div>
        ) : null}

        <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Round progress
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <p className="text-4xl font-mono">
                {formatSeconds(currentRemaining)}
              </p>
              <p className="text-xs text-muted-foreground">
                Timer • {session.quiz.timer.duration}s total
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">
                {questionCount > 0 ? currentQuestionNumber : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Question of {questionCount || '—'}
              </p>
            </div>
          </div>
          {waitingForQuestion ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Waiting for the host to launch the next question.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Submit your answer</h2>
            {isFetching || isPending ? (
              <span className="text-xs uppercase text-muted-foreground">
                Syncing…
              </span>
            ) : null}
          </header>
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div>
              <label className="text-xs uppercase text-muted-foreground">
                Your response
              </label>
              <input
                type="text"
                value={answerValue}
                disabled={
                  isSubmittingAnswer || session.quiz.status !== 'Active'
                }
                onChange={(event) => setAnswerValue(event.target.value)}
                placeholder={
                  waitingForQuestion ? 'Waiting for host…' : 'Type your answer'
                }
                className="mt-1 w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmittingAnswer ||
                !canSubmit ||
                session.quiz.status !== 'Active'
              }
            >
              {isSubmittingAnswer ? 'Sending…' : 'Send answer'}
            </Button>
          </form>
          {submissionMessage ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {submissionMessage}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card/80 p-4 text-sm text-muted-foreground">
          <p>
            Connected players: {session.quiz.players.length}. Keep this tab open
            so we can record your latency and results. If things look frozen,
            tap the button below to sync.
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full"
            onClick={() => refetch()}
            disabled={isFetching || isSubmittingAnswer}
          >
            {isFetching ? 'Refreshing…' : 'Sync now'}
          </Button>
        </section>
      </div>
    </div>
  );
}
