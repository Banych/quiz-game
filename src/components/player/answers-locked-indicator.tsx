'use client';

import { useEffect, useState } from 'react';
import type { RoundSummaryDTO } from '@application/dtos/round-summary.dto';
import { cn } from '@/lib/utils';

interface AnswersLockedIndicatorProps {
  roundSummary: RoundSummaryDTO | null;
  className?: string;
}

export function AnswersLockedIndicator({
  roundSummary,
  className,
}: AnswersLockedIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (roundSummary) {
      setIsVisible(true);
    }
  }, [roundSummary]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'animate-in fade-in zoom-in-95 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <svg
            className="h-5 w-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-amber-950">Answers Locked</p>
          <p className="text-sm text-amber-900">
            No more answers can be submitted for this question.
          </p>
          {roundSummary && (
            <div className="mt-2 rounded-lg bg-white/30 px-3 py-2 text-sm text-amber-900">
              <p className="font-medium">
                {roundSummary.correctCount} out of {roundSummary.totalPlayers}{' '}
                got it right
              </p>
              {roundSummary.averageTime !== null && (
                <p className="text-xs text-amber-800">
                  Average time: {roundSummary.averageTime.toFixed(1)}s
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
