'use client';

import { cn } from '@/lib/utils';
import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';

type Props = { summary: RoundSummaryDTO };

const MEDAL_COLORS = [
  'bg-amber-500',
  'bg-gray-400',
  'bg-orange-700',
  'bg-gray-700',
];

export function RoundResultsView({ summary }: Props) {
  const sortedDeltas = [...summary.leaderboardDeltas].sort(
    (a, b) => a.currentRank - b.currentRank
  );

  const topScorers = [...summary.playerResults]
    .filter((r) => r.correct)
    .sort((a, b) => b.pointsEarned - a.pointsEarned)
    .slice(0, 3);

  const accuracy =
    summary.totalPlayers > 0
      ? Math.round((summary.correctCount / summary.totalPlayers) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col px-10 py-8 gap-8">
      {/* Correct Answer Banner */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xl text-gray-400 font-medium">
          Q{summary.questionIndex + 1}: {summary.questionText}
        </p>
        <div className="bg-green-600/20 border border-green-500/40 rounded-2xl px-8 py-4 flex flex-col items-center gap-1">
          <span className="text-sm text-green-400 uppercase tracking-widest font-semibold">
            Correct Answer
          </span>
          <span className="text-4xl font-bold text-green-400">
            {summary.correctAnswer}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            value: `${summary.correctCount}/${summary.totalPlayers}`,
            label: 'Correct',
          },
          { value: `${accuracy}%`, label: 'Accuracy' },
          {
            value:
              summary.averageTime !== null
                ? `${summary.averageTime.toFixed(1)}s`
                : '—',
            label: 'Avg Time',
          },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col items-center gap-1"
          >
            <span className="text-4xl font-bold text-white">{value}</span>
            <span className="text-sm text-gray-400 uppercase tracking-wide">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Two Columns */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Leaderboard */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-wide">
            Leaderboard
          </h2>
          <div className="flex flex-col gap-2">
            {sortedDeltas.map((delta) => (
              <div
                key={delta.playerId}
                className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold">
                    {delta.currentRank}
                  </div>
                  <div>
                    <p className="font-medium">{delta.playerName}</p>
                    {delta.rankChange !== 0 && (
                      <p
                        className={cn(
                          'text-xs font-medium',
                          delta.rankChange > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        )}
                      >
                        {delta.rankChange > 0 ? '↑' : '↓'}{' '}
                        {Math.abs(delta.rankChange)} place
                        {Math.abs(delta.rankChange) !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-bold text-white">
                  {delta.currentScore} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top This Round */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-wide">
            Top This Round
          </h2>
          <div className="flex flex-col gap-2">
            {topScorers.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3">
                <p className="text-gray-500">No correct answers</p>
              </div>
            ) : (
              topScorers.map((result, i) => (
                <div
                  key={result.playerId}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white',
                        MEDAL_COLORS[i] ?? 'bg-gray-700'
                      )}
                    >
                      {i + 1}
                    </div>
                    <p className="font-medium">{result.playerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      +{result.pointsEarned}
                    </p>
                    {result.timeTaken !== null && (
                      <p className="text-xs text-gray-400">
                        {result.timeTaken.toFixed(1)}s
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
