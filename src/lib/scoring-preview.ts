import { createScoringStrategy } from '@domain/value-objects/scoring-strategy';

export type ScoringAlgorithmType = 'EXPONENTIAL_DECAY' | 'LINEAR' | 'FIXED';

export interface ScoringPreviewPoint {
  timeTaken: number;
  pointsEarned: number;
}

/**
 * Calculate preview points for sample timings to show in admin UI.
 * Returns an array of points earned at 2s, 5s, 8s, and 10s response times.
 *
 * @param basePoints - The base points for the question (e.g., 100)
 * @param totalTime - The total time allowed (e.g., 10 seconds)
 * @param algorithm - The scoring algorithm to use
 * @param decayRate - The decay rate (required for EXPONENTIAL_DECAY and LINEAR)
 * @returns Array of preview points at [2s, 5s, 8s, 10s]
 */
export function calculatePreviewPoints(
  basePoints: number,
  totalTime: number,
  algorithm: ScoringAlgorithmType,
  decayRate?: number
): ScoringPreviewPoint[] {
  const strategy = createScoringStrategy(algorithm, decayRate);
  const sampleTimings = [2, 5, 8, 10];

  return sampleTimings.map((timeTaken) => ({
    timeTaken,
    pointsEarned: strategy.calculate(basePoints, timeTaken, totalTime),
  }));
}

/**
 * Format scoring preview for display in admin UI.
 * Returns a human-readable string showing points at each sample timing.
 *
 * @param previewPoints - Array of preview points from calculatePreviewPoints()
 * @returns Formatted string like "2s → 67 pts, 5s → 36 pts, 8s → 20 pts, 10s → 13 pts"
 */
export function formatScoringPreview(
  previewPoints: ScoringPreviewPoint[]
): string {
  return previewPoints
    .map((point) => `${point.timeTaken}s → ${point.pointsEarned} pts`)
    .join(', ');
}

/**
 * Get a description of the scoring algorithm for help text.
 *
 * @param algorithm - The scoring algorithm
 * @returns Human-readable description of how the algorithm works
 */
export function getScoringAlgorithmDescription(
  algorithm: ScoringAlgorithmType
): string {
  switch (algorithm) {
    case 'EXPONENTIAL_DECAY':
      return 'Points decay exponentially based on response time. Fast answers earn significantly more points. Uses formula: basePoints × e^(-decayRate × timeRatio)';
    case 'LINEAR':
      return 'Points decrease linearly with time. Each second costs the same fraction of points. Uses formula: basePoints × (1 - decayRate × timeRatio)';
    case 'FIXED':
      return 'All correct answers earn the same points regardless of speed. Time pressure is removed from scoring.';
    default:
      return 'Unknown scoring algorithm';
  }
}

/**
 * Get recommended decay rates with descriptions.
 * Useful for preset buttons in admin UI.
 */
export const DECAY_RATE_PRESETS = [
  { value: 0.5, label: 'Gentle', description: 'Minimal time pressure' },
  { value: 1.5, label: 'Moderate', description: 'Balanced scoring' },
  { value: 2.0, label: 'Default', description: 'Standard time pressure' },
  { value: 4.0, label: 'Aggressive', description: 'High time pressure' },
] as const;
