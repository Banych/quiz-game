'use client';

import { cn } from '@/lib/utils';
import type { QuizDTO } from '@application/dtos/quiz.dto';

type Props = { quiz: QuizDTO };

const PODIUM_COLORS = ['bg-amber-500', 'bg-gray-400', 'bg-orange-700'];
const PODIUM_HEIGHTS = ['h-36', 'h-24', 'h-20'];
const RANK_LABELS = ['1st', '2nd', '3rd'];

export function FinalResultsView({ quiz }: Props) {
  const ranked = [...quiz.leaderboard]
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => {
      const player = quiz.players.find((p) => p.id === entry.playerId);
      return {
        rank: i + 1,
        name: player?.name ?? 'Unknown',
        score: entry.score,
      };
    });

  const podium = ranked.slice(0, 3);
  const podiumOrder = [podium[1], podium[0], podium[2]]; // [2nd, 1st, 3rd]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-10 py-10 gap-10">
      {/* Header */}
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-black text-white">Game Over!</h1>
        <p className="text-xl text-gray-400 font-medium mt-1">{quiz.title}</p>
      </div>

      {/* Podium */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-6">
          {podiumOrder.map((entry, colIdx) => {
            if (!entry) return <div key={colIdx} className="w-32" />;
            // Map column index back to rank index: col 0 → rank 1 (2nd), col 1 → rank 0 (1st), col 2 → rank 2 (3rd)
            const rankIdx = [1, 0, 2][colIdx];
            return (
              <div
                key={entry.rank}
                className="flex flex-col items-center gap-2"
              >
                {rankIdx === 0 && <span className="text-3xl">👑</span>}
                <div className="bg-gray-800 border border-gray-700 rounded-2xl px-6 py-4 text-center">
                  <p className="text-lg font-bold text-white">{entry.name}</p>
                  <p className="text-sm text-gray-400">{entry.score} pts</p>
                </div>
                <div
                  className={cn(
                    'rounded-t-xl flex items-center justify-center text-white font-black text-xl w-32',
                    PODIUM_COLORS[rankIdx],
                    PODIUM_HEIGHTS[rankIdx]
                  )}
                >
                  {RANK_LABELS[rankIdx]}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final Standings */}
      <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-wide self-start">
        Final Standings
      </h2>
      <div className="w-full max-w-2xl flex flex-col gap-2">
        {ranked.map((entry) => (
          <div
            key={entry.rank}
            className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white',
                  PODIUM_COLORS[entry.rank - 1] ?? 'bg-gray-700'
                )}
              >
                {entry.rank}
              </div>
              <span className="font-medium text-white ml-3">{entry.name}</span>
            </div>
            <span className="text-lg font-bold text-white">
              {entry.score} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
