'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'quiz-game-player-session';

type StoredSession = {
  quizId: string;
  playerId: string;
  playerName: string;
};

type JoinResponse = {
  quiz: {
    id: string;
    title: string;
  };
  player: {
    id: string;
    name: string;
  };
};

export function PlayerJoinForm() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storedSession, setStoredSession] = useState<StoredSession | null>(
    null
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredSession;
        setStoredSession(parsed);
      }
    } catch (storageError) {
      console.warn('Unable to read stored player session', storageError);
    }
  }, []);

  const persistSession = (session: StoredSession) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setStoredSession(session);
    } catch (storageError) {
      console.warn('Unable to persist player session', storageError);
    }
  };

  const clearStoredSession = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.warn('Unable to clear stored session', storageError);
    }
    setStoredSession(null);
  };

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = joinCode.trim().toUpperCase();
    const trimmedName = playerName.trim();

    if (!trimmedCode || !trimmedName) {
      setError('Enter both a join code and your name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          joinCode: trimmedCode,
          playerName: trimmedName,
        }),
      });

      if (!response.ok) {
        const { error: joinError } = (await response
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(joinError ?? 'Unable to join the quiz.');
      }

      const payload = (await response.json()) as JoinResponse;
      const session: StoredSession = {
        quizId: payload.quiz.id,
        playerId: payload.player.id,
        playerName: payload.player.name,
      };

      persistSession(session);
      setJoinCode('');
      setPlayerName('');
      router.push(`/play/${payload.quiz.id}/${payload.player.id}`);
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : 'Unable to join right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = () => {
    if (!storedSession) {
      return;
    }

    router.push(`/play/${storedSession.quizId}/${storedSession.playerId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-12">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">
            Quiz Game
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Join the action</h1>
          <p className="mt-2 text-base text-slate-200/80">
            Enter the code from the host screen and pick a display name. We’ll
            keep you synced the moment the round starts.
          </p>
        </header>

        <form
          onSubmit={handleJoin}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <div className="space-y-5">
            <label className="block text-sm font-medium text-white/80">
              Join code
              <input
                type="text"
                value={joinCode}
                maxLength={16}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase())
                }
                placeholder="ABCD"
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-lg tracking-[0.4em] text-center uppercase text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                disabled={isSubmitting}
                inputMode="text"
                autoComplete="off"
              />
            </label>

            <label className="block text-sm font-medium text-white/80">
              Your name
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Alex"
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                disabled={isSubmitting}
                autoComplete="name"
              />
            </label>

            <Button
              type="submit"
              className="w-full rounded-2xl bg-emerald-400 text-base font-semibold text-emerald-950 hover:bg-emerald-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Connecting…' : 'Join quiz'}
            </Button>
          </div>

          {error ? <p className="mt-4 text-sm text-rose-200">{error}</p> : null}
        </form>

        {storedSession ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
            <p className="text-base font-semibold text-white">
              Resume previous session
            </p>
            <p className="mt-1 text-white/70">
              {storedSession.playerName} • Quiz ID{' '}
              {storedSession.quizId.slice(0, 8)}…
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="w-full rounded-2xl bg-white/90 text-base font-semibold text-slate-950 hover:bg-white"
                onClick={handleResume}
              >
                Reopen session
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-2xl text-white hover:bg-white/10"
                onClick={clearStoredSession}
              >
                Forget this device
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
