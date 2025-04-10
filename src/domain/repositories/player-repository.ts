import { Player } from '@/domain/entities/player';

export interface IPlayerRepository {
  findById(id: string): Promise<Player | null>;
  save(player: Player): Promise<void>;
  delete(id: string): Promise<void>;
}
