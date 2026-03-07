'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';

interface RoundSummaryDialogProps {
  summary: RoundSummaryDTO | null;
  onClose: () => void;
}

export function RoundSummaryDialog({
  summary,
  onClose,
}: RoundSummaryDialogProps) {
  if (!summary) return null;

  const sortedResults = [...summary.playerResults].sort(
    (a, b) => b.pointsEarned - a.pointsEarned
  );

  return (
    <Dialog open={!!summary} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Round Summary</DialogTitle>
          <DialogDescription>
            Question {summary.questionIndex + 1}: {summary.questionText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Stats */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold mb-3">Question Stats</h3>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Correct Answer</p>
                <p className="font-mono text-lg font-semibold text-green-600">
                  {summary.correctAnswer}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Players Correct</p>
                <p className="text-lg font-semibold">
                  {summary.correctCount} / {summary.totalPlayers}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Average Time</p>
                <p className="text-lg font-semibold">
                  {summary.averageTime !== null
                    ? `${summary.averageTime.toFixed(1)}s`
                    : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Player Results */}
          <section>
            <h3 className="font-semibold mb-3">Player Results</h3>
            <div className="space-y-2">
              {sortedResults.map((result) => {
                const delta = summary.leaderboardDeltas.find(
                  (d) => d.playerId === result.playerId
                );
                return (
                  <div
                    key={result.playerId}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      result.correct
                        ? 'border-green-600/20 bg-green-600/5'
                        : 'border-border bg-card'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                          result.correct
                            ? 'bg-green-600 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {delta?.currentRank ?? '—'}
                      </div>
                      <div>
                        <p className="font-medium">{result.playerName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {result.answerSubmitted ? (
                            <>
                              <span
                                className={cn(
                                  result.correct
                                    ? 'text-green-600 font-medium'
                                    : 'text-red-600 font-medium'
                                )}
                              >
                                {result.correct ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                              {result.timeTaken !== null && (
                                <span>• {result.timeTaken.toFixed(1)}s</span>
                              )}
                            </>
                          ) : (
                            <span>No answer submitted</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        +{result.pointsEarned}
                      </p>
                      {delta && delta.rankChange !== 0 && (
                        <p
                          className={cn(
                            'text-xs font-medium',
                            delta.rankChange > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {delta.rankChange > 0 ? '↑' : '↓'}{' '}
                          {Math.abs(delta.rankChange)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Leaderboard Changes */}
          <section>
            <h3 className="font-semibold mb-3">Leaderboard</h3>
            <div className="space-y-2">
              {summary.leaderboardDeltas.map((delta) => (
                <div
                  key={delta.playerId}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {delta.currentRank}
                    </div>
                    <div>
                      <p className="font-medium">{delta.playerName}</p>
                      {delta.previousRank !== null && (
                        <p className="text-xs text-muted-foreground">
                          Was #{delta.previousRank}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {delta.currentScore} pts
                    </p>
                    {delta.rankChange !== 0 && (
                      <p
                        className={cn(
                          'text-xs font-medium',
                          delta.rankChange > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {delta.rankChange > 0 ? '↑' : '↓'}{' '}
                        {Math.abs(delta.rankChange)} place
                        {Math.abs(delta.rankChange) !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Button onClick={onClose} className="w-full">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
