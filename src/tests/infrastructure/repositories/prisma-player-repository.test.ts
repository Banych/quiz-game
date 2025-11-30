import { beforeEach, describe, expect, it, vi } from 'vitest';

const playerMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  findFirst: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@infrastructure/database/prisma/client', () => ({
  prisma: {
    player: playerMocks,
  },
}));

import { PrismaPlayerRepository } from '@infrastructure/repositories/prisma-player.repository';
import { Player, PlayerStatus } from '@domain/entities/player';
import { prisma } from '@infrastructure/database/prisma/client';

const repository = new PrismaPlayerRepository();

describe('PrismaPlayerRepository', () => {
  beforeEach(() => {
    Object.values(playerMocks).forEach((mockFn) => mockFn.mockReset());
  });

  it('finds a player by id', async () => {
    playerMocks.findUnique.mockResolvedValue({
      id: 'player-1',
      quizId: 'quiz-1',
      name: 'Alice',
      status: 'Active',
      rank: 1,
      score: 10,
      connectedAt: new Date(),
      disconnectedAt: null,
      updatedAt: new Date(),
    });

    const player = await repository.findById('player-1');

    expect(player).toEqual(
      expect.objectContaining({
        id: 'player-1',
        quizId: 'quiz-1',
        name: 'Alice',
        status: PlayerStatus.Active,
        rank: 1,
      })
    );
    expect(prisma.player.findUnique).toHaveBeenCalledWith({
      where: { id: 'player-1' },
    });
  });

  it('returns null when player is missing', async () => {
    playerMocks.findUnique.mockResolvedValue(null);

    const result = await repository.findById('missing');

    expect(result).toBeNull();
  });

  it('lists players by quiz id', async () => {
    playerMocks.findMany.mockResolvedValue([
      {
        id: 'player-1',
        quizId: 'quiz-1',
        name: 'Alice',
        status: 'Active',
        rank: 1,
        score: 0,
        connectedAt: new Date(),
        disconnectedAt: null,
        updatedAt: new Date(),
      },
      {
        id: 'player-2',
        quizId: 'quiz-1',
        name: 'Bob',
        status: 'Disconnected',
        rank: null,
        score: 0,
        connectedAt: new Date(),
        disconnectedAt: null,
        updatedAt: new Date(),
      },
    ]);

    const players = await repository.listByQuizId('quiz-1');

    expect(players).toHaveLength(2);
    expect(players[0].status).toBe(PlayerStatus.Active);
    expect(players[1].status).toBe(PlayerStatus.Disconnected);
    expect(prisma.player.findMany).toHaveBeenCalledWith({
      where: { quizId: 'quiz-1' },
      orderBy: { connectedAt: 'asc' },
    });
  });

  it('saves a player', async () => {
    playerMocks.upsert.mockResolvedValue({ id: 'player-1' });

    const player = new Player('player-1', 'Alice', 'quiz-1');
    player.updateScore(15);
    player.rank = 2;

    await repository.save(player);

    expect(prisma.player.upsert).toHaveBeenCalledTimes(1);
  });

  it('finds a player by quiz and name', async () => {
    playerMocks.findFirst.mockResolvedValue({
      id: 'player-2',
      quizId: 'quiz-1',
      name: 'Bob',
      status: 'Active',
      rank: null,
      score: 0,
      connectedAt: new Date(),
      disconnectedAt: null,
      updatedAt: new Date(),
    });

    const player = await repository.findByQuizIdAndName('quiz-1', 'Bob');

    expect(player?.name).toBe('Bob');
    expect(prisma.player.findFirst).toHaveBeenCalledWith({
      where: {
        quizId: 'quiz-1',
        name: { equals: 'Bob', mode: 'insensitive' },
      },
    });
  });

  it('updates player status', async () => {
    playerMocks.update.mockResolvedValue({ id: 'player-1' });

    await repository.updateStatus('player-1', PlayerStatus.Disconnected);

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { status: PlayerStatus.Disconnected },
    });
  });

  it('updates player score', async () => {
    playerMocks.update.mockResolvedValue({ id: 'player-1' });

    await repository.updateScore('player-1', { score: 42, rank: 1 });

    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { score: 42, rank: 1 },
    });
  });

  it('deletes a player', async () => {
    playerMocks.delete.mockResolvedValue({ id: 'player-1' });

    await repository.delete('player-1');

    expect(prisma.player.delete).toHaveBeenCalledWith({
      where: { id: 'player-1' },
    });
  });
});
