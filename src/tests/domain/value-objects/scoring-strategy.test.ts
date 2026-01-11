import { describe, it, expect } from 'vitest';
import {
  ExponentialDecayStrategy,
  LinearDecayStrategy,
  FixedPointsStrategy,
  createScoringStrategy,
  type ScoringAlgorithmType,
} from '@domain/value-objects/scoring-strategy';

describe('ExponentialDecayStrategy', () => {
  it('should return full points for instant answer (0 seconds)', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(100, 0, 10);
    expect(points).toBe(100);
  });

  it('should return reduced points for mid-range answer', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(100, 5, 10);
    // exp(-2.0 * 0.5) = exp(-1.0) ≈ 0.368
    expect(points).toBe(36); // Math.floor(36.8)
  });

  it('should return minimum points for answer at time limit', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(100, 10, 10);
    // exp(-2.0 * 1.0) = exp(-2.0) ≈ 0.135
    expect(points).toBe(13); // Math.floor(13.5)
  });

  it('should handle gentle decay rate (0.5)', () => {
    const strategy = new ExponentialDecayStrategy(0.5);
    const points = strategy.calculate(100, 5, 10);
    // exp(-0.5 * 0.5) = exp(-0.25) ≈ 0.779
    expect(points).toBe(77);
  });

  it('should handle aggressive decay rate (5.0)', () => {
    const strategy = new ExponentialDecayStrategy(5.0);
    const points = strategy.calculate(100, 5, 10);
    // exp(-5.0 * 0.5) = exp(-2.5) ≈ 0.082
    expect(points).toBe(8);
  });

  it('should cap time ratio at 1.0 for overtime answers', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(100, 15, 10); // 15s > 10s limit
    // Should use timeRatio = 1.0, not 1.5
    expect(points).toBe(13); // Same as at-limit answer
  });

  it('should return 0 for 0 base points', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(0, 5, 10);
    expect(points).toBe(0);
  });

  it('should return base points when total time is 0', () => {
    const strategy = new ExponentialDecayStrategy(2.0);
    const points = strategy.calculate(100, 5, 0);
    expect(points).toBe(100);
  });

  it('should throw error for decay rate below 0.1', () => {
    expect(() => new ExponentialDecayStrategy(0.05)).toThrow(
      'Decay rate must be between 0.1 and 5.0'
    );
  });

  it('should throw error for decay rate above 5.0', () => {
    expect(() => new ExponentialDecayStrategy(5.5)).toThrow(
      'Decay rate must be between 0.1 and 5.0'
    );
  });

  it('should calculate realistic game scenario', () => {
    const strategy = new ExponentialDecayStrategy(2.0);

    // Fast player (2s out of 10s)
    expect(strategy.calculate(100, 2, 10)).toBe(67); // exp(-0.4) ≈ 0.670

    // Average player (5s out of 10s)
    expect(strategy.calculate(100, 5, 10)).toBe(36);

    // Slow player (8s out of 10s)
    expect(strategy.calculate(100, 8, 10)).toBe(20); // exp(-1.6) ≈ 0.201
  });
});

describe('LinearDecayStrategy', () => {
  it('should return full points for instant answer', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 0, 10);
    expect(points).toBe(100);
  });

  it('should return 75% points for mid-range answer', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 5, 10);
    // 0.5 + 0.5 * (1 - 0.5) = 0.75
    expect(points).toBe(75);
  });

  it('should return minimum 50% points at time limit', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 10, 10);
    // 0.5 + 0.5 * 0 = 0.5
    expect(points).toBe(50);
  });

  it('should give 90% points for fast answer (2s)', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 2, 10);
    // 0.5 + 0.5 * 0.8 = 0.9
    expect(points).toBe(90);
  });

  it('should give 60% points for slow answer (8s)', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 8, 10);
    // 0.5 + 0.5 * 0.2 = 0.6
    expect(points).toBe(60);
  });

  it('should cap time ratio at 1.0 for overtime', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 15, 10);
    expect(points).toBe(50); // Same as at-limit
  });

  it('should return 0 for 0 base points', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(0, 5, 10);
    expect(points).toBe(0);
  });

  it('should return base points when total time is 0', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(100, 5, 0);
    expect(points).toBe(100);
  });

  it('should handle small point values correctly', () => {
    const strategy = new LinearDecayStrategy();
    const points = strategy.calculate(10, 5, 10);
    expect(points).toBe(7); // Math.floor(7.5)
  });
});

describe('FixedPointsStrategy', () => {
  it('should return base points regardless of time', () => {
    const strategy = new FixedPointsStrategy();

    expect(strategy.calculate(100, 0, 10)).toBe(100);
    expect(strategy.calculate(100, 5, 10)).toBe(100);
    expect(strategy.calculate(100, 10, 10)).toBe(100);
    expect(strategy.calculate(100, 20, 10)).toBe(100); // Even overtime
  });

  it('should return 0 for 0 base points', () => {
    const strategy = new FixedPointsStrategy();
    expect(strategy.calculate(0, 5, 10)).toBe(0);
  });

  it('should work with any time values', () => {
    const strategy = new FixedPointsStrategy();
    expect(strategy.calculate(50, 999, 0)).toBe(50);
  });
});

describe('createScoringStrategy factory', () => {
  it('should create ExponentialDecayStrategy with valid decay rate', () => {
    const strategy = createScoringStrategy('EXPONENTIAL_DECAY', 2.0);
    expect(strategy).toBeInstanceOf(ExponentialDecayStrategy);
    expect(strategy.calculate(100, 5, 10)).toBe(36);
  });

  it('should create LinearDecayStrategy', () => {
    const strategy = createScoringStrategy('LINEAR');
    expect(strategy).toBeInstanceOf(LinearDecayStrategy);
    expect(strategy.calculate(100, 5, 10)).toBe(75);
  });

  it('should create FixedPointsStrategy', () => {
    const strategy = createScoringStrategy('FIXED');
    expect(strategy).toBeInstanceOf(FixedPointsStrategy);
    expect(strategy.calculate(100, 5, 10)).toBe(100);
  });

  it('should throw error when decay rate missing for EXPONENTIAL_DECAY', () => {
    expect(() => createScoringStrategy('EXPONENTIAL_DECAY')).toThrow(
      'Decay rate is required for EXPONENTIAL_DECAY algorithm'
    );
  });

  it('should throw error when decay rate provided for FIXED', () => {
    expect(() => createScoringStrategy('FIXED', 2.0)).toThrow(
      'Decay rate should not be provided for FIXED algorithm'
    );
  });

  it('should throw error for unknown algorithm', () => {
    expect(() =>
      createScoringStrategy('UNKNOWN' as ScoringAlgorithmType)
    ).toThrow('Unknown scoring algorithm: UNKNOWN');
  });

  it('should validate decay rate bounds via strategy constructor', () => {
    expect(() => createScoringStrategy('EXPONENTIAL_DECAY', 0.05)).toThrow(
      'Decay rate must be between 0.1 and 5.0'
    );
    expect(() => createScoringStrategy('EXPONENTIAL_DECAY', 6.0)).toThrow(
      'Decay rate must be between 0.1 and 5.0'
    );
  });
});

describe('Strategy comparison', () => {
  it('should show different strategies produce different scores', () => {
    const exponential = createScoringStrategy('EXPONENTIAL_DECAY', 2.0);
    const linear = createScoringStrategy('LINEAR');
    const fixed = createScoringStrategy('FIXED');

    const basePoints = 100;
    const timeTaken = 5;
    const totalTime = 10;

    expect(exponential.calculate(basePoints, timeTaken, totalTime)).toBe(36);
    expect(linear.calculate(basePoints, timeTaken, totalTime)).toBe(75);
    expect(fixed.calculate(basePoints, timeTaken, totalTime)).toBe(100);
  });

  it('should show exponential rewards speed more than linear', () => {
    const exponential = createScoringStrategy('EXPONENTIAL_DECAY', 2.0);
    const linear = createScoringStrategy('LINEAR');

    // Fast answer (2s)
    const fastExponential = exponential.calculate(100, 2, 10);
    const fastLinear = linear.calculate(100, 2, 10);
    expect(fastExponential).toBeLessThan(fastLinear); // 67 < 90

    // But still significant difference from slow answer
    const slowExponential = exponential.calculate(100, 8, 10);
    expect(fastExponential - slowExponential).toBeGreaterThan(45); // 67 - 20 = 47
  });
});
