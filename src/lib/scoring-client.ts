/**
 * Calculate points based on scoring strategy
 * This mirrors the domain layer scoring logic for client-side preview
 */

export type ScoringAlgorithm = 'EXPONENTIAL_DECAY' | 'LINEAR' | 'FIXED';

export interface ScoreCalculationParams {
  basePoints: number;
  timeTaken: number;
  totalTime: number;
  algorithm: ScoringAlgorithm;
  decayRate?: number;
}

/**
 * Exponential decay: basePoints * e^(-decayRate * (timeTaken / totalTime))
 * Higher decay rate = more aggressive penalty for slow answers
 */
function exponentialDecay(
  basePoints: number,
  timeTaken: number,
  totalTime: number,
  decayRate: number = 2.0
): number {
  if (totalTime <= 0) return basePoints;
  const timeRatio = timeTaken / totalTime;
  return Math.floor(basePoints * Math.exp(-decayRate * timeRatio));
}

/**
 * Linear decay: basePoints * (0.5 + 0.5 * (1 - timeTaken/totalTime))
 * Guarantees minimum 50% of points even at time limit
 */
function linearDecay(
  basePoints: number,
  timeTaken: number,
  totalTime: number
): number {
  if (totalTime <= 0) return basePoints;
  const remainingRatio = Math.max(0, 1 - timeTaken / totalTime);
  return Math.floor(basePoints * (0.5 + 0.5 * remainingRatio));
}

/**
 * Fixed points: no time adjustment
 */
function fixedPoints(basePoints: number): number {
  return basePoints;
}

/**
 * Calculate points for a given time elapsed
 */
export function calculatePoints({
  basePoints,
  timeTaken,
  totalTime,
  algorithm,
  decayRate = 2.0,
}: ScoreCalculationParams): number {
  switch (algorithm) {
    case 'EXPONENTIAL_DECAY':
      return exponentialDecay(basePoints, timeTaken, totalTime, decayRate);
    case 'LINEAR':
      return linearDecay(basePoints, timeTaken, totalTime);
    case 'FIXED':
      return fixedPoints(basePoints);
    default:
      return basePoints;
  }
}

/**
 * Get a human-readable speed indicator based on time taken
 */
export function getSpeedIndicator(
  timeTaken: number,
  totalTime: number
): {
  label: string;
  emoji: string;
  className: string;
} {
  const ratio = timeTaken / totalTime;

  if (ratio < 0.25) {
    return {
      label: 'Lightning fast!',
      emoji: '⚡',
      className: 'text-yellow-400',
    };
  }
  if (ratio < 0.5) {
    return { label: 'Fast', emoji: '🚀', className: 'text-emerald-400' };
  }
  if (ratio < 0.75) {
    return { label: 'Good timing', emoji: '✓', className: 'text-blue-400' };
  }
  if (ratio < 0.9) {
    return { label: 'Steady', emoji: '🐢', className: 'text-orange-400' };
  }
  return { label: 'Just in time!', emoji: '⏱️', className: 'text-red-400' };
}
