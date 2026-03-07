import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Quiz } from '@domain/entities/quiz';
import { Question } from '@domain/entities/question';
import { QuizSessionAggregate } from '@domain/aggregates/quiz-session-aggregate';

/**
 * Integration tests for configurable scoring flow (R5 Phase 1)
 *
 * Tests verify:
 * - Exponential decay scoring with various decay rates
 * - Linear decay scoring with 50% minimum guarantee
 * - Fixed points scoring (no decay)
 * - Point calculations match preview utility at [2s, 5s, 8s, 10s] timings
 */
describe('scoring-flow integration tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create test session
  function createTestSession(
    scoringAlgorithm: 'EXPONENTIAL_DECAY' | 'LINEAR' | 'FIXED',
    scoringDecayRate?: number,
    timePerQuestion = 10
  ) {
    const question = new Question(
      'q1',
      'Test Question',
      ['a'],
      'multiple-choice',
      100,
      undefined,
      undefined,
      ['a', 'b', 'c', 'd']
    );

    const quiz = new Quiz(`quiz-${scoringAlgorithm}`, `Test Quiz`, [question], {
      timePerQuestion,
      allowSkipping: false,
      scoringAlgorithm,
      scoringDecayRate,
    });

    const session = new QuizSessionAggregate(quiz, timePerQuestion);
    session.addPlayer('p1');
    session.startQuiz();

    return { session, quiz };
  }

  describe('exponential decay scoring', () => {
    it('should calculate points with default decay rate (2.0) at various timings', () => {
      const timings = [
        { seconds: 2, expectedPoints: 67 }, // exp(-2 * 2/10) ≈ 0.67 → 67 pts
        { seconds: 5, expectedPoints: 36 }, // exp(-2 * 5/10) ≈ 0.368 → 36 pts
        { seconds: 8, expectedPoints: 20 }, // exp(-2 * 8/10) ≈ 0.20 → 20 pts
        { seconds: 10, expectedPoints: 13 }, // exp(-2 * ~10/10) ≈ 0.13 → 13 pts
      ];

      timings.forEach(({ seconds, expectedPoints }) => {
        const { session, quiz } = createTestSession('EXPONENTIAL_DECAY', 2.0);

        // Advance time
        vi.advanceTimersByTime(seconds * 1000);

        // Submit answer
        session.submitAnswer('p1', quiz.questions[0].id, 'a');

        // Check score
        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(expectedPoints);
      });
    });

    it('should calculate points with gentle decay rate (0.5)', () => {
      const timings = [
        { seconds: 2, expectedPoints: 90 }, // exp(-0.5 * 2/10) ≈ 0.90 → 90 pts
        { seconds: 5, expectedPoints: 77 }, // exp(-0.5 * 5/10) ≈ 0.779 → 77 pts
        { seconds: 8, expectedPoints: 67 }, // exp(-0.5 * 8/10) ≈ 0.67 → 67 pts
        { seconds: 10, expectedPoints: 60 }, // exp(-0.5 * ~10/10) ≈ 0.60 → 60 pts
      ];

      timings.forEach(({ seconds, expectedPoints }) => {
        const { session, quiz } = createTestSession('EXPONENTIAL_DECAY', 0.5);
        vi.advanceTimersByTime(seconds * 1000);
        session.submitAnswer('p1', quiz.questions[0].id, 'a');

        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(expectedPoints);
      });
    });

    it('should calculate points with aggressive decay rate (4.0)', () => {
      const timings = [
        { seconds: 2, expectedPoints: 44 }, // exp(-4 * 2/10) ≈ 0.449 → 44 pts
        { seconds: 5, expectedPoints: 13 }, // exp(-4 * 5/10) ≈ 0.135 → 13 pts
        { seconds: 8, expectedPoints: 4 }, // exp(-4 * 8/10) ≈ 0.04 → 4 pts
        { seconds: 10, expectedPoints: 1 }, // exp(-4 * ~10/10) ≈ 0.018 → 1 pt
      ];

      timings.forEach(({ seconds, expectedPoints }) => {
        const { session, quiz } = createTestSession('EXPONENTIAL_DECAY', 4.0);
        vi.advanceTimersByTime(seconds * 1000);
        session.submitAnswer('p1', quiz.questions[0].id, 'a');

        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(expectedPoints);
      });
    });
  });

  describe('linear decay scoring', () => {
    it('should calculate points with 50% minimum guarantee', () => {
      const timings = [
        { seconds: 2, expectedPoints: 90 },
        { seconds: 5, expectedPoints: 75 },
        { seconds: 8, expectedPoints: 60 },
        { seconds: 10, expectedPoints: 50 },
      ];

      timings.forEach(({ seconds, expectedPoints }) => {
        const { session, quiz } = createTestSession('LINEAR', 1.0); // Rate required by validation
        vi.advanceTimersByTime(seconds * 1000);
        session.submitAnswer('p1', quiz.questions[0].id, 'a');

        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(expectedPoints);
      });
    });
  });

  describe('fixed points scoring', () => {
    it('should always award full points regardless of timing', () => {
      const timings = [2, 5, 8, 10];

      timings.forEach((seconds) => {
        const { session, quiz } = createTestSession('FIXED', undefined);
        vi.advanceTimersByTime(seconds * 1000);
        session.submitAnswer('p1', quiz.questions[0].id, 'a');

        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(100);
      });
    });
  });

  describe('incorrect answers', () => {
    it('should award 0 points for incorrect answers regardless of algorithm', () => {
      const algorithms: Array<'EXPONENTIAL_DECAY' | 'LINEAR' | 'FIXED'> = [
        'EXPONENTIAL_DECAY',
        'LINEAR',
        'FIXED',
      ];

      algorithms.forEach((algorithm) => {
        const decayRate = algorithm === 'FIXED' ? undefined : 2.0;
        const { session, quiz } = createTestSession(algorithm, decayRate);

        vi.advanceTimersByTime(2000);
        session.submitAnswer('p1', quiz.questions[0].id, 'b'); // Wrong answer

        const leaderboard = session.getLeaderboard();
        const playerScore = leaderboard.find((s) => s.playerId === 'p1');
        expect(playerScore?.score).toBe(0);
      });
    });
  });
});
