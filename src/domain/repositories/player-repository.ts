import { Player, PlayerStatus } from '@domain/entities/player';

export type PlayerScoreUpdate = {
  score: number;
  rank?: number | null;
};

export interface IPlayerRepository {
  findById(id: string): Promise<Player | null>;
  listByQuizId(quizId: string): Promise<Player[]>;
  findByQuizIdAndName(quizId: string, name: string): Promise<Player | null>;
  save(player: Player): Promise<void>;
  updateStatus(playerId: string, status: PlayerStatus): Promise<void>;
  updateScore(playerId: string, update: PlayerScoreUpdate): Promise<void>;
  updateLastSeenAt(playerId: string, timestamp: Date): Promise<void>;
  delete(id: string): Promise<void>;
}
