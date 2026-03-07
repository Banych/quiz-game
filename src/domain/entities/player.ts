import {
  ConnectionStatus,
  type ConnectionStatusType,
} from '@domain/value-objects/connection-status';

export enum PlayerStatus {
  Active = 'Active',
  Disconnected = 'Disconnected',
  Finished = 'Finished',
}

export class Player {
  id: string;
  name: string;
  quizId: string;
  status: PlayerStatus;
  score: number;
  rank?: number;
  lastSeenAt: Date | null;

  constructor(id: string, name: string, quizId: string) {
    this.id = id;
    this.name = name;
    this.quizId = quizId;
    this.status = PlayerStatus.Active;
    this.score = 0;
    this.lastSeenAt = new Date();
  }

  updateStatus(newStatus: PlayerStatus): void {
    this.status = newStatus;
  }

  updateScore(newScore: number): void {
    this.score = newScore;
  }

  updateRank(newRank?: number | null): void {
    this.rank = newRank ?? undefined;
  }

  updateLastSeenAt(timestamp: Date = new Date()): void {
    this.lastSeenAt = timestamp;
  }

  /**
   * Gets the connection status derived from lastSeenAt.
   * This is a computed value based on how recently the player was seen.
   */
  getConnectionStatus(now: Date = new Date()): ConnectionStatus {
    return ConnectionStatus.fromLastSeenAt(this.lastSeenAt, now);
  }

  /**
   * Returns the connection status type for DTO serialization.
   */
  getConnectionStatusType(now: Date = new Date()): ConnectionStatusType {
    return this.getConnectionStatus(now).status;
  }
}
