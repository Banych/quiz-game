import { Player, PlayerStatus } from '@domain/entities/player';
import type {
  IPlayerRepository,
  PlayerScoreUpdate,
} from '@domain/repositories/player-repository';
import { prisma } from '@infrastructure/database/prisma/client';
import type { Player as PrismaPlayer } from '@prisma/client';

const mapToDomain = (record: PrismaPlayer): Player => {
  const player = new Player(record.id, record.name, record.quizId);
  player.status = record.status as PlayerStatus;
  player.updateScore(record.score ?? 0);
  player.updateRank(record.rank ?? null);
  return player;
};

export class PrismaPlayerRepository implements IPlayerRepository {
  async findById(id: string): Promise<Player | null> {
    const record = await prisma.player.findUnique({ where: { id } });
    return record ? mapToDomain(record) : null;
  }

  async listByQuizId(quizId: string): Promise<Player[]> {
    const records = await prisma.player.findMany({
      where: { quizId },
      orderBy: { connectedAt: 'asc' },
    });
    return records.map(mapToDomain);
  }

  async findByQuizIdAndName(
    quizId: string,
    name: string
  ): Promise<Player | null> {
    const record = await prisma.player.findFirst({
      where: {
        quizId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
    return record ? mapToDomain(record) : null;
  }

  async save(player: Player): Promise<void> {
    await prisma.player.upsert({
      where: { id: player.id },
      create: {
        id: player.id,
        quizId: player.quizId,
        name: player.name,
        status: player.status,
        score: player.score,
        rank: player.rank ?? null,
      },
      update: {
        quizId: player.quizId,
        name: player.name,
        status: player.status,
        score: player.score,
        rank: player.rank ?? null,
      },
    });
  }

  async updateStatus(playerId: string, status: PlayerStatus): Promise<void> {
    await prisma.player.update({
      where: { id: playerId },
      data: { status },
    });
  }

  async updateScore(
    playerId: string,
    update: PlayerScoreUpdate
  ): Promise<void> {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        score: update.score,
        rank: update.rank ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.player.delete({ where: { id } }).catch(() => undefined);
  }
}
