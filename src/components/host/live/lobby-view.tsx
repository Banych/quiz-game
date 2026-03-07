'use client';
import type { QuizDTO } from '@application/dtos/quiz.dto';
import type { PlayerDTO } from '@application/dtos/player.dto';

type Props = { quiz: QuizDTO; startingSoon?: boolean };

export function LobbyView({ quiz, startingSoon }: Props) {
  const { title, joinCode, players } = quiz;
  const playerCount = players.length;
  const pluralSuffix = playerCount === 1 ? '' : 's';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-8 py-12">
      {/* Quiz title */}
      <h1 className="text-3xl font-bold text-gray-300 mb-2 text-center">
        {title}
      </h1>

      {/* Join instruction */}
      <p className="text-xl text-gray-400 mb-8">Join at quiz.app</p>

      {/* Join code */}
      <div className="font-mono font-black tracking-widest leading-none text-white text-9xl mb-10 select-all">
        {joinCode ?? '----'}
      </div>

      {/* Status */}
      <p className="text-2xl text-gray-400 mt-8 mb-6">
        {startingSoon ? 'Starting soon...' : 'Waiting for host to start...'}
      </p>

      {/* Player count */}
      <p className="text-lg text-gray-500 mb-6">
        {playerCount} player{pluralSuffix} joined
      </p>

      {/* Player grid */}
      {playerCount > 0 && (
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
          {players.map((player: PlayerDTO) => (
            <span
              key={player.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300 inline-block bg-gray-800 text-gray-100 text-base font-medium px-4 py-2 rounded-full border border-gray-700"
            >
              {player.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
