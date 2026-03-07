import { beforeEach, describe, expect, it, vi } from 'vitest';

const snapshotMocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  findMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock('@infrastructure/database/prisma/client', () => ({
  prisma: {
    leaderboardSnapshot: snapshotMocks,
  },
}));

import { PrismaLeaderboardSnapshotRepository } from '@infrastructure/repositories/prisma-leaderboard-snapshot.repository';
import { prisma } from '@infrastructure/database/prisma/client';

const repository = new PrismaLeaderboardSnapshotRepository();

describe('PrismaLeaderboardSnapshotRepository', () => {
  beforeEach(() => {
    Object.values(snapshotMocks).forEach((mockFn) => mockFn.mockReset());
  });

  it('saves snapshots with calculated ranks', async () => {
    const leaderboard = [
      { playerId: 'p1', score: 150 },
      { playerId: 'p2', score: 100 },
      { playerId: 'p3', score: 50 },
    ];

    await repository.saveSnapshots('quiz-1', 0, leaderboard);

    expect(prisma.leaderboardSnapshot.createMany).toHaveBeenCalledWith({
      data: [
        {
          quizId: 'quiz-1',
          questionIndex: 0,
          playerId: 'p1',
          score: 150,
          rank: 1,
        },
        {
          quizId: 'quiz-1',
          questionIndex: 0,
          playerId: 'p2',
          score: 100,
          rank: 2,
        },
        {
          quizId: 'quiz-1',
          questionIndex: 0,
          playerId: 'p3',
          score: 50,
          rank: 3,
        },
      ],
    });
  });

  it('finds snapshots by quiz and question', async () => {
    snapshotMocks.findMany.mockResolvedValue([
      {
        id: 's1',
        quizId: 'quiz-1',
        questionIndex: 0,
        playerId: 'p1',
        score: 100,
        rank: 1,
        capturedAt: new Date(),
      },
    ]);

    const snapshots = await repository.findByQuizAndQuestion('quiz-1', 0);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      quizId: 'quiz-1',
      questionIndex: 0,
      playerId: 'p1',
      score: 100,
      rank: 1,
    });
    expect(prisma.leaderboardSnapshot.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1', questionIndex: 0 },
      orderBy: { rank: 'asc' },
    });
  });

  it('finds snapshots by quiz and player', async () => {
    snapshotMocks.findMany.mockResolvedValue([
      {
        id: 's1',
        quizId: 'quiz-1',
        questionIndex: 0,
        playerId: 'p1',
        score: 50,
        rank: 2,
        capturedAt: new Date(),
      },
      {
        id: 's2',
        quizId: 'quiz-1',
        questionIndex: 1,
        playerId: 'p1',
        score: 100,
        rank: 1,
        capturedAt: new Date(),
      },
    ]);

    const snapshots = await repository.findByQuizAndPlayer('quiz-1', 'p1');

    expect(snapshots).toHaveLength(2);
    expect(prisma.leaderboardSnapshot.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1', playerId: 'p1' },
      orderBy: { questionIndex: 'asc' },
    });
  });

  it('finds all snapshots for a quiz', async () => {
    snapshotMocks.findMany.mockResolvedValue([
      {
        id: 's1',
        quizId: 'quiz-1',
        questionIndex: 0,
        playerId: 'p1',
        score: 100,
        rank: 1,
        capturedAt: new Date(),
      },
      {
        id: 's2',
        quizId: 'quiz-1',
        questionIndex: 1,
        playerId: 'p1',
        score: 150,
        rank: 1,
        capturedAt: new Date(),
      },
    ]);

    const snapshots = await repository.findByQuiz('quiz-1');

    expect(snapshots).toHaveLength(2);
    expect(prisma.leaderboardSnapshot.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1' },
      orderBy: [{ questionIndex: 'asc' }, { rank: 'asc' }],
    });
  });

  it('deletes all snapshots for a quiz', async () => {
    await repository.deleteByQuiz('quiz-1');

    expect(prisma.leaderboardSnapshot.deleteMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1' },
    });
  });

  it('returns empty array when no snapshots found', async () => {
    snapshotMocks.findMany.mockResolvedValue([]);

    const snapshots = await repository.findByQuizAndQuestion('quiz-1', 0);

    expect(snapshots).toEqual([]);
  });
});
