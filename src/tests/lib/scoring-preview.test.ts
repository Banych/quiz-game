import { describe, it, expect } from 'vitest';
import {
  calculatePreviewPoints,
  formatScoringPreview,
  getScoringAlgorithmDescription,
  DECAY_RATE_PRESETS,
} from '@lib/scoring-preview';

describe('scoring-preview', () => {
  describe('calculatePreviewPoints', () => {
    it('should calculate exponential decay preview points', () => {
      const preview = calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY', 2.0);

      expect(preview).toHaveLength(4);
      expect(preview[0]).toEqual({ timeTaken: 2, pointsEarned: 67 });
      expect(preview[1]).toEqual({ timeTaken: 5, pointsEarned: 36 });
      expect(preview[2]).toEqual({ timeTaken: 8, pointsEarned: 20 });
      expect(preview[3]).toEqual({ timeTaken: 10, pointsEarned: 13 });
    });

    it('should calculate exponential decay with gentle decay rate', () => {
      const preview = calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY', 0.5);

      expect(preview[0]).toEqual({ timeTaken: 2, pointsEarned: 90 });
      expect(preview[1]).toEqual({ timeTaken: 5, pointsEarned: 77 });
      expect(preview[2]).toEqual({ timeTaken: 8, pointsEarned: 67 });
      expect(preview[3]).toEqual({ timeTaken: 10, pointsEarned: 60 });
    });

    it('should calculate exponential decay with aggressive decay rate', () => {
      const preview = calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY', 4.0);

      expect(preview[0]).toEqual({ timeTaken: 2, pointsEarned: 44 });
      expect(preview[1]).toEqual({ timeTaken: 5, pointsEarned: 13 });
      expect(preview[2]).toEqual({ timeTaken: 8, pointsEarned: 4 });
      expect(preview[3]).toEqual({ timeTaken: 10, pointsEarned: 1 });
    });

    it('should calculate linear decay preview points', () => {
      const preview = calculatePreviewPoints(100, 10, 'LINEAR');

      expect(preview).toHaveLength(4);
      expect(preview[0]).toEqual({ timeTaken: 2, pointsEarned: 90 });
      expect(preview[1]).toEqual({ timeTaken: 5, pointsEarned: 75 });
      expect(preview[2]).toEqual({ timeTaken: 8, pointsEarned: 60 });
      expect(preview[3]).toEqual({ timeTaken: 10, pointsEarned: 50 });
    });

    it('should calculate fixed points preview', () => {
      const preview = calculatePreviewPoints(100, 10, 'FIXED');

      expect(preview).toHaveLength(4);
      expect(preview[0]).toEqual({ timeTaken: 2, pointsEarned: 100 });
      expect(preview[1]).toEqual({ timeTaken: 5, pointsEarned: 100 });
      expect(preview[2]).toEqual({ timeTaken: 8, pointsEarned: 100 });
      expect(preview[3]).toEqual({ timeTaken: 10, pointsEarned: 100 });
    });

    it('should work with different base points', () => {
      const preview = calculatePreviewPoints(50, 10, 'EXPONENTIAL_DECAY', 2.0);

      expect(preview[0].pointsEarned).toBe(33); // 50 * 0.67 rounded
      expect(preview[1].pointsEarned).toBe(18); // 50 * 0.36 rounded
    });

    it('should work with different total time', () => {
      const preview = calculatePreviewPoints(100, 30, 'EXPONENTIAL_DECAY', 2.0);

      // With 30s total time, 2s is only 6.7% elapsed (vs 20% with 10s)
      // So points decay much slower
      expect(preview[0].pointsEarned).toBeGreaterThan(80);
      // 10s out of 30s = 33% elapsed, so still significant points
      expect(preview[3].pointsEarned).toBeGreaterThan(45);
    });

    it('should throw error if decay rate missing for exponential', () => {
      expect(() => {
        calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY');
      }).toThrow('Decay rate is required for EXPONENTIAL_DECAY algorithm');
    });

    it('should accept decay rate for linear (though not used)', () => {
      // LINEAR strategy accepts decay rate for API consistency but doesn't use it
      const preview = calculatePreviewPoints(100, 10, 'LINEAR', 1.0);
      expect(preview[1].pointsEarned).toBe(75); // Same result as without decay rate
    });

    it('should throw error if decay rate out of bounds for exponential', () => {
      expect(() => {
        calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY', 0.05);
      }).toThrow('Decay rate must be between 0.1 and 5.0');

      expect(() => {
        calculatePreviewPoints(100, 10, 'EXPONENTIAL_DECAY', 6.0);
      }).toThrow('Decay rate must be between 0.1 and 5.0');
    });
  });

  describe('formatScoringPreview', () => {
    it('should format preview points as readable string', () => {
      const preview = [
        { timeTaken: 2, pointsEarned: 67 },
        { timeTaken: 5, pointsEarned: 36 },
        { timeTaken: 8, pointsEarned: 20 },
        { timeTaken: 10, pointsEarned: 13 },
      ];

      const formatted = formatScoringPreview(preview);

      expect(formatted).toBe(
        '2s → 67 pts, 5s → 36 pts, 8s → 20 pts, 10s → 13 pts'
      );
    });

    it('should format fixed points preview', () => {
      const preview = [
        { timeTaken: 2, pointsEarned: 100 },
        { timeTaken: 5, pointsEarned: 100 },
        { timeTaken: 8, pointsEarned: 100 },
        { timeTaken: 10, pointsEarned: 100 },
      ];

      const formatted = formatScoringPreview(preview);

      expect(formatted).toBe(
        '2s → 100 pts, 5s → 100 pts, 8s → 100 pts, 10s → 100 pts'
      );
    });

    it('should handle empty array', () => {
      const formatted = formatScoringPreview([]);

      expect(formatted).toBe('');
    });
  });

  describe('getScoringAlgorithmDescription', () => {
    it('should return description for exponential decay', () => {
      const desc = getScoringAlgorithmDescription('EXPONENTIAL_DECAY');

      expect(desc).toContain('exponentially');
      expect(desc).toContain('e^(-decayRate');
    });

    it('should return description for linear', () => {
      const desc = getScoringAlgorithmDescription('LINEAR');

      expect(desc).toContain('linearly');
      expect(desc).toContain('1 - decayRate');
    });

    it('should return description for fixed', () => {
      const desc = getScoringAlgorithmDescription('FIXED');

      expect(desc).toContain('same points');
      expect(desc).toContain('regardless of speed');
    });
  });

  describe('DECAY_RATE_PRESETS', () => {
    it('should export 4 preset decay rates', () => {
      expect(DECAY_RATE_PRESETS).toHaveLength(4);
    });

    it('should include gentle preset (0.5)', () => {
      const gentle = DECAY_RATE_PRESETS.find((p) => p.label === 'Gentle');

      expect(gentle).toBeDefined();
      expect(gentle?.value).toBe(0.5);
      expect(gentle?.description).toContain('Minimal');
    });

    it('should include moderate preset (1.5)', () => {
      const moderate = DECAY_RATE_PRESETS.find((p) => p.label === 'Moderate');

      expect(moderate).toBeDefined();
      expect(moderate?.value).toBe(1.5);
    });

    it('should include default preset (2.0)', () => {
      const defaultPreset = DECAY_RATE_PRESETS.find(
        (p) => p.label === 'Default'
      );

      expect(defaultPreset).toBeDefined();
      expect(defaultPreset?.value).toBe(2.0);
    });

    it('should include aggressive preset (4.0)', () => {
      const aggressive = DECAY_RATE_PRESETS.find(
        (p) => p.label === 'Aggressive'
      );

      expect(aggressive).toBeDefined();
      expect(aggressive?.value).toBe(4.0);
      expect(aggressive?.description).toContain('High');
    });
  });
});
